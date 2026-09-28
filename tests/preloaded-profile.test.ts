import assert from "node:assert/strict";
import test from "node:test";
import { preloadedProfileUpdateSchema } from "@/lib/profile-validation";
import {
  getProtectedVerifiedEmails,
  toClaimedProfileData,
  type PreloadedProfileInput,
} from "@/lib/preloaded-profile";
import { rankProfiles } from "@/lib/connection-search";

function preloaded(): PreloadedProfileInput {
  return {
    email: "classmate@mastersunion.org",
    sourceResumeName: "classmate.pdf",
    cohort: "PGP AIAS 2026-27",
    name: "Class Mate",
    skills: ["Product", "Python"],
    workExperience: [],
    education: [{ institution: "Masters' Union", degree: "PGP AIAS", year: "2026-27" }],
    currentProject: "Exploring consumer AI",
    lookingFor: "Like-minded people",
    linkedinUrl: "",
    contactLink: "",
    fieldsFilledManually: ["profilePhotoUrl", "resumeUrl"],
    resumeEmbedding: [],
    importBatchId: "test-batch",
  };
}

test("claimed Master CV data creates an editable profile without impersonating verification", () => {
  const claimed = toClaimedProfileData(preloaded());
  assert.equal(claimed.origin, "masters_cv");
  assert.equal(claimed.profilePhotoUrl, "");
  assert.equal(claimed.resumeUrl, "");
  assert.equal(claimed.contactLink, "");
  assert.equal(claimed.preloadedNoticeAcknowledgedAt, null);
  assert.equal(preloadedProfileUpdateSchema.safeParse(claimed).success, true);
});

test("Master CV edits may omit uploads but normal self-onboarding still requires them", async () => {
  const claimed = toClaimedProfileData(preloaded());
  const { completeProfileSchema } = await import("@/lib/profile-validation");
  assert.equal(preloadedProfileUpdateSchema.safeParse(claimed).success, true);
  assert.equal(completeProfileSchema.safeParse(claimed).success, false);
});

test("a claimed profile without an embedding remains discoverable by explicit skills", () => {
  const claimed = toClaimedProfileData(preloaded());
  const ranked = rankProfiles("Python", [1, 0], [{
    userId: "claimed-user", ...claimed,
  }]);
  assert.equal(ranked[0]?.userId, "claimed-user");
  assert.ok((ranked[0]?.vectorScore ?? 0) > 0);
});

test("staging protects completed verified accounts but permits verified users without profiles", () => {
  const protectedEmails = getProtectedVerifiedEmails([
    { _id: "incomplete", email: "incomplete@mastersunion.org", isProfileComplete: false },
    { _id: "complete", email: "complete@mastersunion.org", isProfileComplete: true },
    { _id: "has-profile", email: "profile@mastersunion.org", isProfileComplete: false },
  ], ["has-profile"]);

  assert.deepEqual(protectedEmails, [
    "complete@mastersunion.org",
    "profile@mastersunion.org",
  ]);
});
