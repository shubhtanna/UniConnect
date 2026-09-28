import type { SearchableProfile } from "@/lib/connection-types";
import type { DirectoryResponse } from "@/lib/directory-types";
import type { DirectoryQuery } from "@/lib/directory-validation";
import { getDirectoryProfiles } from "@/lib/profile-store";
import { unstable_cache } from "next/cache";

export const DIRECTORY_PAGE_SIZE = 12;
const getCachedDirectoryProfiles = unstable_cache(
  () => getDirectoryProfiles(1000),
  ["directory-profiles"],
  { revalidate: 30 },
);

export function filterDirectoryProfiles(
  profiles: SearchableProfile[],
  filters: Omit<DirectoryQuery, "page">,
) {
  const query = normalize(filters.q);
  const cohort = normalize(canonicalizeCohort(filters.cohort));
  const skill = normalize(filters.skill);
  const interest = normalize(filters.interest);
  const lookingFor = normalize(filters.lookingFor);

  return profiles.filter((profile) => {
    if (cohort && normalize(canonicalizeCohort(profile.cohort)) !== cohort)
      return false;
    if (skill && !profile.skills.some((item) => normalize(item) === skill))
      return false;
    if (
      interest &&
      !profile.interests.some((item) => normalize(item) === interest)
    )
      return false;
    if (lookingFor && !normalize(profile.lookingFor).includes(lookingFor))
      return false;
    if (!query) return true;
    return normalize(
      [
        profile.name,
        profile.cohort,
        profile.skills.join(" "),
        profile.interests.join(" "),
        profile.lookingFor,
        profile.currentProject,
      ].join(" "),
    ).includes(query);
  });
}

export async function browseDirectory(
  filters: DirectoryQuery,
): Promise<DirectoryResponse> {
  const allProfiles = await getCachedDirectoryProfiles();
  const sorted = [...allProfiles].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  const filtered = filterDirectoryProfiles(sorted, filters);
  const start = filters.page * DIRECTORY_PAGE_SIZE;

  return {
    profiles: filtered
      .slice(start, start + DIRECTORY_PAGE_SIZE)
      .map((profile) => ({
        userId: profile.userId,
        profileState: profile.profileState ?? "claimed",
        name: profile.name,
        profilePhotoUrl: profile.profilePhotoUrl,
        cohort: canonicalizeCohort(profile.cohort),
        skills: profile.skills,
        interests: profile.interests,
        lookingFor: profile.lookingFor,
        currentProject: profile.currentProject,
      })),
    total: filtered.length,
    page: filters.page,
    pageSize: DIRECTORY_PAGE_SIZE,
    hasMore: start + DIRECTORY_PAGE_SIZE < filtered.length,
    facets: {
      cohorts: uniqueSorted(
        sorted.map((profile) => canonicalizeCohort(profile.cohort)),
      ),
      skills: uniqueSorted(sorted.flatMap((profile) => profile.skills)).slice(
        0,
        100,
      ),
      interests: uniqueSorted(
        sorted.flatMap((profile) => profile.interests),
      ).slice(0, 100),
    },
  };
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function canonicalizeCohort(value: string) {
  const cleaned = value
    .trim()
    .replace(/[_,-]+/g, " ")
    .replace(/\s+/g, " ");
  const normalized = cleaned.toLocaleLowerCase();
  if (
    /\bpgp\b/.test(normalized) &&
    (/\baias\b/.test(normalized) || /\bcohort\b/.test(normalized))
  )
    return "PGP AIAS";
  return cleaned;
}

function uniqueSorted(values: string[]) {
  const unique = new Map<string, string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed && !unique.has(normalize(trimmed)))
      unique.set(normalize(trimmed), trimmed);
  }
  return [...unique.values()].sort((left, right) => left.localeCompare(right));
}
