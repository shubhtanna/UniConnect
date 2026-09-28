import assert from "node:assert/strict";
import test from "node:test";
import {
  completeProfileSchema, normalizeProfileInterests, normalizeProfileSkills, parseProfileInterests, parseProfileSkills,
  profileErrorTarget, profileFieldId, profileValidationResponse,
} from "@/lib/profile-validation";
import { extractedProfileSchema } from "@/lib/resume";

function profile() {
  return {
    name: "Test Student", profilePhotoUrl: "/api/files/photo", resumeUrl: "/api/files/resume",
    cohort: "PGP 2026", skills: ["React"], workExperience: [], education: [],
    currentProject: "", lookingFor: "Find collaborators", linkedinUrl: "",
    contactLink: "test@example.com", fieldsFilledManually: [],
  };
}

function errors(input: unknown) {
  const parsed = completeProfileSchema.safeParse(input);
  assert.equal(parsed.success, false);
  if (parsed.success) throw new Error("Expected invalid profile");
  return profileValidationResponse(parsed.error, input);
}

test("skills count error names the exact field and preserves every unique skill", () => {
  const input = { ...profile(), skills: Array.from({ length: 34 }, (_, i) => `Skill ${i + 1}`) };
  const result = errors(input);
  assert.match(result.error, /^Skills: You added 34 unique skills/);
  assert.match(result.fieldErrors.skills, /remove 4 to continue/);
  assert.equal(input.skills.length, 34);
});

test("skills deduplicate case-insensitively, preserving first spelling and order", () => {
  assert.deepEqual(normalizeProfileSkills([" React ", "Python", "react", "SQL", "PYTHON"]), ["React", "Python", "SQL"]);
  assert.deepEqual(parseProfileSkills(" React, ,react, SQL, "), ["React", "SQL"]);
  const input = { ...profile(), skills: Array(34).fill("React") };
  assert.deepEqual(completeProfileSchema.parse(input).skills, ["React"]);
});

test("30 skills saves successfully after correcting an oversized skills list", () => {
  const input = { ...profile(), skills: Array.from({ length: 31 }, (_, i) => `Skill ${i + 1}`) };
  assert.ok(errors(input).fieldErrors.skills);
  input.skills.pop();
  assert.equal(completeProfileSchema.safeParse(input).success, true);
});

test("interests stay separate from skills, deduplicate and enforce the profile cap", () => {
  assert.deepEqual(normalizeProfileInterests([" Fintech ", "Weddings", "fintech"]), ["Fintech", "Weddings"]);
  assert.deepEqual(parseProfileInterests("D2C, climate, d2c"), ["D2C", "climate"]);
  const valid = { ...profile(), interests: ["Fintech", "Weddings", "D2C"] };
  assert.equal(completeProfileSchema.safeParse(valid).success, true);
  const invalid = { ...profile(), interests: Array.from({ length: 13 }, (_, index) => `Interest ${index + 1}`) };
  assert.match(errors(invalid).fieldErrors.interests, /Keep up to 12 entries/);
});

test("nested education and work errors retain indexed paths and human labels", () => {
  const result = errors({ ...profile(),
    workExperience: [{ company: "", role: "Engineer", duration: "2026", description: "" }],
    education: [
      { institution: "University", degree: "BTech", year: "2024" },
      { institution: "MU", degree: "PGP", year: "" },
    ],
  });
  assert.match(result.fieldErrors["workExperience.0.company"], /Work experience entry 1 — Company: This field is required/);
  assert.match(result.fieldErrors["education.1.year"], /Education entry 2 — Year: This field is required/);
  assert.equal(Object.keys(result.fieldErrors).length, 2);
  assert.equal(profileFieldId("education.1.year"), "profile-education-1-year");
});

test("multiple errors, long skills and invalid contacts identify their fields", () => {
  const result = errors({ ...profile(), name: "", skills: ["A".repeat(61)], contactLink: "not a contact" });
  assert.match(result.fieldErrors.name, /^Full name:/);
  assert.match(result.fieldErrors["skills.0"], /Skills — skill 1: Use 60 characters or fewer/);
  assert.match(result.fieldErrors.contactLink, /^Contact link or email:/);
  assert.equal(profileErrorTarget("skills.0"), "skills");
});

test("malformed and unsafe LinkedIn URLs return field errors instead of throwing", () => {
  for (const linkedinUrl of ["not a url", "https://", "javascript:alert(1)", "ftp://example.com"]) {
    assert.match(errors({ ...profile(), linkedinUrl }).fieldErrors.linkedinUrl, /^LinkedIn URL:/);
  }
  assert.equal(completeProfileSchema.safeParse({ ...profile(), linkedinUrl: "https://linkedin.com/in/test" }).success, true);
});

test("30-item metadata errors are distinct from skills errors and actionable", () => {
  const result = errors({ ...profile(), fieldsFilledManually: Array(31).fill("education") });
  assert.equal(result.fieldErrors.skills, undefined);
  assert.match(result.fieldErrors.fieldsFilledManually, /Resume review metadata:.*Upload the resume again/);
  assert.equal(profileErrorTarget("fieldsFilledManually"), "resumeUrl");
});

test("row removal produces fresh paths rather than stale row errors", () => {
  const input = { ...profile(), education: [
    { institution: "MU", degree: "PGP", year: "2026" },
    { institution: "", degree: "BTech", year: "2024" },
  ] };
  assert.ok(errors(input).fieldErrors["education.1.institution"]);
  input.education.shift();
  const result = errors(input);
  assert.ok(result.fieldErrors["education.0.institution"]);
  assert.equal(result.fieldErrors["education.1.institution"], undefined);
});

test("AI skills normalize duplicates without silently dropping excess unique entries", () => {
  const skills = Array.from({ length: 34 }, (_, i) => `Skill ${i + 1}`);
  const extracted = extractedProfileSchema.parse({ skills: [...skills, " skill 1 "] });
  assert.deepEqual(extracted.skills, skills);
  assert.match(errors({ ...profile(), skills: extracted.skills }).fieldErrors.skills, /34 unique skills/);
});

test("missing uploads and oversized sections have understandable field errors", () => {
  const result = errors({ ...profile(), profilePhotoUrl: "", resumeUrl: "", education: Array(21).fill({ institution: "MU", degree: "PGP", year: "2026" }) });
  assert.match(result.fieldErrors.profilePhotoUrl, /^Profile photo: Upload/);
  assert.match(result.fieldErrors.resumeUrl, /^Resume: Upload/);
  assert.match(result.fieldErrors.education, /^Education: Keep up to 20 entries/);
});
