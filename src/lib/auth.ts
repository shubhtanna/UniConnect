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

// Protected pages are already guarded by their parent layout. Reading the
// signed session here avoids repeating a database user lookup on every client
// navigation while the layout remains the source of truth for access checks.
export async function requirePageSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return { id: session.userId, email: session.email };
}
