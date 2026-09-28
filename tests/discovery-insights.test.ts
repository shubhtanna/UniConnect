import assert from "node:assert/strict";
import test from "node:test";
import type { SearchableProfile } from "@/lib/connection-types";
import { rankPeopleLookingForYou } from "@/lib/discovery-insights";

test("reverse discovery ranks people whose stated needs match your skills and interests", () => {
  const results = rankPeopleLookingForYou(["Python", "Brand Strategy"], ["Fintech"], [
    candidate("1", "Needs two", "Looking for Python help on a fintech product"),
    candidate("2", "Needs one", "Looking for brand strategy feedback"),
    candidate("3", "Unrelated", "Looking for a photographer"),
  ]);
  assert.deepEqual(results.map((item) => item.profile.userId), ["1", "2"]);
  assert.deepEqual(results[0]?.matches, ["python", "fintech"]);
});

function candidate(userId: string, name: string, lookingFor: string): SearchableProfile {
  return { userId, name, profilePhotoUrl: "", cohort: "PGP 2027", skills: [], interests: [], workExperience: [], education: [], currentProject: "", lookingFor, linkedinUrl: "", contactLink: "", resumeEmbedding: [] };
}
