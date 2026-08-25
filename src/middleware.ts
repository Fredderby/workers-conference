import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/403", "/api/auth/login", "/api/auth/refresh", "/api/auth/logout"];

export async function middleware(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname;
    const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname === "/" || pathname.startsWith("/_next") || pathname.startsWith("/favicon");
    if (pathname.match(/\.(ico|png|jpe?g|svg|css|js)$/i)) return NextResponse.next();

    let payload: any = null;
    const token = req.cookies.get("access_token")?.value;
    if (token) {
      try {
        payload = await verifyToken(token);
      } catch {
        payload = null;
      }
    }

    if (!payload && !isPublic) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (payload && !isPublic && pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (payload && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch (err: any) {
    console.error("[middleware] error:", err?.message || err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
