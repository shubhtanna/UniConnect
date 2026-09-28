import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { RateLimit } from "@/models/RateLimit";

type MemoryBucket = { count: number; expiresAt: number };
const globalWithRateLimits = globalThis as typeof globalThis & {
  uniconnectRateLimits?: Map<string, MemoryBucket>;
};
const memoryBuckets = globalWithRateLimits.uniconnectRateLimits ?? new Map<string, MemoryBucket>();
globalWithRateLimits.uniconnectRateLimits = memoryBuckets;

export async function checkRateLimit(options: {
  scope: string;
  identity: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const bucket = Math.floor(now / options.windowMs);
  const fingerprint = createHash("sha256").update(options.identity).digest("hex").slice(0, 32);
  const key = `${options.scope}:${fingerprint}:${bucket}`;
  const expiresAt = (bucket + 1) * options.windowMs;
  let count: number;

  if (getServerEnv().DATABASE_MODE === "memory") {
    const current = memoryBuckets.get(key);
    count = (current?.count ?? 0) + 1;
    memoryBuckets.set(key, { count, expiresAt });
    if (memoryBuckets.size > 2_000) {
      for (const [storedKey, value] of memoryBuckets) {
        if (value.expiresAt <= now) memoryBuckets.delete(storedKey);
      }
    }
  } else {
    await connectToDatabase();
    const current = await RateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(expiresAt) } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
    count = current.count;
  }

  return {
    allowed: count <= options.limit,
    remaining: Math.max(0, options.limit - count),
    retryAfter: Math.max(1, Math.ceil((expiresAt - now) / 1000)),
  };
}

export function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests. Please wait and try again." },
    { status: 429, headers: { "Retry-After": retryAfter.toString() } },
  );
}

export function requestIdentity(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}
