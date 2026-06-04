import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes, auth callbacks, webhooks
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes("callback") ||
    pathname.includes("webhook") ||
    pathname.startsWith("/icons")
  ) {
    return NextResponse.next();
  }

  // Public routes — no auth required
  const isPublic =
    pathname === "/" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname.startsWith("/subscription/verify") ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/auth");

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!sessionToken) {
    // Not logged in — redirect to login with callbackUrl
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow onboarding page through
  if (pathname === "/onboarding") {
    return NextResponse.next();
  }

  return NextResponse.next();
}