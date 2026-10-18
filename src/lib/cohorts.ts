// Official cohort list. Every profile must belong to one of these labels, so the
// directory filter never merges different programmes or years. To open UniConnect
// to another cohort, add its official label and the tag used in its students'
// email addresses (e.g. "name_pgpaias27@mastersunion.org" -> "pgpaias27").
export type Cohort = {
  label: string;
  emailTag: string;
  // Spellings typed before the fixed list existed. Only add values that are
  // unambiguous for this cohort.
  legacyAliases?: RegExp[];
};

export const COHORTS: readonly Cohort[] = [
  {
    label: "PGP AIAS 2026-27",
    emailTag: "pgpaias27",
    legacyAliases: [
      /^pgp aias( cohort)?( 2026| 2027| 2026 27| 2026 2027)?$/,
      /^pgp( cohort)? (2026|2027|2026 27)$/,
    ],
  },
];

export const COHORT_LABELS = COHORTS.map((cohort) => cohort.label);

function simplify(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[_,\-–/]+/g, " ")
    .replace(/\s+/g, " ");
}

export function isKnownCohort(value: string) {
  return COHORT_LABELS.includes(value);
}

// Maps a stored value to its official label; unknown values are only tidied.
export function canonicalizeCohort(value: string) {
  const simplified = simplify(value);
  if (!simplified) return "";
  const match = COHORTS.find(
    (cohort) =>
      simplify(cohort.label) === simplified ||
      cohort.legacyAliases?.some((alias) => alias.test(simplified)),
  );
  return match ? match.label : value.trim().replace(/\s+/g, " ");
}

export function cohortFromEmail(email: string) {
  const local = email.trim().toLocaleLowerCase().split("@")[0] ?? "";
  const tag = local.includes("_") ? local.slice(local.lastIndexOf("_") + 1) : "";
  return COHORTS.find((cohort) => cohort.emailTag === tag)?.label ?? "";
}
