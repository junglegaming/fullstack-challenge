import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/game"];
const PUBLIC_PATHS = ["/", "/api/auth/callback", "/_next", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for auth cookie (set by callback)
  const authCookie = request.cookies.get("kc_auth")?.value;
  if (!authCookie) {
    // No auth cookie, redirect to home
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/game/:path*", "/profile/:path*"],
};
