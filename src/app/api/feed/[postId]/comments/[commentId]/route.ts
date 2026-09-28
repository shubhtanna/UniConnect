import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import { commentSchema } from "@/lib/feed-validation";
import {
  deleteComment,
  ForbiddenFeedActionError,
  updateComment,
} from "@/lib/feed-store";

type Context = { params: Promise<{ postId: string; commentId: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;
  const parsed = commentSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your comment" },
      { status: 400 },
    );
  const { postId, commentId } = await params;
  try {
    await updateComment(postId, commentId, auth.user.id, parsed.data.text);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ForbiddenFeedActionError)
      return NextResponse.json(
        { error: "You can only edit your own comment" },
        { status: 403 },
      );
    return NextResponse.json(
      { error: "Could not update comment" },
      { status: 500 },
    );
  }
}
export async function DELETE(_request: Request, { params }: Context) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;
  const { postId, commentId } = await params;
  try {
    await deleteComment(postId, commentId, auth.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ForbiddenFeedActionError)
      return NextResponse.json(
        { error: "You can only delete your own comment" },
        { status: 403 },
      );
    return NextResponse.json(
      { error: "Could not delete comment" },
      { status: 500 },
    );
  }
}
