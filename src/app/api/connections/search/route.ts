import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import { searchConnections } from "@/lib/connection-search";
import { connectionSearchSchema } from "@/lib/connection-validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logServerError } from "@/lib/logger";

export async function POST(request: Request) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;

  const limit = await checkRateLimit({
    scope: "connection-search",
    identity: auth.user.id,
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const parsed = connectionSearchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Check your search" },
        { status: 400 },
      );
    }
    return NextResponse.json(await searchConnections(auth.user.id, parsed.data.query));
  } catch (error) {
    logServerError("connection_search_failed", error);
    return NextResponse.json(
      { error: "Search is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
