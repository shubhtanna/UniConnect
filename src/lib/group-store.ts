import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { getProfileSummaries } from "@/lib/profile-store";
import { BrainstormGroup } from "@/models/BrainstormGroup";
import { BrainstormMessage } from "@/models/BrainstormMessage";
import { GroupInvitation } from "@/models/GroupInvitation";
import { sendGroupInvitationEmail } from "@/lib/email";
import type { z } from "zod";
import type {
  createGroupSchema,
  updateGroupSchema,
} from "@/lib/group-validation";

export async function createGroup(
  userId: string,
  inviterEmail: string,
  origin: string,
  input: z.infer<typeof createGroupSchema>,
) {
  await connectToDatabase();
  const groupInput = {
    name: input.name,
    description: input.description,
    tags: input.tags,
    access: input.access,
  };
  const group = await BrainstormGroup.create({
    ...groupInput,
    createdBy: userId,
    memberIds: [userId],
  });

  const invitationEmails = input.inviteEmails.filter(
    (email) => email !== inviterEmail,
  );
  if (!invitationEmails.length) {
    return {
      group,
      invitationSummary: { created: 0, sent: 0, failed: 0 },
    };
  }

  const invitations = await GroupInvitation.insertMany(
    invitationEmails.map((invitedEmail) => ({
      groupId: group._id,
      invitedEmail,
      invitedBy: userId,
    })),
  );

  const deliveryResults = await Promise.allSettled(
    invitations.map(async (invitation) => {
      const invitationUrl = new URL(
        `/groups?invite=${invitation._id.toString()}`,
        origin,
      ).toString();
      await sendGroupInvitationEmail({
        email: invitation.invitedEmail,
        inviterEmail,
        groupName: group.name,
        invitationUrl,
      });
      await GroupInvitation.updateOne(
        { _id: invitation._id },
        { $set: { deliveryStatus: "sent", sentAt: new Date() } },
      );
    }),
  );

  const failedInvitationIds = deliveryResults.flatMap((result, index) =>
    result.status === "rejected" ? [invitations[index]._id] : [],
  );
  if (failedInvitationIds.length) {
    await GroupInvitation.updateMany(
      { _id: { $in: failedInvitationIds } },
      { $set: { deliveryStatus: "failed" } },
    );
  }

  return {
    group,
    invitationSummary: {
      created: invitations.length,
      sent: invitations.length - failedInvitationIds.length,
      failed: failedInvitationIds.length,
    },
  };
}

