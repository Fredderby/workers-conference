import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/403", "/api/auth/login", "/api/auth/refresh", "/api/auth/logout"];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname === "/" || pathname.startsWith("/_next") || pathname.startsWith("/favicon");
  if (pathname.match(/\.(ico|png|jpe?g|svg|css|js)$/i)) return NextResponse.next();

  const token = req.cookies.get("access_token")?.value;
  let payload: any = null;
  if (token) payload = await verifyToken(token);

  if (!payload && !isPublic) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // All roles go to /dashboard
  if (payload && !isPublic && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (payload && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
