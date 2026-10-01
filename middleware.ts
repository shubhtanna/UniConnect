import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/session-token";
import { isPublicPath } from "@/lib/navigation";

const AUTH_API_PATHS = new Set([
  "/api/auth/request-otp",
  "/api/auth/verify-otp",
  "/api/auth/test-access",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicApi = AUTH_API_PATHS.has(pathname);

  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");
    if ((origin && origin !== request.nextUrl.origin) || fetchSite === "cross-site") {
      return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
    }
  }

  if (isPublicPath(pathname) || isPublicApi) return NextResponse.next();

  const session = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
