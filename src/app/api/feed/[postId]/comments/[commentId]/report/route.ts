import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import {
  AlreadyReportedError,
  ForbiddenFeedActionError,
  PostNotFoundError,
  reportComment,
} from "@/lib/feed-store";
import { reportSchema } from "@/lib/feed-validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string }> },
) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;
  const limit = await checkRateLimit({
    scope: "report-create",
    identity: auth.user.id,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);
  try {
    const parsed = reportSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Tell us why you are reporting this",
        },
        { status: 400 },
      );
    const { postId, commentId } = await params;
    await reportComment(postId, commentId, auth.user.id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PostNotFoundError)
      return NextResponse.json(
        { error: "Post or comment not found" },
        { status: 404 },
      );
    if (error instanceof AlreadyReportedError)
      return NextResponse.json(
        { error: "You already reported this comment" },
        { status: 409 },
      );
    if (error instanceof ForbiddenFeedActionError)
      return NextResponse.json(
        { error: "You cannot report your own comment" },
        { status: 403 },
      );
    return NextResponse.json(
      { error: "Could not report comment" },
      { status: 500 },
    );
  }
}
