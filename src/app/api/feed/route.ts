import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import { createPost, listPosts, SpotlightLimitError } from "@/lib/feed-store";
import { createPostSchema, feedTypeSchema } from "@/lib/feed-validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logServerError } from "@/lib/logger";

export async function GET(request: Request) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;

  const url = new URL(request.url);
  const type = feedTypeSchema.safeParse(url.searchParams.get("type") ?? "community");
  if (!type.success) return NextResponse.json({ error: "Invalid feed type" }, { status: 400 });
  const cursor = url.searchParams.get("cursor") || undefined;
  if (cursor && Number.isNaN(Date.parse(cursor))) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  }

  const result = await listPosts({ type: type.data, currentUserId: auth.user.id, cursor, limit: 10 });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;

  const limit = await checkRateLimit({
    scope: "post-create",
    identity: auth.user.id,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const parsed = createPostSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Check your post" },
        { status: 400 },
      );
    }
    const postId = await createPost(auth.user.id, parsed.data);
    return NextResponse.json({ ok: true, postId }, { status: 201 });
  } catch (error) {
    if (error instanceof SpotlightLimitError) {
      return NextResponse.json(
        { error: "You can publish up to two Spotlight posts per day." },
        { status: 429 },
      );
    }
    logServerError("post_creation_failed", error);
    return NextResponse.json({ error: "Could not publish this post" }, { status: 500 });
  }
}
