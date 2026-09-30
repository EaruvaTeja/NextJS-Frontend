// middleware.ts
//
// Next.js middleware — runs on the server before every request.
//
// New behavior (after removing /login and /register pages):
//   1. Protected routes (unauthenticated) -> redirect to /?auth=login&from=<path>
//   2. Legacy /login or /register URLs   -> redirect to /?auth=login|register
//   3. Logged-in user visiting legacy auth URLs -> redirect home
//
// The `?auth=` param is picked up by <AuthRedirectHandler /> which opens
// the modal. See components/auth/AuthRedirectHandler.tsx.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = ["/cart", "/checkout", "/orders", "/profile"];

// Legacy URLs that no longer exist as pages — redirect to home with ?auth=
const LEGACY_AUTH_MAP: Record<string, "login" | "register"> = {
  "/login": "login",
  "/register": "register",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLoggedIn = request.cookies.get("swiggy_auth")?.value === "1";

  // -------------------------------------------------------------------------
  // Case 1: Legacy /login or /register URL
  // -------------------------------------------------------------------------
  const legacyAuthView = LEGACY_AUTH_MAP[pathname];

  if (legacyAuthView) {
    if (isLoggedIn) {
      // Already logged in → just go home
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Otherwise send to /?auth=login or /?auth=register
    const url = new URL("/", request.url);
    url.searchParams.set("auth", legacyAuthView);
    return NextResponse.redirect(url);
  }

  // -------------------------------------------------------------------------
  // Case 2: Protected route + not logged in
  // -------------------------------------------------------------------------
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected && !isLoggedIn) {
    const url = new URL("/", request.url);
    url.searchParams.set("auth", "login");
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // -------------------------------------------------------------------------
  // Default: continue to the page
  // -------------------------------------------------------------------------
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

