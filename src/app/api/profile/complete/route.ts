import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createProfileEmbedding } from "@/lib/embeddings";
import { saveProfile } from "@/lib/profile-store";
import { getProfileByUserId } from "@/lib/profile-store";
import { completeProfileSchema, preloadedProfileUpdateSchema, profileValidationResponse } from "@/lib/profile-validation";
import { logServerError } from "@/lib/logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const limit = await checkRateLimit({ scope: "profile-save", identity: user.id, limit: 20, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const input: unknown = await request.json();
    const existing = await getProfileByUserId(user.id);
    const schema = existing?.origin === "masters_cv" ? preloadedProfileUpdateSchema : completeProfileSchema;
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return NextResponse.json(
        profileValidationResponse(parsed.error, input),
        { status: 400 },
      );
    }

    const data = parsed.data;
    const embeddingText = [
      data.name,
      data.cohort,
      data.skills.join(", "),
      data.interests.join(", "),
      data.currentProject,
      data.lookingFor,
      ...data.workExperience.map(
        (item) => `${item.role} at ${item.company}. ${item.description}`,
      ),
      ...data.education.map((item) => `${item.degree} at ${item.institution}`),
    ].join("\n");
    const resumeEmbedding = await createProfileEmbedding(embeddingText);
    await saveProfile(user.id, { ...data, resumeEmbedding });
    return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
  } catch (error) {
    logServerError("profile_completion_failed", error);
    return NextResponse.json(
      { error: "We could not save your profile. Please try again." },
      { status: 500 },
    );
  }
}
