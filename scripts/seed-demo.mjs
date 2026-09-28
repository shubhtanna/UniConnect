import { createHash } from "node:crypto";
import mongoose from "mongoose";

if (process.env.NODE_ENV === "production") throw new Error("Demo seeding is disabled in production");
if (process.env.ALLOW_DEMO_SEED !== "true") throw new Error("Set ALLOW_DEMO_SEED=true to confirm local demo seeding");
if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI before seeding");

await mongoose.connect(process.env.MONGODB_URI);
const database = mongoose.connection.db;
if (!database) throw new Error("MongoDB connection did not provide a database");

const demos = [
  { key: "anaya", name: "Anaya Demo", cohort: "PGP TBM 2026", skills: ["Product Design", "Figma", "Consumer Research"], currentProject: "Designing a campus commerce experience", lookingFor: "A technical collaborator" },
  { key: "kabir", name: "Kabir Demo", cohort: "PGP TBM 2025", skills: ["Ecommerce", "Growth Marketing", "Analytics"], currentProject: "Building a sustainable consumer brand", lookingFor: "Product and operations collaborators" },
  { key: "meera", name: "Meera Demo", cohort: "UG 2027", skills: ["AI", "Python", "Next.js"], currentProject: "An AI workflow assistant", lookingFor: "Early users and a design partner" },
];

for (const demo of demos) {
  const email = `uniconnect.demo+${demo.key}@mastersunion.org`;
  const userResult = await database.collection("users").findOneAndUpdate(
    { email },
    { $set: { isEmailVerified: true, isProfileComplete: true, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, returnDocument: "after" },
  );
  const userId = userResult?._id;
  if (!userId) throw new Error(`Could not create demo user ${demo.key}`);
  const embeddingText = `${demo.skills.join(" ")} ${demo.currentProject} ${demo.lookingFor}`;
  await database.collection("profiles").updateOne(
    { userId },
    { $set: { ...demo, userId, profilePhotoUrl: "", resumeUrl: "/demo/private", workExperience: [], education: [], linkedinUrl: "", contactLink: `mailto:${email}`, fieldsFilledManually: [], resumeEmbedding: localEmbedding(embeddingText), updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() }, $unset: { key: "" } },
    { upsert: true },
  );
}

await mongoose.disconnect();
console.log(`Seeded ${demos.length} fictional, non-sensitive local profiles.`);

function localEmbedding(text) {
  const vector = new Array(384).fill(0);
  for (const token of text.toLowerCase().match(/[a-z0-9+#.]{2,}/g) ?? []) {
    const hash = createHash("sha256").update(token).digest();
    const index = hash.readUInt16BE(0) % vector.length;
    vector[index] += hash[2] % 2 === 0 ? 1 : -1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}
