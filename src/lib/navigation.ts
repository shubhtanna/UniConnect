export function postAuthRedirect(isProfileComplete: boolean) {
  return isProfileComplete ? "/dashboard" : "/profile/setup";
}

// Generated favicon and link-preview images must load without a session.
const METADATA_ROUTES = ["/icon", "/apple-icon", "/opengraph-image"];

export function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/privacy" ||
    pathname === "/api/health" ||
    METADATA_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  );
}
