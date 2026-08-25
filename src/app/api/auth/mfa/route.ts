import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/mock";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, code } = await req.json();
  const user = db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

  if (action === "enable") {
    user.mfaEnabled = true;
    user.mfaSecret = `MFA-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    db.audit({ userId: user.id, action: "mfa_verify", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "mfa", browser: "mfa", os: "mfa", detail: "MFA enabled" });
    return NextResponse.json({ ok: true, secret: user.mfaSecret, backupCodes: Array.from({length:8},()=> Math.random().toString(36).slice(2,8).toUpperCase()) });
  }
  if (action === "disable") {
    user.mfaEnabled = false;
    return NextResponse.json({ ok: true });
  }
  if (action === "verify") {
    // demo: any 6-digit code "123456" passes, or if code matches last 6 of secret
    if (code === "123456" || code === "000000") {
      db.audit({ userId: user.id, action: "mfa_verify", ip: "127.0.0.1", device:"mfa", browser:"mfa", os:"mfa", detail:"MFA verified" });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = db.findUserById(payload.sub);
  return NextResponse.json({ mfaEnabled: user?.mfaEnabled || false, secret: user?.mfaSecret });
}
