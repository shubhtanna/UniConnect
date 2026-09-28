import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { PreloadedProfile } from "@/models/PreloadedProfile";

async function main() {
await connectToDatabase();
try {
  const profiles = await PreloadedProfile.find({})
    .select("email name sourceResumeName importBatchId status claimedAt createdAt")
    .sort({ createdAt: -1 })
    .lean();
  const counts = profiles.reduce<Record<string, number>>((result, profile) => {
    result[profile.status] = (result[profile.status] ?? 0) + 1;
    return result;
  }, {});
  console.log(JSON.stringify({ total: profiles.length, counts, profiles: profiles.map((profile) => ({
    email: profile.email,
    name: profile.name,
    sourceResumeName: profile.sourceResumeName,
    batchId: profile.importBatchId,
    status: profile.status,
    claimedAt: profile.claimedAt?.toISOString() ?? null,
  })) }, null, 2));
} finally {
  await mongoose.disconnect();
}
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Master CV status check failed");
  process.exitCode = 1;
});
