import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { getServerEnv } from "@/lib/env";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_DELAY_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export function isOtpExpired(expiresAt: Date, now = Date.now()) {
  return expiresAt.getTime() <= now;
}

export function generateOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(email: string, otp: string) {
  return createHmac("sha256", getServerEnv().OTP_PEPPER)
    .update(`${email}:${otp}`)
    .digest("hex");
}

export function otpMatches(expectedHash: string, actualHash: string) {
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(actualHash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
