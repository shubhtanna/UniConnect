import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { getProfileByUserId, getProfileSummaries, getSearchableProfiles } from "@/lib/profile-store";
import type { SearchableProfile } from "@/lib/connection-types";
import { ProfileView } from "@/models/ProfileView";
import { User } from "@/models/User";

export async function recordProfileView(viewerUserId: string, viewedUserId: string) {
  if (viewerUserId === viewedUserId || !Types.ObjectId.isValid(viewerUserId) || !Types.ObjectId.isValid(viewedUserId)) return;
  await connectToDatabase();
  const viewer = await User.findById(viewerUserId).select("profileViewMode").lean();
  if (!viewer) return;
  await ProfileView.findOneAndUpdate(
    { viewerUserId, viewedUserId },
    { $set: { viewerMode: viewer.profileViewMode ?? "named", lastViewedAt: new Date() }, $inc: { viewCount: 1 } },
    { upsert: true, runValidators: true },
  );
}

export async function getDiscoveryInsights(userId: string) {
  await connectToDatabase();
  const [profile, candidates, views, user] = await Promise.all([
    getProfileByUserId(userId),
    getSearchableProfiles(userId, 500),
    ProfileView.find({ viewedUserId: userId, lastViewedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
      .sort({ lastViewedAt: -1 }).limit(30).lean(),
    User.findById(userId).select("profileViewMode").lean(),
  ]);
  const namedViews = views.filter((view) => view.viewerMode === "named");
  const summaries = await getProfileSummaries(namedViews.map((view) => view.viewerUserId.toString()));
  return {
    viewMode: (user?.profileViewMode ?? "named") as "named" | "anonymous",
    anonymousViewers: views.filter((view) => view.viewerMode === "anonymous").length,
    recentViewers: namedViews.flatMap((view) => {
      const summary = summaries[view.viewerUserId.toString()];
      return summary ? [{ ...summary, lastViewedAt: view.lastViewedAt.toISOString(), viewCount: view.viewCount }] : [];
    }),
    peopleLookingForYou: profile ? rankPeopleLookingForYou(profile.skills, profile.interests, candidates).slice(0, 6) : [],
  };
}

export function rankPeopleLookingForYou(skills: string[], interests: string[], candidates: SearchableProfile[]) {
  const capabilities = [...skills, ...interests].map((value) => value.toLowerCase());
  return candidates.map((profile) => {
    const demand = `${profile.lookingFor} ${profile.currentProject}`.toLowerCase();
    const matches = capabilities.filter((item) => item.length >= 2 && demand.includes(item));
    return { profile, matches, score: matches.length };
  }).filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.profile.name.localeCompare(right.profile.name));
}
