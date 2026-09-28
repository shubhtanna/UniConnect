import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { acknowledgePreloadedNotice } from "@/lib/profile-store";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await acknowledgePreloadedNotice(user.id);
  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
