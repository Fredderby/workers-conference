import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/mock";

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get("refresh_token")?.value;
  if (!refresh) return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  const payload = await verifyRefreshToken(refresh);
  if (!payload) return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });

  const session = db.sessions.find(s => s.id === payload.sid && s.userId === payload.sub);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 401 });
  // rotate
  const user = db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const newRefresh = await signRefreshToken({ sub: user.id, sid: session.id });
  session.refreshToken = newRefresh;
  session.lastActivity = new Date().toISOString();

  const accessToken = await signAccessToken({ sub: user.id, role: user.role, email: user.email, username: user.username, displayName: user.displayName, region: user.region, sid: session.id });
  db.audit({ userId: user.id, action: "refresh_token", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "refresh", browser: "refresh", os: "unknown" });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("access_token", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 15 * 60 });
  res.cookies.set("refresh_token", newRefresh, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60 });
  return res;
}
