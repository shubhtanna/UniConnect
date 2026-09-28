import assert from "node:assert/strict";
import test from "node:test";
import { extractedProfileSchema, extractProfileFieldsLocally } from "@/lib/resume";

test("resume projects normalize AI lists into review form text", () => {
  const result = extractedProfileSchema.parse({
    currentProject: ["Campus marketplace", { name: "Growth project", description: "Consumer research" }],
  });
  assert.equal(result.currentProject, "Campus marketplace\nGrowth project — Consumer research");
});

test("resume projects accept missing, null and plain text values", () => {
  for (const currentProject of [undefined, null, "A student venture"]) {
    assert.equal(extractedProfileSchema.parse({ currentProject }).currentProject, currentProject ?? "");
  }
});

test("local resume extraction keeps generated experience fields within profile limits", () => {
  const result = extractProfileFieldsLocally([
    "Test Student",
    "EXPERIENCE",
    `Company ${"A".repeat(180)}`,
    `Product Manager ${"B".repeat(180)}`,
    "Jan 2020 - Jan 2021",
    "Built and shipped a product.",
  ].join("\n"));

  assert.equal(result.workExperience.length, 1);
  assert.equal(result.workExperience[0].company.length, 120);
  assert.equal(result.workExperience[0].role.length, 120);
  assert.ok(result.workExperience[0].duration.length <= 100);
  assert.ok(result.workExperience[0].description.length <= 1000);
});
