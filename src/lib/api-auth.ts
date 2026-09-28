import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function getCompleteApiUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }
  if (!user.isProfileComplete) {
    return { user: null, response: NextResponse.json({ error: "Complete your profile first" }, { status: 403 }) };
  }
  return { user, response: null };
}
