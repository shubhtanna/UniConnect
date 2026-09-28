import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { z } from "zod";
import mongoose from "mongoose";
import { muEmailSchema } from "@/lib/validation";
import { matchesResumeSignature } from "@/lib/file-signatures";
import {
  extractProfileFieldsLocally,
  extractResumeText,
  getMissingExtractionFields,
} from "@/lib/resume";
import { preloadedProfileUpdateSchema } from "@/lib/profile-validation";
import { stagePreloadedProfiles, type PreloadedProfileInput } from "@/lib/preloaded-profile";

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_RESUME_BYTES = 10 * 1024 * 1024;
const workExperienceSchema = z.object({
  company: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
  duration: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).default(""),
}).strict();
const educationSchema = z.object({
  institution: z.string().trim().min(1).max(160),
  degree: z.string().trim().min(1).max(160),
  year: z.string().trim().min(1).max(40),
}).strict();

const entrySchema = z.object({
  email: muEmailSchema,
  resume: z.string().trim().min(1),
  name: z.string().trim().min(2).max(120).optional(),
  cohort: z.string().trim().min(2).max(120).optional(),
  lookingFor: z.string().trim().min(2).max(500).optional(),
  linkedinUrl: z.union([z.literal(""), z.string().url().max(300)]).optional(),
  skills: z.array(z.string().trim().min(1).max(60)).min(1).max(30).optional(),
  workExperience: z.array(workExperienceSchema).max(20).optional(),
  education: z.array(educationSchema).max(20).optional(),
  currentProject: z.string().trim().max(1000).optional(),
}).strict();

const manifestSchema = z.object({
  batchId: z.string().trim().min(2).max(100).default(() => randomUUID()),
  defaultCohort: z.string().trim().min(2).max(120),
  defaultLookingFor: z.string().trim().min(2).max(500)
    .default("Open to meeting like-minded people and exploring opportunities at MU"),
  profiles: z.array(entrySchema).min(1).max(200),
}).strict();

async function main() {
const args = new Set(process.argv.slice(2));
const manifestArgIndex = process.argv.indexOf("--manifest");
const manifestArgument = manifestArgIndex >= 0 ? process.argv[manifestArgIndex + 1] : undefined;
if (!manifestArgument) throw new Error("Usage: npm run master-cv:import -- --manifest <manifest.json> [--apply] [--replace-pending]");

const manifestPath = path.resolve(manifestArgument);
const manifestDirectory = path.dirname(manifestPath);
const manifest = manifestSchema.parse(JSON.parse(await readFile(manifestPath, "utf8")));
const duplicateEmails = manifest.profiles
  .map((entry) => entry.email)
  .filter((email, index, all) => all.indexOf(email) !== index);
if (duplicateEmails.length) throw new Error(`Duplicate emails in manifest: ${[...new Set(duplicateEmails)].join(", ")}`);

const prepared: PreloadedProfileInput[] = [];
const preview: Array<Record<string, unknown>> = [];
const failures: Array<{ email: string; resume: string; error: string }> = [];

for (const entry of manifest.profiles) {
  try {
    const resumePath = path.resolve(manifestDirectory, entry.resume);
    const extension = path.extname(resumePath).toLowerCase();
    const contentType = extension === ".pdf" ? "application/pdf" : extension === ".docx" ? DOCX_TYPE : "";
    if (!contentType) throw new Error("Resume must be a PDF or DOCX file");
    const buffer = await readFile(resumePath);
    if (buffer.length > MAX_RESUME_BYTES) throw new Error("Resume is larger than 10 MB");
    if (!matchesResumeSignature(buffer, contentType)) throw new Error("File contents do not match a valid PDF or DOCX");
    const text = await extractResumeText(buffer, contentType);
    if (text.length < 30) throw new Error("Could not read enough resume text; scanned PDFs need manual data entry or OCR");

    // Privacy default: this never calls the configured AI provider and never uploads the source CV.
    const extracted = extractProfileFieldsLocally(text);
    const name = entry.name ?? extracted.name;
    if (!name || name.trim().length < 2) throw new Error("Name was not detected; add a name override to the manifest");
    const effectiveExtracted = {
      name,
      skills: entry.skills ?? extracted.skills,
      workExperience: entry.workExperience ?? extracted.workExperience,
      education: entry.education ?? extracted.education,
      currentProject: entry.currentProject ?? extracted.currentProject,
    };
    const fieldsFilledManually = [...new Set([
      "profilePhotoUrl", "resumeUrl", "contactLink", ...getMissingExtractionFields(effectiveExtracted),
    ])].slice(0, 30);
    const profile = preloadedProfileUpdateSchema.parse({
      name,
      profilePhotoUrl: "",
      resumeUrl: "",
      cohort: entry.cohort ?? manifest.defaultCohort,
      skills: effectiveExtracted.skills,
      workExperience: effectiveExtracted.workExperience,
      education: effectiveExtracted.education,
      currentProject: effectiveExtracted.currentProject,
      lookingFor: entry.lookingFor ?? manifest.defaultLookingFor,
      linkedinUrl: entry.linkedinUrl ?? "",
      // The official email is only a claim key. It is not exposed as a public contact method.
      contactLink: "",
      fieldsFilledManually,
    });
    const item: PreloadedProfileInput = {
      ...profile,
      email: entry.email,
      sourceResumeName: path.basename(resumePath),
      resumeEmbedding: [],
      importBatchId: manifest.batchId,
    };
    prepared.push(item);
    preview.push({
      email: item.email,
      sourceResumeName: item.sourceResumeName,
      name: item.name,
      cohort: item.cohort,
      skills: item.skills,
      workExperience: item.workExperience,
      education: item.education,
      currentProject: item.currentProject,
      lookingFor: item.lookingFor,
      linkedinUrl: item.linkedinUrl,
      fieldsNeedingReview: item.fieldsFilledManually,
    });
  } catch (error) {
    failures.push({
      email: entry.email,
      resume: entry.resume,
      error: error instanceof Error ? error.message : "Unknown import error",
    });
  }
}

const reportDirectory = path.resolve(process.cwd(), ".data", "master-cv-imports");
await mkdir(reportDirectory, { recursive: true });
const safeBatchId = manifest.batchId.replace(/[^a-z0-9_-]/gi, "-").slice(0, 100);
const runTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = path.join(reportDirectory, `${safeBatchId}-${runTimestamp}-preview.json`);
await writeFile(reportPath, `${JSON.stringify({ batchId: manifest.batchId, profiles: preview, failures }, null, 2)}\n`, { flag: "wx" });

console.log(`Prepared ${prepared.length} profile(s). Private local preview: ${reportPath}`);
if (failures.length) {
  console.error(`${failures.length} profile(s) failed validation. Nothing was written to MongoDB.`);
  for (const failure of failures) console.error(`${failure.email}: ${failure.error}`);
  process.exitCode = 1;
} else if (!args.has("--apply")) {
  console.log("Dry run only. Review the preview, then rerun with --apply to stage the batch in MongoDB.");
} else {
  try {
    await stagePreloadedProfiles(prepared, args.has("--replace-pending"));
    console.log(`Staged ${prepared.length} profile(s). They remain hidden until each matching MU email completes OTP verification.`);
  } finally {
    await mongoose.disconnect();
  }
}

}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Master CV import failed");
  process.exitCode = 1;
});
