import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API routes, static files, and auth callbacks entirely
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes("callback") ||
    pathname.includes("webhook")
  ) {
    return NextResponse.next();
  }

  // Check for session token (both dev and prod cookie names)
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  const isLoggedIn = !!sessionToken;
  const isAuthPage = pathname.startsWith("/auth");
const isPublic = pathname === "/" ||
  pathname === "/privacy" ||
  pathname === "/terms" ||
  pathname.startsWith("/subscription/verify") ||
  pathname.startsWith("/join") ||
  pathname.includes("webhook");

  // Logged-in users shouldn't see auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Non-logged-in users can only see public + auth pages
  if (!isLoggedIn && !isAuthPage && !isPublic) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};