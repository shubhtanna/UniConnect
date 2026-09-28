import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import { createGroup } from "@/lib/group-store";
import { createGroupSchema } from "@/lib/group-validation";
import { logServerError } from "@/lib/logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;

  const limit = await checkRateLimit({
    scope: "group-create",
    identity: auth.user.id,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const parsed = createGroupSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Check the group details" },
        { status: 400 },
      );
    }

    const group = await createGroup(auth.user.id, parsed.data);
    return NextResponse.json({ ok: true, groupId: group._id.toString() });
  } catch (error) {
    logServerError("group_create_failed", error);
    return NextResponse.json(
      { error: "We could not create this group. Please try again." },
      { status: 500 },
    );
  }
}
