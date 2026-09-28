import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import { addComment, PostNotFoundError } from "@/lib/feed-store";
import { commentSchema } from "@/lib/feed-validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;
  const limit = await checkRateLimit({ scope: "comment-create", identity: auth.user.id, limit: 60, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);
  const parsed = commentSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  try {
    const { postId } = await params;
    const commentId = await addComment(postId, auth.user.id, parsed.data.text);
    return NextResponse.json({ ok: true, commentId }, { status: 201 });
  } catch (error) {
    if (error instanceof PostNotFoundError) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json({ error: "Could not add comment" }, { status: 500 });
  }
}
