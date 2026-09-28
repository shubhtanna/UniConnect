import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import { storeFile } from "@/lib/file-storage";
import { matchesImageSignature } from "@/lib/file-signatures";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;
  const limit = await checkRateLimit({ scope: "post-upload", identity: auth.user.id, limit: 20, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image" }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WebP, or GIF image" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Post images must be smaller than 8 MB" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesImageSignature(buffer, file.type)) {
    return NextResponse.json({ error: "The selected file is not a valid image" }, { status: 400 });
  }
  const url = await storeFile({
    buffer,
    filename: file.name,
    contentType: file.type,
    ownerId: auth.user.id,
    kind: "posts",
  });
  return NextResponse.json({ url });
}
