import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import { inviteGroupMembers } from "@/lib/group-store";
import { groupInviteMembersSchema } from "@/lib/group-validation";
import { logServerError } from "@/lib/logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;

  const limit = await checkRateLimit({
    scope: "group-invite",
    identity: auth.user.id,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const parsed = groupInviteMembersSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Check the email addresses" },
        { status: 400 },
      );
    }

    const summary = await inviteGroupMembers({
      ownerId: auth.user.id,
      inviterEmail: auth.user.email,
      origin: new URL(request.url).origin,
      groupId: (await params).groupId,
      invitationEmails: parsed.data.inviteEmails,
    });
    if (!summary) {
      return NextResponse.json(
        { error: "Only the group owner can invite members" },
        { status: 403 },
      );
    }
    return NextResponse.json({ ok: true, invitationSummary: summary });
  } catch (error) {
    logServerError("group_invite_failed", error);
    return NextResponse.json(
      { error: "We could not send these invitations. Please try again." },
      { status: 500 },
    );
  }
}
