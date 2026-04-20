import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for auth token (NextAuth session token cookie)
  const token =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!token;
  const isOnDashboard = pathname.startsWith("/dashboard");
  const isOnLogin = pathname === "/login";
  const isOnApi = pathname.startsWith("/api");

  // Allow API routes to pass through
  if (isOnApi) return NextResponse.next();

  // Redirect unauthenticated users trying to access dashboard
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login page
  if (isOnLogin && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
