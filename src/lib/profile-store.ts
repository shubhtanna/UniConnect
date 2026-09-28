import { randomUUID } from "crypto";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import type { SearchableProfile } from "@/lib/connection-types";
import { getServerEnv } from "@/lib/env";
import type { ProfileInput, StoredProfile } from "@/lib/profile-types";
import { Profile } from "@/models/Profile";
import { PreloadedProfile } from "@/models/PreloadedProfile";
import { User } from "@/models/User";
import { completeMemoryUserProfile } from "@/lib/auth-store";
import { toPublishedPreloadedProfile } from "@/lib/preloaded-profile";

const globalWithProfiles = globalThis as typeof globalThis & {
  uniconnectMemoryProfiles?: Map<string, StoredProfile>;
};

const memoryProfiles =
  globalWithProfiles.uniconnectMemoryProfiles ??
  new Map<string, StoredProfile>();
globalWithProfiles.uniconnectMemoryProfiles = memoryProfiles;

function usesMemoryStore() {
  return getServerEnv().DATABASE_MODE === "memory";
}

export async function saveProfile(userId: string, input: ProfileInput) {
  if (usesMemoryStore()) {
    const existing = memoryProfiles.get(userId);
    const now = new Date().toISOString();
    const profile: StoredProfile = {
      ...input,
      id: existing?.id ?? randomUUID(),
      userId,
      origin: existing?.origin ?? "self",
      sourceResumeName: existing?.sourceResumeName ?? "",
      preloadedNoticeAcknowledgedAt:
        existing?.preloadedNoticeAcknowledgedAt ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    memoryProfiles.set(userId, profile);
    completeMemoryUserProfile(userId);
    return profile;
  }

  await connectToDatabase();
  const profile = await Profile.findOneAndUpdate(
    { userId },
    { $set: input },
    { new: true, upsert: true, runValidators: true },
  )
    .select("+sourceResumeName")
    .lean();
  await User.updateOne({ _id: userId }, { $set: { isProfileComplete: true } });

  return {
    ...input,
    id: profile._id.toString(),
    userId,
    origin: profile.origin,
    sourceResumeName: profile.sourceResumeName,
    preloadedNoticeAcknowledgedAt:
      profile.preloadedNoticeAcknowledgedAt?.toISOString() ?? null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  } satisfies StoredProfile;
}

export async function getProfileByUserId(
  userId: string,
): Promise<StoredProfile | null> {
  if (usesMemoryStore()) return memoryProfiles.get(userId) ?? null;

  await connectToDatabase();
  const profile = await Profile.findOne({ userId })
    .select("+resumeUrl +resumeEmbedding +sourceResumeName")
    .lean();
  if (!profile) return null;

  return {
    id: profile._id.toString(),
    userId,
    name: profile.name,
    profilePhotoUrl: profile.profilePhotoUrl,
    resumeUrl: profile.resumeUrl,
    cohort: profile.cohort,
    skills: profile.skills,
    interests: profile.interests ?? [],
    workExperience: profile.workExperience,
    education: profile.education,
    currentProject: profile.currentProject,
    lookingFor: profile.lookingFor,
    linkedinUrl: profile.linkedinUrl,
    contactLink: profile.contactLink,
    fieldsFilledManually: profile.fieldsFilledManually,
    resumeEmbedding: profile.resumeEmbedding,
    origin: profile.origin,
    sourceResumeName: profile.sourceResumeName,
    preloadedNoticeAcknowledgedAt:
      profile.preloadedNoticeAcknowledgedAt?.toISOString() ?? null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export async function acknowledgePreloadedNotice(userId: string) {
  const acknowledgedAt = new Date().toISOString();
  if (usesMemoryStore()) {
    const profile = memoryProfiles.get(userId);
    if (profile?.origin === "masters_cv")
      profile.preloadedNoticeAcknowledgedAt = acknowledgedAt;
    return;
  }

  await connectToDatabase();
  await Profile.updateOne(
    { userId, origin: "masters_cv", preloadedNoticeAcknowledgedAt: null },
    { $set: { preloadedNoticeAcknowledgedAt: new Date(acknowledgedAt) } },
  );
}

export type ProfileSummary = {
  userId: string;
  name: string;
  profilePhotoUrl: string;
  cohort: string;
};

export async function getProfileSummaries(userIds: string[]) {
  const ids = [...new Set(userIds)];
  if (usesMemoryStore()) {
    return ids.reduce<Record<string, ProfileSummary>>((summaries, id) => {
      const profile = memoryProfiles.get(id);
      if (profile) {
        summaries[id] = {
          userId: id,
          name: profile.name,
          profilePhotoUrl: profile.profilePhotoUrl,
          cohort: profile.cohort,
        };
      }
      return summaries;
    }, {});
  }

  await connectToDatabase();
  const profiles = await Profile.find({ userId: { $in: ids } })
    .select("userId name profilePhotoUrl cohort")
    .lean();
  return profiles.reduce<Record<string, ProfileSummary>>(
    (summaries, profile) => {
      const id = profile.userId.toString();
      summaries[id] = {
        userId: id,
        name: profile.name,
        profilePhotoUrl: profile.profilePhotoUrl,
        cohort: profile.cohort,
      };
      return summaries;
    },
    {},
  );
}

export async function getSearchableProfiles(
  excludeUserId: string,
  limit = 500,
): Promise<SearchableProfile[]> {
  if (usesMemoryStore()) {
    return [...memoryProfiles.values()]
      .filter((profile) => profile.userId !== excludeUserId)
      .slice(0, limit)
      .map(toSearchableProfile);
  }

  await connectToDatabase();
  const eligibleUsers = await User.find({
    _id: { $ne: excludeUserId },
    isEmailVerified: true,
    isProfileComplete: true,
  })
    .select("_id")
    .limit(limit)
    .lean();
  const profiles = await Profile.find({
    userId: { $in: eligibleUsers.map((user) => user._id) },
  })
    .select("+resumeEmbedding")
    .limit(limit)
    .lean();
  return profiles.map((profile) =>
    toSearchableProfile({
      ...profile,
      id: profile._id.toString(),
      userId: profile.userId.toString(),
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    }),
  );
}

export async function getDirectoryProfiles(
  limit = 1000,
): Promise<SearchableProfile[]> {
  if (usesMemoryStore()) {
    return [...memoryProfiles.values()]
      .slice(0, limit)
      .map(toSearchableProfile);
  }

  await connectToDatabase();
  const eligibleUsers = await User.find({
    isEmailVerified: true,
    isProfileComplete: true,
  })
    .select("_id")
    .limit(limit)
    .lean();
  const [profiles, preloadedProfiles] = await Promise.all([
    Profile.find({ userId: { $in: eligibleUsers.map((user) => user._id) } })
      .select("+resumeEmbedding")
      .limit(limit)
      .lean(),
    getPublishedPreloadedProfiles(limit),
  ]);
  const claimedProfiles = profiles.map((profile) =>
    toSearchableProfile({
      ...profile,
      id: profile._id.toString(),
      userId: profile.userId.toString(),
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    }),
  );
  return [...claimedProfiles, ...preloadedProfiles].slice(0, limit);
}

export async function getAtlasVectorProfiles(
  excludeUserId: string,
  embedding: number[],
  limit: number,
): Promise<SearchableProfile[]> {
  if (usesMemoryStore()) return [];
  await connectToDatabase();
  const env = getServerEnv();
  const profiles = await Profile.aggregate([
    {
      $vectorSearch: {
        index: env.ATLAS_VECTOR_INDEX,
        path: "resumeEmbedding",
        queryVector: embedding,
        numCandidates: Math.max(limit * 10, 100),
        limit: Math.max(limit * 3, 30),
      },
    },
    { $match: { userId: { $ne: new Types.ObjectId(excludeUserId) } } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "eligibleUser",
        pipeline: [
          { $match: { isEmailVerified: true, isProfileComplete: true } },
          { $project: { _id: 1 } },
        ],
      },
    },
    { $match: { "eligibleUser.0": { $exists: true } } },
    { $addFields: { vectorScore: { $meta: "vectorSearchScore" } } },
    { $limit: limit },
  ]);
  return profiles.map((profile) =>
    toSearchableProfile({
      ...profile,
      id: profile._id.toString(),
      userId: profile.userId.toString(),
      createdAt: new Date(profile.createdAt).toISOString(),
      updatedAt: new Date(profile.updatedAt).toISOString(),
    }),
  );
}

export async function getConnectionProfile(userId: string) {
  if (usesMemoryStore()) {
    const profile = memoryProfiles.get(userId);
    return profile ? toSearchableProfile(profile) : null;
  }
  if (userId.startsWith("preloaded-") || userId.startsWith("preloaded:")) {
    const preloadedId = userId.replace(/^preloaded[:-]/, "");
    if (!Types.ObjectId.isValid(preloadedId)) return null;
    await connectToDatabase();
    return (await getPublishedPreloadedProfiles(1, preloadedId))[0] ?? null;
  }
  if (!Types.ObjectId.isValid(userId)) return null;
  await connectToDatabase();
  const eligibleUser = await User.exists({
    _id: userId,
    isEmailVerified: true,
    isProfileComplete: true,
  });
  if (!eligibleUser) return null;
  const profile = await Profile.findOne({ userId })
    .select("+resumeEmbedding")
    .lean();
  if (!profile) return null;
  return toSearchableProfile({
    ...profile,
    id: profile._id.toString(),
    userId: profile.userId.toString(),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  });
}

type SearchableProfileSource = Omit<SearchableProfile, "vectorScore"> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  vectorScore?: number;
};

function toSearchableProfile(
  profile: SearchableProfileSource,
): SearchableProfile {
  return {
    userId: profile.userId,
    profileState: profile.profileState ?? "claimed",
    name: profile.name,
    profilePhotoUrl: profile.profilePhotoUrl,
    cohort: profile.cohort,
    skills: profile.skills,
    interests: profile.interests ?? [],
    workExperience: profile.workExperience,
    education: profile.education,
    currentProject: profile.currentProject,
    lookingFor: profile.lookingFor,
    linkedinUrl: profile.linkedinUrl,
    contactLink: profile.contactLink,
    resumeEmbedding: profile.resumeEmbedding,
    vectorScore: profile.vectorScore,
  };
}

async function getPublishedPreloadedProfiles(
  limit: number,
  id?: string,
): Promise<SearchableProfile[]> {
  const query: { status: "pending"; _id?: Types.ObjectId } = {
    status: "pending",
  };
  if (id) query._id = new Types.ObjectId(id);
  const profiles = await PreloadedProfile.find(query)
    .select(
      "name cohort skills interests workExperience education currentProject lookingFor +resumeEmbedding",
    )
    .limit(limit)
    .lean();
  return profiles.map((profile) =>
    toPublishedPreloadedProfile(profile._id.toString(), {
      name: profile.name,
      cohort: profile.cohort,
      skills: profile.skills,
      interests: profile.interests ?? [],
      workExperience: profile.workExperience,
      education: profile.education,
      currentProject: profile.currentProject,
      lookingFor: profile.lookingFor,
      resumeEmbedding: profile.resumeEmbedding,
    }),
  );
}
