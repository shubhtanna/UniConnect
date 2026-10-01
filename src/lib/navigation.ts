export function postAuthRedirect(isProfileComplete: boolean) {
  return isProfileComplete ? "/dashboard" : "/profile/setup";
}

export function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/test-access" ||
    pathname === "/api/health"
  );
}
