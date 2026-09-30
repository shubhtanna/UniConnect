import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import { revokeGroupInvitation } from "@/lib/group-store";
import { logServerError } from "@/lib/logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ groupId: string; invitationId: string }> },
) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;

  const limit = await checkRateLimit({
    scope: "group-invite-revoke",
    identity: auth.user.id,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const { groupId, invitationId } = await params;
    const result = await revokeGroupInvitation({
      ownerId: auth.user.id,
      groupId,
      invitationId,
    });
    if (result === "forbidden") {
      return NextResponse.json(
        { error: "Only the group owner can take back invitations" },
        { status: 403 },
      );
    }
    if (result === "not_found") {
      return NextResponse.json(
        { error: "This invitation is no longer pending" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    logServerError("group_invitation_revoke_failed", error);
    return NextResponse.json(
      { error: "We could not take back this invitation. Please try again." },
      { status: 500 },
    );
  }
}
