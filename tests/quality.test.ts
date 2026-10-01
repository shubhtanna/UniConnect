import assert from "node:assert/strict";
import test from "node:test";
import { groundLlmMatches } from "@/lib/connection-search";
import type { SearchableProfile } from "@/lib/connection-types";
import { createPostSchema } from "@/lib/feed-validation";
import { canCreateSpotlight } from "@/lib/feed-store";
import { isPublicPath, postAuthRedirect } from "@/lib/navigation";
import { isOtpExpired } from "@/lib/otp";
import { completeProfileSchema } from "@/lib/profile-validation";
import { muEmailSchema } from "@/lib/validation";
import {
  secureTokenMatches,
  TEST_ACCESS_EMAIL,
  testAccessHasExpired,
} from "@/lib/test-access";

test("MU domain validation accepts only the exact official domain", () => {
  assert.equal(muEmailSchema.parse(" Student@mastersunion.org "), "student@mastersunion.org");
  assert.equal(muEmailSchema.safeParse("student@gmail.com").success, false);
  assert.equal(muEmailSchema.safeParse("student@mastersunion.org.attacker.com").success, false);
});

test("OTP expiry handles past and future challenges", () => {
  const now = Date.now();
  assert.equal(isOtpExpired(new Date(now - 1), now), true);
  assert.equal(isOtpExpired(new Date(now + 1), now), false);
});

test("authentication redirect rules remain deterministic", () => {
  assert.equal(postAuthRedirect(false), "/profile/setup");
  assert.equal(postAuthRedirect(true), "/dashboard");
  assert.equal(isPublicPath("/login"), true);
  assert.equal(isPublicPath("/test-access"), true);
  assert.equal(isPublicPath("/feed"), false);
});

test("private tester access is fixed to one account and validates secrets and expiry", () => {
  assert.equal(TEST_ACCESS_EMAIL, "shubh.tanna_pgpaias27@mastersunion.org");
  assert.equal(secureTokenMatches("a".repeat(32), "a".repeat(32)), true);
  assert.equal(secureTokenMatches("a".repeat(32), "b".repeat(32)), false);
  assert.equal(testAccessHasExpired("2026-10-01T10:00:00.000Z", Date.parse("2026-10-01T10:00:01.000Z")), true);
  assert.equal(testAccessHasExpired("2026-10-01T10:00:02.000Z", Date.parse("2026-10-01T10:00:01.000Z")), false);
});

test("profile and Spotlight payload validation rejects incomplete models", () => {
  const invalidProfile = completeProfileSchema.safeParse({
    name: "A",
    profilePhotoUrl: "https://public.example/photo.jpg",
    resumeUrl: "/api/files/resume",
    cohort: "",
    skills: [],
    workExperience: [],
    education: [],
    currentProject: "",
    lookingFor: "",
    linkedinUrl: "javascript:alert(1)",
    contactLink: "not a contact",
    fieldsFilledManually: [],
  });
  assert.equal(invalidProfile.success, false);

  const invalidSpotlight = createPostSchema.safeParse({
    type: "spotlight",
    content: "A venture update",
    mediaUrls: [],
  });
  assert.equal(invalidSpotlight.success, false);
});

test("Spotlight daily limit permits two posts and blocks the third", () => {
  assert.equal(canCreateSpotlight(0), true);
  assert.equal(canCreateSpotlight(1), true);
  assert.equal(canCreateSpotlight(2), false);
});

test("grounded matches discard unknown and duplicate profile IDs", () => {
  const candidates: SearchableProfile[] = [profile("known-1", "Known Student")];
  const grounded = groundLlmMatches(
    [
      { userId: "invented", reason: "Hallucinated" },
      { userId: "known-1", reason: "Matches product and growth experience." },
      { userId: "known-1", reason: "Duplicate" },
    ],
    candidates,
  );
  assert.equal(grounded.length, 1);
  assert.equal(grounded[0]?.profile.name, "Known Student");
  assert.match(grounded[0]?.reason ?? "", /product and growth/);
});

function profile(userId: string, name: string): SearchableProfile {
  return {
    userId,
    name,
    profilePhotoUrl: "",
    cohort: "PGP 2026",
    skills: ["Product", "Growth"],
    interests: ["Consumer brands"],
    workExperience: [],
    education: [],
    currentProject: "Consumer marketplace",
    lookingFor: "Collaborators",
    linkedinUrl: "",
    contactLink: "student@example.com",
    resumeEmbedding: [1, 0],
  };
}
