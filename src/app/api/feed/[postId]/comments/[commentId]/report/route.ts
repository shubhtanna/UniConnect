import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import { PostNotFoundError, reportComment } from "@/lib/feed-store";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string }> },
) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;
  const limit = await checkRateLimit({ scope: "report-create", identity: auth.user.id, limit: 30, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);
  try {
    const { postId, commentId } = await params;
    await reportComment(postId, commentId, auth.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PostNotFoundError) return NextResponse.json({ error: "Post or comment not found" }, { status: 404 });
    return NextResponse.json({ error: "Could not report comment" }, { status: 500 });
  }
}
