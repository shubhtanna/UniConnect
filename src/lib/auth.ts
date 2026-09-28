import { redirect } from "next/navigation";
import { cache } from "react";
import { getAuthUserById } from "@/lib/auth-store";
import { getSession } from "@/lib/session";

export const getCurrentUser = cache(async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await getAuthUserById(session.userId);

  if (!user || !user.isEmailVerified || user.email !== session.email) {
    return null;
  }

  return user;
});

export async function requireVerifiedUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireCompleteUser() {
  const user = await requireVerifiedUser();
  if (!user.isProfileComplete) redirect("/profile/setup");
  return user;
}
