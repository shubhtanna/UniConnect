import { cookies } from "next/headers";
import {
  readSessionToken,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
} from "@/lib/session-token";

export { SESSION_COOKIE } from "@/lib/session-token";

export async function getSession() {
  const cookieStore = await cookies();
  return readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}
