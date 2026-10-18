import assert from "node:assert/strict";
import test from "node:test";
import type { SearchableProfile } from "@/lib/connection-types";
import { suggestClassmates } from "@/lib/suggestions";

function person(userId: string, name: string, skills: string[], interests: string[]): SearchableProfile {
  return {
    userId, name, profilePhotoUrl: "", cohort: "PGP AIAS 2026-27", skills, interests,
    workExperience: [], education: [], currentProject: "", lookingFor: "", linkedinUrl: "",
    contactLink: "", resumeEmbedding: [],
  };
}

test("classmate suggestions rank shared interests above shared skills and skip strangers", () => {
  const me = person("me", "Me", ["Python", "SQL"], ["Fintech"]);
  const result = suggestClassmates(me, [
    me,
    person("a", "Asha", ["python"], []),
    person("b", "Bilal", [], ["fintech"]),
    person("c", "Chen", ["Design"], ["Climate"]),
  ]);
  assert.deepEqual(result.map((item) => item.userId), ["b", "a"]);
  assert.deepEqual(result[0]?.shared, ["fintech"]);
});
