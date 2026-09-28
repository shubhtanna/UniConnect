import { SignJWT, jwtVerify } from "jose";
import { getServerEnv } from "@/lib/env";

export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_COOKIE = "uniconnect_session";

export type SessionPayload = {
  userId: string;
  email: string;
};

function sessionKey() {
  return new TextEncoder().encode(getServerEnv().SESSION_SECRET);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(sessionKey());
}

export async function readSessionToken(token?: string) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionKey(), {
      algorithms: ["HS256"],
    });

    if (typeof payload.userId !== "string" || typeof payload.email !== "string") {
      return null;
    }

    return { userId: payload.userId, email: payload.email } satisfies SessionPayload;
  } catch {
    return null;
  }
}
