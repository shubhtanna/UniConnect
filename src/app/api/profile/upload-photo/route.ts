import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { storeFile } from "@/lib/file-storage";
import { matchesImageSignature } from "@/lib/file-signatures";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const limit = await checkRateLimit({ scope: "profile-upload", identity: user.id, limit: 12, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a profile photo" }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP image" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Profile photos must be smaller than 5 MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesImageSignature(buffer, file.type)) {
    return NextResponse.json({ error: "The selected file is not a valid image" }, { status: 400 });
  }

  const url = await storeFile({
    buffer,
    filename: file.name,
    contentType: file.type,
    ownerId: user.id,
    kind: "photos",
  });
  return NextResponse.json({ url });
}
