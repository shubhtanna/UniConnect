import type { SearchableProfile } from "@/lib/connection-types";

export type SuggestedClassmate = {
  userId: string;
  name: string;
  profilePhotoUrl: string;
  cohort: string;
  shared: string[];
};

const key = (value: string) => value.trim().toLocaleLowerCase();

// Ranks classmates by volunteered overlap only: shared interests count double,
// shared skills once. People with nothing in common are never suggested.
export function suggestClassmates(
  me: Pick<SearchableProfile, "userId" | "skills" | "interests">,
  profiles: SearchableProfile[],
  limit = 3,
): SuggestedClassmate[] {
  const mySkills = new Set(me.skills.map(key));
  const myInterests = new Set(me.interests.map(key));

  return profiles
    .filter((profile) => profile.userId !== me.userId)
    .map((profile) => {
      const sharedInterests = profile.interests.filter((item) => myInterests.has(key(item)));
      const sharedSkills = profile.skills.filter((item) => mySkills.has(key(item)));
      return {
        profile,
        shared: [...sharedInterests, ...sharedSkills],
        score: sharedInterests.length * 2 + sharedSkills.length,
      };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.profile.name.localeCompare(right.profile.name))
    .slice(0, limit)
    .map(({ profile, shared }) => ({
      userId: profile.userId,
      name: profile.name,
      profilePhotoUrl: profile.profilePhotoUrl,
      cohort: profile.cohort,
      shared: shared.slice(0, 3),
    }));
}
