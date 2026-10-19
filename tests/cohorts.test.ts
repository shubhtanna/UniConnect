import assert from "node:assert/strict";
import test from "node:test";
import { COHORT_LABELS, cohortFromEmail, isKnownCohort } from "@/lib/cohorts";

test("cohort is suggested from the MU email tag", () => {
  assert.equal(cohortFromEmail("Name.Surname_PGPAIAS27@mastersunion.org"), "PGP AIAS 27");
  assert.equal(cohortFromEmail("name.surname@mastersunion.org"), "");
  assert.equal(cohortFromEmail("name_unknown99@mastersunion.org"), "");
});

test("only official labels are accepted", () => {
  assert.ok(COHORT_LABELS.length > 0);
  assert.equal(isKnownCohort("PGP AIAS 27"), true);
  assert.equal(isKnownCohort("PGP AIAS"), false);
  assert.equal(new Set(COHORT_LABELS).size, COHORT_LABELS.length);
});

test("every MU programme has short, unique cohort labels", () => {
  for (const label of COHORT_LABELS) assert.ok(label.length <= 24, label);
  for (const label of ["PGP TBM C7", "PGP TBM YL C2", "UG TBM 30", "SBM-LS C1", "PGP Bharat C3", "DevLaunch C2"]) {
    assert.equal(isKnownCohort(label), true, label);
  }
});

test("the earlier PGP AIAS label maps to the new short label", async () => {
  const { canonicalizeCohort } = await import("@/lib/cohorts");
  assert.equal(canonicalizeCohort("PGP AIAS 2026-27"), "PGP AIAS 27");
  assert.equal(canonicalizeCohort("pgp tbm c5"), "PGP TBM C5");
});
