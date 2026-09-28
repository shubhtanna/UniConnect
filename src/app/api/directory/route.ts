import { NextResponse } from "next/server";
import { getCompleteApiUser } from "@/lib/api-auth";
import { browseDirectory } from "@/lib/directory";
import { directoryQuerySchema } from "@/lib/directory-validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logServerError } from "@/lib/logger";

export async function GET(request: Request) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;

  const limit = await checkRateLimit({
    scope: "directory-browse",
    identity: auth.user.id,
    limit: 120,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const url = new URL(request.url);
    const parsed = directoryQuerySchema.safeParse({
      q: url.searchParams.get("q") ?? "",
      cohort: url.searchParams.get("cohort") ?? "",
      skill: url.searchParams.get("skill") ?? "",
      interest: url.searchParams.get("interest") ?? "",
      lookingFor: url.searchParams.get("lookingFor") ?? "",
      page: url.searchParams.get("page") ?? "0",
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Check your directory filters" },
        { status: 400 },
      );
    }
    return NextResponse.json(await browseDirectory(parsed.data));
  } catch (error) {
    logServerError("directory_browse_failed", error);
    return NextResponse.json(
      { error: "The directory is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
