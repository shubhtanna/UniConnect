import { createHash, timingSafeEqual } from "crypto";

export const TEST_ACCESS_EMAIL = "shubh.tanna_pgpaias27@mastersunion.org";

export function secureTokenMatches(expected: string, submitted: string) {
  if (!expected || !submitted) return false;

  const expectedHash = createHash("sha256").update(expected).digest();
  const submittedHash = createHash("sha256").update(submitted).digest();
  return timingSafeEqual(expectedHash, submittedHash);
}

export function testAccessHasExpired(expiresAt: string, now = Date.now()) {
  const expiry = Date.parse(expiresAt);
  return !Number.isFinite(expiry) || expiry <= now;
}
