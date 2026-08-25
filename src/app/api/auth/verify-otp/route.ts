import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/mock";

const otpStore = new Map<string, { code: string; expires: number }>();

export async function POST(req: NextRequest) {
  const { email, code, action } = await req.json();
  if (action === "send") {
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    const c = "123456";
    otpStore.set(email.toLowerCase(), { code: c, expires: Date.now()+ 5*60*1000 });
    return NextResponse.json({ ok: true, code: c, expiresIn: "5m", message: "OTP sent (demo: 123456)" });
  }
  if (!email || !code) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const entry = otpStore.get(email.toLowerCase());
  if (!entry || entry.expires < Date.now()) return NextResponse.json({ error: "OTP expired" }, { status: 400 });
  if (entry.code !== code) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  otpStore.delete(email.toLowerCase());
  const user = db.users.find(u=> u.email.toLowerCase()===email.toLowerCase());
  if (user) db.audit({ userId: user.id, action: "mfa_verify", ip: "otp", device:"otp", browser:"otp", os:"otp", detail:"OTP verified" });
  return NextResponse.json({ ok: true, verified: true });
}
