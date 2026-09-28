import assert from "node:assert/strict";
import test from "node:test";
import type { SearchableProfile } from "@/lib/connection-types";
import { canonicalizeCohort, filterDirectoryProfiles } from "@/lib/directory";

const profiles: SearchableProfile[] = [
  profile(
    "1",
    "Aarav Shah",
    "PGP AIAS 2026-27",
    ["Python", "Fintech"],
    "A technical cofounder",
    "Payments prototype",
  ),
  profile(
    "2",
    "Diya Rao",
    "PGP TBM 2025-26",
    ["Brand Strategy", "D2C"],
    "Consumer research collaborators",
    "Skincare brand",
  ),
];

test("directory keyword search spans names, skills, projects and intentions", () => {
  for (const query of ["Aarav", "fintech", "payments", "cofounder"]) {
    const result = filterDirectoryProfiles(profiles, {
      q: query,
      cohort: "",
      skill: "",
      interest: "",
      lookingFor: "",
    });
    assert.deepEqual(
      result.map((item) => item.userId),
      ["1"],
    );
  }
});

test("directory filters combine cohort, exact skill and looking-for text", () => {
  const result = filterDirectoryProfiles(profiles, {
    q: "",
    cohort: "PGP TBM 2025-26",
    skill: "d2c",
    interest: "",
    lookingFor: "research",
  });
  assert.deepEqual(
    result.map((item) => item.userId),
    ["2"],
  );
});

test("directory filters are case-insensitive and do not mutate source profiles", () => {
  const before = structuredClone(profiles);
  assert.equal(
    filterDirectoryProfiles(profiles, {
      q: "BRAND",
      cohort: "",
      skill: "",
      interest: "",
      lookingFor: "",
    }).length,
    1,
  );
  assert.deepEqual(profiles, before);
});

test("all PGP AIAS year labels are treated as one cohort", () => {
  for (const value of [
    "PGP AIAS",
    "PGP AIAS 2026",
    "PGP AIAS 2026-27",
    "PGP, COHORT 2027",
  ]) {
    assert.equal(canonicalizeCohort(value), "PGP AIAS");
  }
  const result = filterDirectoryProfiles(profiles, {
    q: "",
    cohort: "PGP AIAS",
    skill: "",
    interest: "",
    lookingFor: "",
  });
  assert.deepEqual(
    result.map((item) => item.userId),
    ["1"],
  );
});

function profile(
  userId: string,
  name: string,
  cohort: string,
  skills: string[],
  lookingFor: string,
  currentProject: string,
): SearchableProfile {
  return {
    userId,
    name,
    profilePhotoUrl: "",
    cohort,
    skills,
    interests: userId === "1" ? ["Startups", "Fintech"] : ["D2C", "Beauty"],
    workExperience: [],
    education: [],
    currentProject,
    lookingFor,
    linkedinUrl: "",
    contactLink: "",
    resumeEmbedding: [],
  };
}
