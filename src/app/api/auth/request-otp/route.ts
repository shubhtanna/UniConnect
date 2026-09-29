import { NextResponse } from "next/server";
import {
  deleteAuthChallenge,
  getAuthChallenge,
  saveAuthChallenge,
} from "@/lib/auth-store";
import { sendOtpEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import {
  generateOtp,
  hashOtp,
  OTP_RESEND_DELAY_MS,
  OTP_TTL_MS,
} from "@/lib/otp";
import { requestOtpSchema } from "@/lib/validation";
import {
  checkRateLimit,
  rateLimitResponse,
  requestIdentity,
} from "@/lib/rate-limit";
import { logServerError } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const ipLimitPromise = checkRateLimit({
      scope: "otp-request-ip",
      identity: requestIdentity(request),
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    const body = await request.json();
    const parsed = requestOtpSchema.safeParse(body);

    if (!parsed.success) {
      const ipLimit = await ipLimitPromise;
      if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfter);
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid email address" },
        { status: 400 },
      );
    }

    const { email } = parsed.data;
    const [ipLimit, emailLimit, existing] = await Promise.all([
      ipLimitPromise,
      checkRateLimit({
        scope: "otp-request-email",
        identity: email,
        limit: 5,
        windowMs: 60 * 60 * 1000,
      }),
      getAuthChallenge(email),
    ]);
    if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfter);
    if (!emailLimit.allowed) return rateLimitResponse(emailLimit.retryAfter);
    if (existing && existing.resendAvailableAt.getTime() > Date.now()) {
      const retryAfter = Math.ceil(
        (existing.resendAvailableAt.getTime() - Date.now()) / 1000,
      );
      return NextResponse.json(
        {
          error: `Please wait ${retryAfter} seconds before requesting another code.`,
        },
        { status: 429, headers: { "Retry-After": retryAfter.toString() } },
      );
    }

    const otp = generateOtp();
    const now = Date.now();
    await saveAuthChallenge({
      email,
      otpHash: hashOtp(email, otp),
      expiresAt: new Date(now + OTP_TTL_MS),
      resendAvailableAt: new Date(now + OTP_RESEND_DELAY_MS),
      attempts: 0,
    });

    try {
      await sendOtpEmail(email, otp);
    } catch (error) {
      await deleteAuthChallenge(email);
      logServerError("otp_delivery_failed", error);
      return NextResponse.json(
        { error: "We could not send the verification code. Please try again." },
        { status: 503 },
      );
    }

    const env = getServerEnv();
    return NextResponse.json({
      ok: true,
      expiresInSeconds: OTP_TTL_MS / 1000,
      ...(env.NODE_ENV === "development" && !env.SMTP_HOST
        ? { devOtp: otp }
        : {}),
    });
  } catch (error) {
    logServerError("otp_request_failed", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
