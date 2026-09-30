import { NextResponse } from "next/server";
import {
  deleteAuthChallenge,
  getAuthChallenge,
  incrementAuthAttempts,
  upsertVerifiedUser,
} from "@/lib/auth-store";
import { hashOtp, isOtpExpired, OTP_MAX_ATTEMPTS, otpMatches } from "@/lib/otp";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { createSessionToken } from "@/lib/session-token";
import { verifyOtpSchema } from "@/lib/validation";
import {
  checkRateLimit,
  rateLimitResponse,
  requestIdentity,
} from "@/lib/rate-limit";
import { postAuthRedirect } from "@/lib/navigation";
import { logServerError } from "@/lib/logger";
import { claimPreloadedProfile } from "@/lib/preloaded-profile";

export async function POST(request: Request) {
  try {
    const ipLimitPromise = checkRateLimit({
      scope: "otp-verify-campus-v2",
      identity: requestIdentity(request),
      limit: 200,
      windowMs: 15 * 60 * 1000,
    });
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      const ipLimit = await ipLimitPromise;
      if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfter);
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid verification code",
        },
        { status: 400 },
      );
    }

    const { email, otp } = parsed.data;
    const [ipLimit, challenge] = await Promise.all([
      ipLimitPromise,
      getAuthChallenge(email),
    ]);
    if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfter);
    if (!challenge || isOtpExpired(challenge.expiresAt)) {
      if (challenge) await deleteAuthChallenge(email);
      return NextResponse.json(
        { error: "This code has expired. Request a new one." },
        { status: 400 },
      );
    }

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      await deleteAuthChallenge(email);
      return NextResponse.json(
        { error: "Too many attempts. Request a new code." },
        { status: 429 },
      );
    }

    const submittedHash = hashOtp(email, otp);
    if (!otpMatches(challenge.otpHash, submittedHash)) {
      await incrementAuthAttempts(email);
      return NextResponse.json(
        { error: "That code is incorrect. Please try again." },
        { status: 400 },
      );
    }

    const user = await upsertVerifiedUser(email);
    const claimedPreloadedProfile = await claimPreloadedProfile(
      user.id,
      user.email,
    );

    const [, token] = await Promise.all([
      deleteAuthChallenge(email),
      createSessionToken({
        userId: user.id,
        email: user.email,
      }),
    ]);
    const response = NextResponse.json({
      ok: true,
      redirectTo: postAuthRedirect(
        user.isProfileComplete || claimedPreloadedProfile,
      ),
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    logServerError("otp_verification_failed", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
