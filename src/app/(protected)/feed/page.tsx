import { requireCompleteUser } from "@/lib/auth";
import { getProfileByUserId } from "@/lib/profile-store";
import { FeedClient } from "@/components/feed/FeedClient";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireCompleteUser();
  const profile = await getProfileByUserId(user.id);
  const requested = (await searchParams).type;
  return (
    <FeedClient
      initialType={requested === "spotlight" ? "spotlight" : "community"}
      currentUser={{
        name: profile?.name ?? "MU Student",
        photoUrl: profile?.profilePhotoUrl ?? "",
        cohort: profile?.cohort ?? "Masters' Union",
      }}
    />
  );
}
