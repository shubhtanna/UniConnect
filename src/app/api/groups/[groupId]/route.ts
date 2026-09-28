import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import { archiveGroup, updateGroup } from "@/lib/group-store";
import { updateGroupSchema } from "@/lib/group-validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;
  const parsed = updateGroupSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the group details" },
      { status: 400 },
    );
  return (await updateGroup(auth.user.id, (await params).groupId, parsed.data))
    ? NextResponse.json({ ok: true })
    : NextResponse.json(
        { error: "Only the group owner can edit this group" },
        { status: 403 },
      );
}
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;
  return (await archiveGroup(auth.user.id, (await params).groupId))
    ? NextResponse.json({ ok: true })
    : NextResponse.json(
        { error: "Only the group owner can delete this group" },
        { status: 403 },
      );
}
