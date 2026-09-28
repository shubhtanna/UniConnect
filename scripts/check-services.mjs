import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

const results = [];

await check("MongoDB Atlas", async () => {
  await mongoose.connect(required("MONGODB_URI"), { serverSelectionTimeoutMS: 15_000 });
  await mongoose.connection.db?.admin().ping();
  await mongoose.disconnect();
});

await check("Cloudinary", async () => {
  cloudinary.config({
    cloud_name: required("CLOUDINARY_CLOUD_NAME"),
    api_key: required("CLOUDINARY_API_KEY"),
    api_secret: required("CLOUDINARY_API_SECRET"),
  });
  await cloudinary.api.ping();
});

await check("SMTP", async () => {
  const transport = nodemailer.createTransport({
    host: required("SMTP_HOST"),
    port: Number(required("SMTP_PORT")),
    secure: required("SMTP_SECURE") === "true",
    auth: { user: required("SMTP_USER"), pass: required("SMTP_PASSWORD") },
  });
  await transport.verify();
  transport.close();
});

await check("OpenAI", async () => {
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${required("OPENAI_API_KEY")}` },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
});

for (const result of results) console.log(`${result.name}: ${result.ok ? "ready" : "failed"}`);
if (results.some((result) => !result.ok)) process.exitCode = 1;

async function check(name, operation) {
  try {
    await operation();
    results.push({ name, ok: true });
  } catch {
    results.push({ name, ok: false });
  }
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is missing`);
  return value;
}