export async function getPendingGroupInvitations(email: string) {
  await connectToDatabase();
  const invitations = await GroupInvitation.find({
    invitedEmail: email,
    status: "pending",
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const groupIds = invitations.map((invitation) => invitation.groupId);
  const groups = await BrainstormGroup.find({
    _id: { $in: groupIds },
    status: "active",
  })
    .select("name description tags access createdBy")
    .lean();
  const groupsById = new Map(
    groups.map((group) => [group._id.toString(), group]),
  );

  return invitations.flatMap((invitation) => {
    const group = groupsById.get(invitation.groupId.toString());
    if (!group) return [];
    return [
      {
        id: invitation._id.toString(),
        groupId: group._id.toString(),
        groupName: group.name,
        description: group.description,
        tags: group.tags,
        access: group.access,
        deliveryStatus: invitation.deliveryStatus,
        createdAt: invitation.createdAt.toISOString(),
      },
    ];
  });
}

export async function respondToGroupInvitation({
  userId,
  email,
  invitationId,
  action,
}: {
  userId: string;
  email: string;
  invitationId: string;
  action: "accept" | "decline";
}) {
  if (!Types.ObjectId.isValid(invitationId)) return "not_found" as const;
  await connectToDatabase();
  const session = await BrainstormGroup.startSession();

  try {
    let outcome: "accepted" | "declined" | "not_found" | "group_full" =
      "not_found";
    await session.withTransaction(async () => {
      const invitation = await GroupInvitation.findOne({
        _id: invitationId,
        invitedEmail: email,
        status: "pending",
      }).session(session);
      if (!invitation) return;

      if (action === "decline") {
        invitation.status = "declined";
        invitation.invitedUserId = new Types.ObjectId(userId);
        invitation.respondedAt = new Date();
        await invitation.save({ session });
        outcome = "declined";
        return;
      }

      const group = await BrainstormGroup.findOne({
        _id: invitation.groupId,
        status: "active",
      }).session(session);
      if (!group) return;

      const isAlreadyMember = group.memberIds.some(
        (memberId) => memberId.toString() === userId,
      );
      if (!isAlreadyMember && group.memberIds.length >= 50) {
        outcome = "group_full";
        return;
      }

      if (!isAlreadyMember) {
        group.memberIds.push(new Types.ObjectId(userId));
        await group.save({ session });
      }
      invitation.status = "accepted";
      invitation.invitedUserId = new Types.ObjectId(userId);
      invitation.respondedAt = new Date();
      await invitation.save({ session });
      outcome = "accepted";
    });
    return outcome;
  } finally {
    await session.endSession();
  }
}

export async function getVisibleGroups(userId: string) {
  await connectToDatabase();
  return BrainstormGroup.find({
    status: "active",
    $or: [{ access: "open" }, { memberIds: userId }],
  })
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();
}

export async function joinGroup(userId: string, groupId: string) {
  if (!Types.ObjectId.isValid(groupId)) return false;
  await connectToDatabase();
  const result = await BrainstormGroup.updateOne(
    {
      _id: groupId,
      status: "active",
      access: "open",
      "memberIds.49": { $exists: false },
    },
    { $addToSet: { memberIds: userId } },
  );
  return result.matchedCount > 0;
}

export async function getGroupRoom(userId: string, groupId: string) {
  if (!Types.ObjectId.isValid(groupId)) return null;
  await connectToDatabase();
  const group = await BrainstormGroup.findOne({
    _id: groupId,
    status: "active",
    $or: [{ access: "open" }, { memberIds: userId }],
  }).lean();
  if (!group) return null;
  const isMember = group.memberIds.some((id) => id.toString() === userId);
  const messages = isMember
    ? await BrainstormMessage.find({ groupId })
        .sort({ createdAt: 1 })
        .limit(200)
        .lean()
    : [];
  const summaries = await getProfileSummaries([
    ...new Set(messages.map((message) => message.authorId.toString())),
  ]);
  const isOwner = group.createdBy.toString() === userId;
  const invitations = isOwner
    ? await GroupInvitation.find({ groupId })
        .select("invitedEmail status deliveryStatus createdAt respondedAt")
        .sort({ createdAt: -1 })
        .lean()
    : [];
  return {
    group,
    isMember,
    isOwner,
    invitations: invitations.map((invitation) => ({
      id: invitation._id.toString(),
      email: invitation.invitedEmail,
      status: invitation.status,
      deliveryStatus: invitation.deliveryStatus,
      createdAt: invitation.createdAt.toISOString(),
      respondedAt: invitation.respondedAt?.toISOString(),
    })),
    messages: messages.map((message) => ({
      id: message._id.toString(),
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      editedAt: message.editedAt?.toISOString(),
      author: summaries[message.authorId.toString()],
      canEdit: message.authorId.toString() === userId,
      canDelete: message.authorId.toString() === userId || isOwner,
    })),
  };
}

export async function addGroupMessage(
  userId: string,
  groupId: string,
  body: string,
) {
  if (!Types.ObjectId.isValid(groupId)) return false;
  await connectToDatabase();
  const group = await BrainstormGroup.exists({
    _id: groupId,
    status: "active",
    memberIds: userId,
  });
  if (!group) return false;
  await BrainstormMessage.create({ groupId, authorId: userId, body });
  await BrainstormGroup.updateOne(
    { _id: groupId },
    { $set: { updatedAt: new Date() } },
  );
  return true;
}

export async function updateGroup(
  userId: string,
  groupId: string,
  input: z.infer<typeof updateGroupSchema>,
) {
  if (!Types.ObjectId.isValid(groupId)) return false;
  await connectToDatabase();
  const result = await BrainstormGroup.updateOne(
    { _id: groupId, createdBy: userId, status: "active" },
    { $set: input },
    { runValidators: true },
  );
  return result.matchedCount > 0;
}

export async function archiveGroup(userId: string, groupId: string) {
  if (!Types.ObjectId.isValid(groupId)) return false;
  await connectToDatabase();
  const result = await BrainstormGroup.updateOne(
    { _id: groupId, createdBy: userId, status: "active" },
    { $set: { status: "archived" } },
  );
  if (result.matchedCount > 0) {
    await GroupInvitation.updateMany(
      { groupId, status: "pending" },
      { $set: { status: "revoked", respondedAt: new Date() } },
    );
  }
  return result.matchedCount > 0;
}

export async function updateGroupMessage(
  userId: string,
  groupId: string,
  messageId: string,
  body: string,
) {
  if (!Types.ObjectId.isValid(groupId) || !Types.ObjectId.isValid(messageId))
    return false;
  await connectToDatabase();
  const member = await BrainstormGroup.exists({
    _id: groupId,
    status: "active",
    memberIds: userId,
  });
  if (!member) return false;
  const result = await BrainstormMessage.updateOne(
    { _id: messageId, groupId, authorId: userId },
    { $set: { body, editedAt: new Date() } },
    { runValidators: true },
  );
  return result.matchedCount > 0;
}

export async function deleteGroupMessage(
  userId: string,
  groupId: string,
  messageId: string,
) {
  if (!Types.ObjectId.isValid(groupId) || !Types.ObjectId.isValid(messageId))
    return false;
  await connectToDatabase();
  const group = await BrainstormGroup.findOne({
    _id: groupId,
    status: "active",
    memberIds: userId,
  })
    .select("createdBy")
    .lean();
  if (!group) return false;
  const allowed =
    group.createdBy.toString() === userId
      ? { _id: messageId, groupId }
      : { _id: messageId, groupId, authorId: userId };
  return (await BrainstormMessage.deleteOne(allowed)).deletedCount > 0;
}
