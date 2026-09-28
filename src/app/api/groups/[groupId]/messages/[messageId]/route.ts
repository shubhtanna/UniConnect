import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import { deleteGroupMessage, updateGroupMessage } from "@/lib/group-store";
import { groupMessageSchema } from "@/lib/group-validation";

type Context = { params: Promise<{ groupId: string; messageId: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;
  const parsed = groupMessageSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your message" },
      { status: 400 },
    );
  const { groupId, messageId } = await params;
  return (await updateGroupMessage(
    auth.user.id,
    groupId,
    messageId,
    parsed.data.body,
  ))
    ? NextResponse.json({ ok: true })
    : NextResponse.json(
        { error: "You can only edit your own message" },
        { status: 403 },
      );
}
export async function DELETE(_request: Request, { params }: Context) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;
  const { groupId, messageId } = await params;
  return (await deleteGroupMessage(auth.user.id, groupId, messageId))
    ? NextResponse.json({ ok: true })
    : NextResponse.json(
        { error: "You cannot delete this message" },
        { status: 403 },
      );
}
