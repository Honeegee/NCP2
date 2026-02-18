import { NextRequest, NextResponse } from "next/server";

function parseJwtPayload(token: string): { id: string; email: string; role: string; exp: number } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("ncp_access_token")?.value;
  const payload = token ? parseJwtPayload(token) : null;

  // Check if token is expired
  const isValid = payload && payload.exp * 1000 > Date.now();
  const user = isValid ? payload : null;

  const { pathname } = request.nextUrl;

  // Public routes - no auth required
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/cookies" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    // Redirect authenticated users away from auth pages
    if (user && (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password")) {
      if (user.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes - require auth
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes - require admin role
  if (pathname.startsWith("/admin")) {
    if (user.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
