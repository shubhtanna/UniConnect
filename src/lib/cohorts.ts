// Official cohort list, grouped by programme and using short labels that fit on
// mobile. Every profile must belong to one of these labels, so the directory
// filter never merges different programmes or batches.
//
// To add a cohort, append its short label to the right programme. When the
// students' MU email carries a batch tag (e.g. "name_pgpaias27@mastersunion.org"
// -> "pgpaias27"), add it as `emailTag` so the cohort is pre-selected for them.
export type Cohort = {
  label: string;
  emailTag?: string;
  // Spellings typed before the fixed list existed. Only add values that are
  // unambiguous for this cohort.
  legacyAliases?: RegExp[];
};

export type CohortGroup = { programme: string; cohorts: Cohort[] };

const numbered = (prefix: string, numbers: Array<number | string>) =>
  numbers.map((number) => ({ label: `${prefix}${number}` }));

export const COHORT_GROUPS: readonly CohortGroup[] = [
  {
    programme: "PGP Technology & Business Management",
    cohorts: [
      ...numbered("PGP TBM C", [1, 2, 3, 5, 6, 7]),
      { label: "PGP TBM 2024" },
      { label: "PGP TBM 2026" },
    ],
  },
  { programme: "PGP TBM – Young Leaders", cohorts: numbered("PGP TBM YL C", [1, 2]) },
  {
    programme: "PGP Applied AI & Agentic Systems",
    cohorts: [
      {
        label: "PGP AIAS 27",
        emailTag: "pgpaias27",
        legacyAliases: [
          /^pgp aias( cohort)?( 2026| 2027| 2026 27| 2026 2027)?$/,
          /^pgp( cohort)? (2026|2027|2026 27)$/,
        ],
      },
    ],
  },
  { programme: "PGP Sports Management & Gaming", cohorts: [{ label: "PGP SMG C1" }] },
  { programme: "PGP HR & Organisation Strategy", cohorts: [{ label: "PGP HROS C1" }] },
  { programme: "PGP Sustainability & Business Management", cohorts: [{ label: "PGP SBM 27" }] },
  { programme: "PGP Entrepreneurship & Business Acceleration", cohorts: numbered("PGP EBA C", [1, 2]) },
  { programme: "PGP Capital Markets & Trading", cohorts: [{ label: "PGP CMT" }] },
  { programme: "PGP Rise – General Management", cohorts: [{ label: "PGP Rise" }] },
  { programme: "PGP Bharat", cohorts: numbered("PGP Bharat C", [1, 2, 3]) },
  { programme: "UG Technology & Business Management", cohorts: numbered("UG TBM ", [27, 28, 29, 30]) },
  { programme: "UG Psychology & Marketing", cohorts: numbered("UG PSM ", [29, 30]) },
  { programme: "UG Finance & Economics", cohorts: [{ label: "UG FE 30" }] },
  { programme: "UG Data Science & AI", cohorts: [{ label: "UG DSAI" }] },
  { programme: "Strategic Business Management", cohorts: numbered("SBM C", [1, 2, 3, 4, 5]) },
  { programme: "SBM – Leadership & Strategy", cohorts: [{ label: "SBM-LS C1" }] },
  { programme: "Owners & Promoters Management", cohorts: numbered("OPM C", [1, 2, 3]) },
  { programme: "Strategic Marketing & AI", cohorts: [{ label: "Strategic Marketing & AI" }] },
  { programme: "Human Resource Management", cohorts: [{ label: "HR Management" }] },
  { programme: "Applied Finance", cohorts: [{ label: "Applied Finance" }] },
  { programme: "Applied Auditing & Analytics", cohorts: [{ label: "AAA C1" }] },
  { programme: "DevLaunch Program", cohorts: numbered("DevLaunch C", [1, 2]) },
  {
    programme: "Bootcamps",
    cohorts: [
      { label: "PM Bootcamp C4" },
      { label: "D2C Bootcamp C1" },
      { label: "Creatorpreneur C1" },
      { label: "UX & Design Bootcamp" },
      { label: "Growth Experiment Q1" },
    ],
  },
];

export const COHORTS: readonly Cohort[] = COHORT_GROUPS.flatMap((group) => group.cohorts);

export const COHORT_LABELS = COHORTS.map((cohort) => cohort.label);

function simplify(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[_,\-–/']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  if (!tag) return "";
  return COHORTS.find((cohort) => cohort.emailTag === tag)?.label ?? "";
}
