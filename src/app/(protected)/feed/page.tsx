import { requireCompleteUser } from "@/lib/auth";
import { getProfileByUserId } from "@/lib/profile-store";
import { FeedClient } from "@/components/feed/FeedClient";

export default async function FeedPage() {
  const user = await requireCompleteUser();
  const profile = await getProfileByUserId(user.id);
  return <FeedClient currentUser={{ name: profile?.name ?? "MU Student", photoUrl: profile?.profilePhotoUrl ?? "", cohort: profile?.cohort ?? "Masters' Union" }} />;
}
