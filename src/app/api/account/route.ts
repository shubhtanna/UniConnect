import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteAccount } from "@/lib/account-deletion";
import { getCurrentUser } from "@/lib/auth";
import { logServerError } from "@/lib/logger";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

const ACCOUNT_DELETE_CONFIRMATION = "DELETE";

const requestSchema = z.object({
  confirmation: z.literal(ACCOUNT_DELETE_CONFIRMATION),
});

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Type ${ACCOUNT_DELETE_CONFIRMATION} to confirm account deletion.` },
      { status: 400 },
    );
  }

  try {
    await deleteAccount(user.id, user.email);
  } catch (error) {
    logServerError("account_delete_failed", error);
    return NextResponse.json(
      { error: "Your account could not be fully deleted. Please try again." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
