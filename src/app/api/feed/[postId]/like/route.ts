import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import { PostNotFoundError, toggleLike } from "@/lib/feed-store";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(_request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;
  const limit = await checkRateLimit({ scope: "feed-interaction", identity: auth.user.id, limit: 120, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);
  try {
    const { postId } = await params;
    return NextResponse.json({ liked: await toggleLike(postId, auth.user.id) });
  } catch (error) {
    if (error instanceof PostNotFoundError) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json({ error: "Could not update like" }, { status: 500 });
  }
}
