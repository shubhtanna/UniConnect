import { requireCompleteUser } from "@/lib/auth";
import { getProfileByUserId } from "@/lib/profile-store";
import { FeedClient } from "@/components/feed/FeedClient";
import { listPosts } from "@/lib/feed-store";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireCompleteUser();
  const requested = (await searchParams).type;
  const initialType = requested === "spotlight" ? "spotlight" : "community";
  const [profile, initialFeed] = await Promise.all([
    getProfileByUserId(user.id),
    listPosts({ type: initialType, currentUserId: user.id, limit: 10 }),
  ]);
  return (
    <FeedClient
      key={initialType}
      initialType={initialType}
      initialPosts={initialFeed.posts}
      initialCursor={initialFeed.nextCursor}
      currentUser={{
        name: profile?.name ?? "MU Student",
        photoUrl: profile?.profilePhotoUrl ?? "",
        cohort: profile?.cohort ?? "Masters' Union",
      }}
    />
  );
}
