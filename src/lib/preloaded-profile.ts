import { connectToDatabase } from "@/lib/db";
import type { Education, ProfileInput, WorkExperience } from "@/lib/profile-types";
import { PreloadedProfile } from "@/models/PreloadedProfile";
import { Profile } from "@/models/Profile";
import { User } from "@/models/User";
import { getServerEnv } from "@/lib/env";
import type { SearchableProfile } from "@/lib/connection-types";

export type PreloadedProfileInput = {
  email: string;
  sourceResumeName: string;
  cohort: string;
  name: string;
  skills: string[];
  interests?: string[];
  workExperience: WorkExperience[];
  education: Education[];
  currentProject: string;
  lookingFor: string;
  linkedinUrl: string;
  contactLink: string;
  fieldsFilledManually: string[];
  resumeEmbedding: number[];
  importBatchId: string;
};

export function toClaimedProfileData(preloaded: PreloadedProfileInput): ProfileInput & {
  origin: "masters_cv";
  sourceResumeName: string;
  preloadedNoticeAcknowledgedAt: null;
} {
  return {
    name: preloaded.name,
    profilePhotoUrl: "",
    resumeUrl: "",
    cohort: preloaded.cohort,
    skills: preloaded.skills,
    interests: preloaded.interests ?? [],
    workExperience: preloaded.workExperience,
    education: preloaded.education,
    currentProject: preloaded.currentProject,
    lookingFor: preloaded.lookingFor,
    linkedinUrl: preloaded.linkedinUrl,
    contactLink: preloaded.contactLink,
    fieldsFilledManually: preloaded.fieldsFilledManually,
    resumeEmbedding: preloaded.resumeEmbedding,
    origin: "masters_cv",
    sourceResumeName: preloaded.sourceResumeName,
    preloadedNoticeAcknowledgedAt: null,
  };
}

export function toPublishedPreloadedProfile(
  id: string,
  preloaded: Omit<PreloadedProfileInput, "email" | "sourceResumeName" | "fieldsFilledManually" | "importBatchId" | "linkedinUrl" | "contactLink">,
): SearchableProfile {
  return {
    userId: `preloaded:${id}`,
    profileState: "unclaimed",
    name: preloaded.name,
    profilePhotoUrl: "",
    cohort: preloaded.cohort,
    skills: preloaded.skills,
    interests: preloaded.interests ?? [],
    workExperience: preloaded.workExperience,
    education: preloaded.education,
    currentProject: preloaded.currentProject,
    lookingFor: preloaded.lookingFor,
    linkedinUrl: "",
    contactLink: "",
    resumeEmbedding: preloaded.resumeEmbedding,
  };
}

export async function stagePreloadedProfile(input: PreloadedProfileInput, replacePending = false) {
  return stagePreloadedProfiles([input], replacePending);
}

export function getProtectedVerifiedEmails(
  users: Array<{ _id: unknown; email: string; isProfileComplete: boolean }>,
  profileOwnerIds: unknown[],
) {
  const owners = new Set(profileOwnerIds.map((id) => String(id)));
  return users
    .filter((user) => user.isProfileComplete || owners.has(String(user._id)))
    .map((user) => user.email);
}

export async function stagePreloadedProfiles(inputs: PreloadedProfileInput[], replacePending = false) {
  if (!inputs.length) throw new Error("The preload batch is empty");
  const emails = inputs.map((input) => input.email);
  const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
  if (duplicateEmails.length) {
    throw new Error(`Duplicate emails in preload batch: ${[...new Set(duplicateEmails)].join(", ")}`);
  }
  const database = await connectToDatabase();
  const session = await database.startSession();
  try {
    await session.withTransaction(async () => {
      const verifiedUsers = await User.find({ email: { $in: emails }, isEmailVerified: true })
        .select("email isProfileComplete")
        .session(session)
        .lean();
      const verifiedProfiles = verifiedUsers.length
        ? await Profile.find({ userId: { $in: verifiedUsers.map((user) => user._id) } })
          .select("userId")
          .session(session)
          .lean()
        : [];
      const protectedEmails = getProtectedVerifiedEmails(
        verifiedUsers.map((user) => ({
          _id: user._id,
          email: user.email,
          isProfileComplete: user.isProfileComplete,
        })),
        verifiedProfiles.map((profile) => profile.userId),
      );
      if (protectedEmails.length) {
        throw new Error(`Complete profiles already exist for: ${protectedEmails.join(", ")}`);
      }

      const existing = await PreloadedProfile.find({ email: { $in: emails } })
        .select("email status")
        .session(session)
        .lean();
      const claimed = existing.filter((profile) => profile.status !== "pending");
      if (claimed.length) {
        throw new Error(`Profiles are already claimed or conflicted for: ${claimed.map((profile) => profile.email).join(", ")}`);
      }
      if (existing.length && !replacePending) {
        throw new Error(`Staged profiles already exist for: ${existing.map((profile) => profile.email).join(", ")}. Use --replace-pending to replace them.`);
      }

      for (const input of inputs) {
        await PreloadedProfile.findOneAndUpdate(
          { email: input.email },
          {
            $set: { ...input, status: "pending", claimedUserId: null, claimedAt: null },
          },
          { upsert: true, runValidators: true, session },
        );
      }
    });
  } finally {
    await session.endSession();
  }
}

export async function claimPreloadedProfile(userId: string, email: string) {
  if (getServerEnv().DATABASE_MODE === "memory") return false;
  const database = await connectToDatabase();
  const session = await database.startSession();
  let claimed = false;

  try {
    await session.withTransaction(async () => {
      const preloaded = await PreloadedProfile.findOne({ email, status: "pending" })
        .select("+resumeEmbedding")
        .session(session)
        .lean();
      if (!preloaded) return;

      const existingProfile = await Profile.findOne({ userId }).session(session).lean();
      if (existingProfile) {
        await PreloadedProfile.updateOne(
          { _id: preloaded._id, status: "pending" },
          { $set: { status: "conflict", claimedUserId: userId, claimedAt: new Date() } },
          { session },
        );
        return;
      }

      const data = toClaimedProfileData({
        email: preloaded.email,
        sourceResumeName: preloaded.sourceResumeName,
        cohort: preloaded.cohort,
        name: preloaded.name,
        skills: preloaded.skills,
        interests: preloaded.interests ?? [],
        workExperience: preloaded.workExperience,
        education: preloaded.education,
        currentProject: preloaded.currentProject,
        lookingFor: preloaded.lookingFor,
        linkedinUrl: preloaded.linkedinUrl,
        contactLink: preloaded.contactLink,
        fieldsFilledManually: preloaded.fieldsFilledManually,
        resumeEmbedding: preloaded.resumeEmbedding,
        importBatchId: preloaded.importBatchId,
      });
      await Profile.create([{ ...data, userId }], { session });
      await User.updateOne(
        { _id: userId, email, isEmailVerified: true },
        { $set: { isProfileComplete: true } },
        { session },
      );
      await PreloadedProfile.updateOne(
        { _id: preloaded._id, status: "pending" },
        { $set: { status: "claimed", claimedUserId: userId, claimedAt: new Date() } },
        { session },
      );
      claimed = true;
    });
  } finally {
    await session.endSession();
  }

  return claimed;
}
