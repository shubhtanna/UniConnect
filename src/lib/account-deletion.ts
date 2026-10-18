import { Types } from "mongoose";
import { deleteMemoryUser } from "@/lib/auth-store";
import { connectToDatabase } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { deleteStoredFile } from "@/lib/file-storage";
import { logServerError } from "@/lib/logger";
import { deleteMemoryProfile } from "@/lib/profile-store";
import { BrainstormGroup } from "@/models/BrainstormGroup";
import { BrainstormMessage } from "@/models/BrainstormMessage";
import { EmailOtp } from "@/models/EmailOtp";
import { GroupInvitation } from "@/models/GroupInvitation";
import { Post } from "@/models/Post";
import { PreloadedProfile } from "@/models/PreloadedProfile";
import { Profile } from "@/models/Profile";
import { ProfileView } from "@/models/ProfileView";
import { User } from "@/models/User";

async function deleteFiles(urls: string[], userId: string) {
  for (const url of new Set(urls.filter(Boolean))) {
    try {
      await deleteStoredFile(url, userId);
    } catch (error) {
      // A missing or already-removed file must not block account deletion.
      logServerError("account_file_delete_failed", error, "warn");
    }
  }
}

// Permanently removes a user and everything they created. The user record is
// deleted last so a failed run can simply be retried by the same session.
export async function deleteAccount(userId: string, email: string) {
  if (getServerEnv().DATABASE_MODE === "memory") {
    const profile = deleteMemoryProfile(userId);
    await deleteFiles([profile?.profilePhotoUrl ?? "", profile?.resumeUrl ?? ""], userId);
    deleteMemoryUser(userId);
    return;
  }

  await connectToDatabase();
  const id = new Types.ObjectId(userId);

  const [profile, posts] = await Promise.all([
    Profile.findOne({ userId: id }).select("profilePhotoUrl resumeUrl").lean(),
    Post.find({ authorId: id }).select("mediaUrls").lean(),
  ]);
  await deleteFiles(
    [
      profile?.profilePhotoUrl ?? "",
      profile?.resumeUrl ?? "",
      ...posts.flatMap((post) => post.mediaUrls ?? []),
    ],
    userId,
  );

  const ownedGroupIds = (
    await BrainstormGroup.find({ createdBy: id }).select("_id").lean()
  ).map((group) => group._id);

  await Promise.all([
    Post.deleteMany({ authorId: id }),
    Post.updateMany(
      { $or: [{ "comments.userId": id }, { likes: id }] },
      { $pull: { comments: { userId: id }, likes: id } },
    ),
    BrainstormMessage.deleteMany({
      $or: [{ authorId: id }, { groupId: { $in: ownedGroupIds } }],
    }),
    GroupInvitation.deleteMany({
      $or: [
        { groupId: { $in: ownedGroupIds } },
        { invitedBy: id },
        { invitedUserId: id },
        { invitedEmail: email },
      ],
    }),
    BrainstormGroup.updateMany({ memberIds: id }, { $pull: { memberIds: id } }),
    ProfileView.deleteMany({ $or: [{ viewerUserId: id }, { viewedUserId: id }] }),
    PreloadedProfile.deleteMany({ $or: [{ email }, { claimedUserId: id }] }),
    EmailOtp.deleteMany({ email }),
  ]);
  await BrainstormGroup.deleteMany({ _id: { $in: ownedGroupIds } });
  await Profile.deleteOne({ userId: id });
  await User.deleteOne({ _id: id });
}
