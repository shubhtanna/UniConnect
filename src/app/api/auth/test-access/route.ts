import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertVerifiedUser } from "@/lib/auth-store";
import { getServerEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { postAuthRedirect } from "@/lib/navigation";
import { claimPreloadedProfile } from "@/lib/preloaded-profile";
import {
  checkRateLimit,
  rateLimitResponse,
  requestIdentity,
} from "@/lib/rate-limit";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { createSessionToken } from "@/lib/session-token";
import {
  secureTokenMatches,
  TEST_ACCESS_EMAIL,
  testAccessHasExpired,
} from "@/lib/test-access";

const requestSchema = z.object({
  token: z.string().min(32).max(512),
});

function unavailableResponse() {
  return NextResponse.json(
    { error: "This private test link is unavailable or has expired." },
    {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function POST(request: Request) {
  try {
    const limit = await checkRateLimit({
      scope: "private-test-access-v1",
      identity: requestIdentity(request),
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    const env = getServerEnv();
    if (
      !env.TEST_ACCESS_ENABLED ||
      !env.TEST_ACCESS_SECRET ||
      !env.TEST_ACCESS_EXPIRES_AT ||
      testAccessHasExpired(env.TEST_ACCESS_EXPIRES_AT)
    ) {
      return unavailableResponse();
    }

    const parsed = requestSchema.safeParse(await request.json());
    if (
      !parsed.success ||
      !secureTokenMatches(env.TEST_ACCESS_SECRET, parsed.data.token)
    ) {
      return unavailableResponse();
    }

    const user = await upsertVerifiedUser(TEST_ACCESS_EMAIL);
    const claimedPreloadedProfile = await claimPreloadedProfile(
      user.id,
      user.email,
    );
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
    });

    const response = NextResponse.json(
      {
        ok: true,
        redirectTo: postAuthRedirect(
          user.isProfileComplete || claimedPreloadedProfile,
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    logServerError("private_test_access_failed", error);
    return NextResponse.json(
      { error: "Private test access could not be opened." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
