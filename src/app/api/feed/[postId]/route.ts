import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import {
  deletePost,
  ForbiddenFeedActionError,
  PostNotFoundError,
  updatePost,
} from "@/lib/feed-store";
import { updatePostSchema } from "@/lib/feed-validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;
  const parsed = updatePostSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your post" },
      { status: 400 },
    );
  try {
    await updatePost((await params).postId, auth.user.id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PostNotFoundError)
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (error instanceof ForbiddenFeedActionError)
      return NextResponse.json(
        { error: "You can only edit your own post" },
        { status: 403 },
      );
    return NextResponse.json(
      { error: "Could not update post" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;
  try {
    await deletePost((await params).postId, auth.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PostNotFoundError)
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (error instanceof ForbiddenFeedActionError)
      return NextResponse.json(
        { error: "You can only delete your own post" },
        { status: 403 },
      );
    return NextResponse.json(
      { error: "Could not delete post" },
      { status: 500 },
    );
  }
}
