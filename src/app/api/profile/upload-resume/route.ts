import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { storeFile } from "@/lib/file-storage";
import {
  extractProfileFields,
  extractResumeText,
  getMissingExtractionFields,
} from "@/lib/resume";
import { matchesResumeSignature } from "@/lib/file-signatures";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logServerError } from "@/lib/logger";

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const ALLOWED_RESUME_TYPES = new Set(["application/pdf", DOCX_TYPE]);
const MAX_RESUME_BYTES = 10 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const limit = await checkRateLimit({ scope: "profile-upload", identity: user.id, limit: 12, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a resume" }, { status: 400 });
    }
    if (!ALLOWED_RESUME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Use a PDF or DOCX resume" }, { status: 400 });
    }
    if (file.size > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: "Resumes must be smaller than 10 MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesResumeSignature(buffer, file.type)) {
      return NextResponse.json({ error: "The selected file is not a valid PDF or DOCX" }, { status: 400 });
    }
    const text = await extractResumeText(buffer, file.type);
    if (text.length < 30) {
      return NextResponse.json(
        { error: "We could not read enough text from this resume. Try another file." },
        { status: 422 },
      );
    }

    const [url, extracted] = await Promise.all([
      storeFile({
        buffer,
        filename: file.name,
        contentType: file.type,
        ownerId: user.id,
        kind: "resumes",
      }),
      extractProfileFields(text),
    ]);

    return NextResponse.json({
      url,
      extracted,
      missingFields: getMissingExtractionFields(extracted),
      extractionMode: process.env.OPENAI_API_KEY ? "ai" : "local",
    });
  } catch (error) {
    logServerError("resume_processing_failed", error);
    return NextResponse.json(
      { error: "We could not process this resume. Check the file and try again." },
      { status: 422 },
    );
  }
}
