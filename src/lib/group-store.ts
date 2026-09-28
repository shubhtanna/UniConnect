import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { getProfileSummaries } from "@/lib/profile-store";
import { BrainstormGroup } from "@/models/BrainstormGroup";
import { BrainstormMessage } from "@/models/BrainstormMessage";
import { User } from "@/models/User";
import type { z } from "zod";
import type { createGroupSchema } from "@/lib/group-validation";

export async function createGroup(userId: string, input: z.infer<typeof createGroupSchema>) {
  await connectToDatabase();
  const invited = input.inviteEmails.length ? await User.find({ email: { $in: input.inviteEmails }, isEmailVerified: true, isProfileComplete: true }).select("_id").lean() : [];
  const memberIds = [...new Set([userId, ...invited.map((user) => user._id.toString())])];
  const groupInput = {
    name: input.name,
    description: input.description,
    tags: input.tags,
    access: input.access,
  };
  return BrainstormGroup.create({ ...groupInput, createdBy: userId, memberIds });
}

export async function getVisibleGroups(userId: string) {
  await connectToDatabase();
  return BrainstormGroup.find({ status: "active", $or: [{ access: "open" }, { memberIds: userId }] }).sort({ updatedAt: -1 }).limit(100).lean();
}

export async function joinGroup(userId: string, groupId: string) {
  if (!Types.ObjectId.isValid(groupId)) return false;
  await connectToDatabase();
  const result = await BrainstormGroup.updateOne({ _id: groupId, status: "active", access: "open", "memberIds.49": { $exists: false } }, { $addToSet: { memberIds: userId } });
  return result.matchedCount > 0;
}

export async function getGroupRoom(userId: string, groupId: string) {
  if (!Types.ObjectId.isValid(groupId)) return null;
  await connectToDatabase();
  const group = await BrainstormGroup.findOne({ _id: groupId, status: "active", $or: [{ access: "open" }, { memberIds: userId }] }).lean();
  if (!group) return null;
  const isMember = group.memberIds.some((id) => id.toString() === userId);
  const messages = isMember ? await BrainstormMessage.find({ groupId }).sort({ createdAt: 1 }).limit(200).lean() : [];
  const summaries = await getProfileSummaries([...new Set(messages.map((message) => message.authorId.toString()))]);
  return { group, isMember, messages: messages.map((message) => ({ id: message._id.toString(), body: message.body, createdAt: message.createdAt.toISOString(), author: summaries[message.authorId.toString()] })) };
}

export async function addGroupMessage(userId: string, groupId: string, body: string) {
  if (!Types.ObjectId.isValid(groupId)) return false;
  await connectToDatabase();
  const group = await BrainstormGroup.exists({ _id: groupId, status: "active", memberIds: userId });
  if (!group) return false;
  await BrainstormMessage.create({ groupId, authorId: userId, body });
  await BrainstormGroup.updateOne({ _id: groupId }, { $set: { updatedAt: new Date() } });
  return true;
}
