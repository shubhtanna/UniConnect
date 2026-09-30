import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { sendPlatformInvitationEmail } from "@/lib/email";
import { PreloadedProfile } from "@/models/PreloadedProfile";
import { Profile } from "@/models/Profile";
import { User } from "@/models/User";

async function main() {
const csvArgument = process.argv.find((argument) => argument.startsWith("--csv="));
const send = process.argv.includes("--send");
const campaignId = "initial-classmates-2026-09-30";
const platformUrl = "https://uniconnect-teal.vercel.app";

if (!csvArgument) throw new Error("Pass --csv=<absolute CSV path>");
const csvPath = csvArgument.slice("--csv=".length);
const csvText = (await fs.readFile(csvPath, "utf8")).replace(/^\uFEFF/, "");
const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
if (lines[0]?.replace(/^"|"$/g, "").trim().toLowerCase() !== "email") {
  throw new Error("CSV must contain a single Email column");
}

const emails = [
  ...new Set(
    lines
      .slice(1)
      .map((line) => line.replace(/^"|"$/g, "").trim().toLowerCase())
      .filter(Boolean),
  ),
];
const invalidEmails = emails.filter(
  (email) => !/^[^\s@]+@mastersunion\.org$/i.test(email),
);
if (invalidEmails.length) {
  throw new Error(`CSV contains ${invalidEmails.length} invalid MU email address(es)`);
}

await connectToDatabase();
const database = mongoose.connection.db;
if (!database) throw new Error("MongoDB connection did not provide a database");

const users = await User.find({ email: { $in: emails } })
  .select("email isProfileComplete")
  .lean();
const userIds = users.map((user) => user._id);
const profiles = await Profile.find({ userId: { $in: userIds } })
  .select("userId")
  .lean();
const profileUserIds = new Set(profiles.map((profile) => profile.userId.toString()));
const activatedEmails = new Set(
  users
    .filter(
      (user) => user.isProfileComplete || profileUserIds.has(user._id.toString()),
    )
    .map((user) => user.email),
);

const preloaded = await PreloadedProfile.find({ email: { $in: emails } })
  .select("email name status")
  .lean();
const preloadedByEmail = new Map(
  preloaded.map((profile) => [profile.email, profile]),
);
const invitationLog = database.collection("platforminvitations");
await invitationLog.createIndex(
  { campaignId: 1, email: 1 },
  { unique: true },
);
const alreadySent = new Set(
  (
    await invitationLog
      .find({ campaignId, email: { $in: emails }, status: "sent" })
      .project({ email: 1 })
      .toArray()
  ).map((entry) => String(entry.email)),
);

const recipients = emails.filter(
  (email) => !activatedEmails.has(email) && !alreadySent.has(email),
);
const preview = {
  campaignId,
  sourceFile: path.basename(csvPath),
  csvUniqueEmails: emails.length,
  excludedCompletedProfiles: activatedEmails.size,
  excludedAlreadySent: alreadySent.size,
  recipients: recipients.length,
  recipientsWithPreloadedData: recipients.filter((email) =>
    preloadedByEmail.has(email),
  ).length,
  recipientsWithoutPreloadedData: recipients.filter(
    (email) => !preloadedByEmail.has(email),
  ).length,
  mode: send ? "send" : "preview",
};
console.log(JSON.stringify(preview, null, 2));

if (send) {
  let sent = 0;
  let failed = 0;
  for (const email of recipients) {
    try {
      await sendPlatformInvitationEmail({
        email,
        name: preloadedByEmail.get(email)?.name,
        platformUrl,
      });
      await invitationLog.updateOne(
        { campaignId, email },
        {
          $set: {
            status: "sent",
            sentAt: new Date(),
            sourceFile: path.basename(csvPath),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      );
      sent += 1;
      console.log(`SENT ${sent}/${recipients.length}`);
    } catch (error) {
      failed += 1;
      await invitationLog.updateOne(
        { campaignId, email },
        {
          $set: {
            status: "failed",
            failedAt: new Date(),
            error: error instanceof Error ? error.message.slice(0, 300) : "Unknown error",
            sourceFile: path.basename(csvPath),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      );
      console.error(`FAILED ${email}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  console.log(JSON.stringify({ sent, failed, total: recipients.length }));
}

await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
