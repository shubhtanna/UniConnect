import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import { groupInvitationResponseSchema } from "@/lib/group-validation";
import { respondToGroupInvitation } from "@/lib/group-store";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logServerError } from "@/lib/logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ invitationId: string }> },
) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;

  const limit = await checkRateLimit({
    scope: "group-invitation-response",
    identity: auth.user.id,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const parsed = groupInvitationResponseSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Choose accept or decline" },
        { status: 400 },
      );
    }

    const { invitationId } = await params;
    const outcome = await respondToGroupInvitation({
      userId: auth.user.id,
      email: auth.user.email,
      invitationId,
      action: parsed.data.action,
    });

    if (outcome === "not_found") {
      return NextResponse.json(
        { error: "This invitation is unavailable or already answered." },
        { status: 404 },
      );
    }
    if (outcome === "group_full") {
      return NextResponse.json(
        { error: "This group has reached its 50-member limit." },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true, outcome });
  } catch (error) {
    logServerError("group_invitation_response_failed", error);
    return NextResponse.json(
      { error: "We could not update this invitation. Please try again." },
      { status: 500 },
    );
  }
}
