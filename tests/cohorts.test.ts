import assert from "node:assert/strict";
import test from "node:test";
import { COHORT_LABELS, cohortFromEmail, isKnownCohort } from "@/lib/cohorts";

test("cohort is suggested from the MU email tag", () => {
  assert.equal(cohortFromEmail("Name.Surname_PGPAIAS27@mastersunion.org"), "PGP AIAS 2026-27");
  assert.equal(cohortFromEmail("name.surname@mastersunion.org"), "");
  assert.equal(cohortFromEmail("name_unknown99@mastersunion.org"), "");
});

test("only official labels are accepted", () => {
  assert.ok(COHORT_LABELS.length > 0);
  assert.equal(isKnownCohort("PGP AIAS 2026-27"), true);
  assert.equal(isKnownCohort("PGP AIAS"), false);
  assert.equal(new Set(COHORT_LABELS).size, COHORT_LABELS.length);
});
