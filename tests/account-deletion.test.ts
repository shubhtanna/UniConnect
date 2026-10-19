import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_MODE = "memory";
process.env.STORAGE_MODE = "local";
process.env.SESSION_SECRET ??= "s".repeat(32);
process.env.OTP_PEPPER ??= "p".repeat(32);

test("deleting an account removes the user and profile in memory mode", async () => {
  const { getAuthUserById, upsertVerifiedUser } = await import("@/lib/auth-store");
  const { getProfileByUserId, saveProfile } = await import("@/lib/profile-store");
  const { deleteAccount } = await import("@/lib/account-deletion");

  const user = await upsertVerifiedUser("delete.me_pgpaias27@mastersunion.org");
  await saveProfile(user.id, {
    name: "Delete Me", profilePhotoUrl: "", resumeUrl: "", cohort: "PGP AIAS 27",
    skills: ["Python"], interests: [], workExperience: [], education: [], currentProject: "",
    lookingFor: "Collaborators", linkedinUrl: "", contactLink: "", fieldsFilledManually: [],
    resumeEmbedding: [],
  });
  assert.ok(await getProfileByUserId(user.id));

  await deleteAccount(user.id, user.email);

  assert.equal(await getAuthUserById(user.id), null);
  assert.equal(await getProfileByUserId(user.id), null);
});

test("stored files owned by someone else are never deleted", async () => {
  const { deleteStoredFile, readStoredFile, storeFile } = await import("@/lib/file-storage");
  const url = await storeFile({
    buffer: Buffer.from("resume"), filename: "cv.pdf", contentType: "application/pdf",
    ownerId: "owner", kind: "resumes",
  });
  const id = url.split("/").pop() ?? "";
  await deleteStoredFile(url, "someone-else");
  assert.ok(await readStoredFile(id, "owner"));
  await deleteStoredFile(url, "owner");
  assert.equal(await readStoredFile(id, "owner"), null);
});
