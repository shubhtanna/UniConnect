import type { SearchableProfile } from "@/lib/connection-types";
import type { DirectoryResponse } from "@/lib/directory-types";
import type { DirectoryQuery } from "@/lib/directory-validation";
import { getSearchableProfiles } from "@/lib/profile-store";

export const DIRECTORY_PAGE_SIZE = 12;

export function filterDirectoryProfiles(
  profiles: SearchableProfile[],
  filters: Omit<DirectoryQuery, "page">,
) {
  const query = normalize(filters.q);
  const cohort = normalize(filters.cohort);
  const skill = normalize(filters.skill);
  const interest = normalize(filters.interest);
  const lookingFor = normalize(filters.lookingFor);

  return profiles.filter((profile) => {
    if (cohort && normalize(profile.cohort) !== cohort) return false;
    if (skill && !profile.skills.some((item) => normalize(item) === skill)) return false;
    if (interest && !profile.interests.some((item) => normalize(item) === interest)) return false;
    if (lookingFor && !normalize(profile.lookingFor).includes(lookingFor)) return false;
    if (!query) return true;
    return normalize([
      profile.name,
      profile.cohort,
      profile.skills.join(" "),
      profile.interests.join(" "),
      profile.lookingFor,
      profile.currentProject,
    ].join(" ")).includes(query);
  });
}

export async function browseDirectory(
  excludeUserId: string,
  filters: DirectoryQuery,
): Promise<DirectoryResponse> {
  const allProfiles = await getSearchableProfiles(excludeUserId, 1000);
  const sorted = [...allProfiles].sort((left, right) => left.name.localeCompare(right.name));
  const filtered = filterDirectoryProfiles(sorted, filters);
  const start = filters.page * DIRECTORY_PAGE_SIZE;

  return {
    profiles: filtered.slice(start, start + DIRECTORY_PAGE_SIZE).map((profile) => ({
      userId: profile.userId,
      name: profile.name,
      profilePhotoUrl: profile.profilePhotoUrl,
      cohort: profile.cohort,
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
      cohorts: uniqueSorted(sorted.map((profile) => profile.cohort)),
      skills: uniqueSorted(sorted.flatMap((profile) => profile.skills)).slice(0, 100),
      interests: uniqueSorted(sorted.flatMap((profile) => profile.interests)).slice(0, 100),
    },
  };
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

function uniqueSorted(values: string[]) {
  const unique = new Map<string, string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed && !unique.has(normalize(trimmed))) unique.set(normalize(trimmed), trimmed);
  }
  return [...unique.values()].sort((left, right) => left.localeCompare(right));
}
