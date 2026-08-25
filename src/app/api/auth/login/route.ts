import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/mock";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  const { identifier, password, rememberMe } = await req.json();
  if (!identifier || !password) return NextResponse.json({ error: "Missing credentials" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const ua = req.headers.get("user-agent") || "Unknown";
  const key = identifier.toLowerCase();
  const attempt = db.loginAttempts.get(key);
  const now = Date.now();
  if (attempt?.lockedUntil && attempt.lockedUntil > now) {
    const secs = Math.ceil((attempt.lockedUntil - now) / 1000);
    return NextResponse.json({ error: `Account locked. Try again in ${secs}s` }, { status: 423 });
  }

  const user = db.findUserByEmailOrUsername(identifier);
  if (!user || !user.isActive) {
    trackFailure(key, ip, ua, identifier);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    trackFailure(key, ip, ua, identifier);
    const att = db.loginAttempts.get(key);
    if (att && att.count >= 5) {
      att.lockedUntil = now + 5 * 60 * 1000; // 5 min lock
      db.audit({ userId: user.id, action: "account_lock", ip, device: ua, browser: ua, os: "unknown", detail: "Brute force lockout" });
    }
    return NextResponse.json({ error: "Invalid credentials", attempts: att?.count }, { status: 401 });
  }

  // success - reset attempts
  db.loginAttempts.delete(key);

  // temp password handling
  if (user.isTempPassword) {
    // issue limited token for password change
    const sid = `sid_${Math.random().toString(36).slice(2)}`;
    const accessToken = await signAccessToken({ sub: user.id, role: user.role, email: user.email, username: user.username, displayName: user.displayName, region: user.region, sid }, "15m");
    const res = NextResponse.json({ requirePasswordChange: true, user: sanitize(user) });
    res.cookies.set("access_token", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 900 });
    db.audit({ userId: user.id, action: "login_success", ip, device: ua, browser: ua, os: "unknown", detail: "temp password login" });
    return res;
  }

  const sid = `sid_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const accessToken = await signAccessToken({ sub: user.id, role: user.role, email: user.email, username: user.username, displayName: user.displayName, region: user.region, sid });
  const refreshToken = await signRefreshToken({ sub: user.id, sid });

  // create session
  db.sessions.push({
    id: sid,
    userId: user.id,
    refreshToken,
    device: ua.slice(0, 80),
    browser: detectBrowser(ua),
    os: detectOS(ua),
    ip,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000).toISOString(),
  });

  db.audit({ userId: user.id, action: "login_success", ip, device: ua, browser: detectBrowser(ua), os: detectOS(ua) });

  const res = NextResponse.json({ user: sanitize(user) });
  res.cookies.set("access_token", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 15 * 60 });
  res.cookies.set("refresh_token", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 });
  return res;
}

function trackFailure(key: string, ip: string, ua: string, identifier: string) {
  const prev = db.loginAttempts.get(key) || { identifier: key, count: 0, lastAttempt: 0 };
  prev.count += 1;
  prev.lastAttempt = Date.now();
  db.loginAttempts.set(key, prev);
  const user = db.findUserByEmailOrUsername(identifier);
  db.audit({ userId: user?.id || null, action: "login_failure", ip, device: ua, browser: ua, os: "unknown", detail: `fail #${prev.count}` });
}

function sanitize(u: any) {
  const { passwordHash, mfaSecret, ...rest } = u;
  return rest;
}
function detectBrowser(ua: string) {
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  return "Unknown";
}
function detectOS(ua: string) {
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Unknown";
}
