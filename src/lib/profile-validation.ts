import { z } from "zod";

export const MAX_PROFILE_SKILLS = 30;
export const MAX_PROFILE_INTERESTS = 12;
export type ProfileFieldErrors = Record<string, string>;

// Keep the first spelling and every distinct skill; never silently trim to the limit.
export function normalizeProfileSkills(skills: string[]) {
  const seen = new Set<string>();
  return skills.map((skill) => skill.trim()).filter((skill) => {
    const key = skill.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseProfileSkills(text: string) {
  return normalizeProfileSkills(text.split(","));
}

export const normalizeProfileInterests = normalizeProfileSkills;
export function parseProfileInterests(text: string) {
  return normalizeProfileInterests(text.split(","));
}

const httpUrl = z.string().url().max(300).refine((value) => {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch { return false; }
}, "Use an http or https link");

const contactLink = z.string().trim().min(3, "A contact link or email is required").max(300).refine((value) => {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" || (url.protocol === "mailto:" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url.pathname));
  } catch { return false; }
}, "Use an email, mailto link, or secure web link");

const workExperienceSchema = z.object({
  company: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
  duration: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).default(""),
});

const educationSchema = z.object({
  institution: z.string().trim().min(1).max(160),
  degree: z.string().trim().min(1).max(160),
  year: z.string().trim().min(1).max(40),
});

const profileFields = {
  name: z.string().trim().min(2, "Name is required").max(120),
  cohort: z.string().trim().min(2, "Cohort is required").max(120),
  skills: z.array(z.string()).transform(normalizeProfileSkills).pipe(
    z.array(z.string().min(1).max(60)).min(1, "Add at least one skill").max(MAX_PROFILE_SKILLS),
  ),
  interests: z.array(z.string()).default([]).transform(normalizeProfileInterests).pipe(
    z.array(z.string().min(2).max(40)).max(MAX_PROFILE_INTERESTS),
  ),
  workExperience: z.array(workExperienceSchema).max(20),
  education: z.array(educationSchema).max(20),
  currentProject: z.string().trim().max(1000),
  lookingFor: z.string().trim().min(2, "Tell us what you are looking for").max(500),
  linkedinUrl: z.union([z.literal(""), httpUrl]),
  contactLink,
  fieldsFilledManually: z.array(z.string().max(80)).max(30),
};

export const completeProfileSchema = z.object({
  ...profileFields,
  profilePhotoUrl: z.string().startsWith("/api/files/"),
  resumeUrl: z.string().startsWith("/api/files/"),
});

export const preloadedProfileUpdateSchema = z.object({
  ...profileFields,
  profilePhotoUrl: z.union([z.literal(""), z.string().startsWith("/api/files/")]),
  resumeUrl: z.union([z.literal(""), z.string().startsWith("/api/files/")]),
  contactLink: z.union([z.literal(""), contactLink]),
});

const fieldLabels: Record<string, string> = {
  name: "Full name", cohort: "Cohort / programme", skills: "Skills", interests: "Interests",
  profilePhotoUrl: "Profile photo", resumeUrl: "Resume", currentProject: "Current project",
  lookingFor: "What are you looking for?", linkedinUrl: "LinkedIn URL",
  contactLink: "Contact link or email", fieldsFilledManually: "Resume review metadata",
  workExperience: "Work experience", education: "Education",
  company: "Company", role: "Role", duration: "Duration", description: "Description",
  institution: "Institution", degree: "Degree", year: "Year",
};

export function profileFieldLabel(path: string) {
  const [root, index, child] = path.split(".");
  if (index !== undefined && /^\d+$/.test(index)) {
    if (root === "skills") return `Skills — skill ${Number(index) + 1}`;
    if (root === "interests") return `Interests — interest ${Number(index) + 1}`;
    return `${fieldLabels[root] ?? root} entry ${Number(index) + 1}${child ? ` — ${fieldLabels[child] ?? child}` : ""}`;
  }
  return fieldLabels[root] ?? "Profile";
}

// Several individual skill errors all point at the same comma-separated input.
export function profileErrorTarget(path: string) {
  if (path.startsWith("skills.")) return "skills";
  if (path.startsWith("interests.")) return "interests";
  if (path.startsWith("fieldsFilledManually")) return "resumeUrl";
  return path;
}

export function profileFieldId(path: string) {
  return `profile-${profileErrorTarget(path).replace(/\./g, "-")}`;
}

export function profileValidationResponse(error: z.ZodError, input: unknown) {
  const fieldErrors: ProfileFieldErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "profile";
    if (fieldErrors[path]) continue;
    let message = issue.message;
    if (path.startsWith("fieldsFilledManually")) {
      message = "Resume review details are invalid. Upload the resume again.";
    } else if (issue.code === "too_big") {
      message = issue.type === "array" ? `Keep up to ${issue.maximum} entries.` : `Use ${issue.maximum} characters or fewer.`;
      if (path === "skills" && input && typeof input === "object" && "skills" in input && Array.isArray(input.skills)) {
        const count = normalizeProfileSkills(input.skills.filter((skill): skill is string => typeof skill === "string")).length;
        message = `You added ${count} unique skills. Keep up to ${MAX_PROFILE_SKILLS}; remove ${count - MAX_PROFILE_SKILLS} to continue.`;
      }
    } else if (issue.code === "too_small") {
      message = issue.type === "array" ? `Add at least ${issue.minimum} entry.`
        : issue.minimum === 1 ? "This field is required." : `Enter at least ${issue.minimum} characters.`;
    } else if (path === "profilePhotoUrl" || path === "resumeUrl") {
      message = "Upload this file before saving your profile.";
    } else if (path === "linkedinUrl") {
      message = "Enter a complete http:// or https:// URL, or leave this optional field empty.";
    } else if (issue.code === "invalid_type" || issue.code === "invalid_union") {
      message = "Enter a valid value for this field.";
    }
    fieldErrors[path] = `${profileFieldLabel(path)}: ${message}`;
  }
  return { error: Object.values(fieldErrors)[0] ?? "Check your profile details.", fieldErrors };
}
