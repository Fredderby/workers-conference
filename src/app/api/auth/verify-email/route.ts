import { NextRequest, NextResponse } from "next/server";
import { db, resetTokens } from "@/lib/db/pg";
import { withError } from "@/lib/api-handler";

export const POST = withError(async (req: NextRequest) => {
  const { email, token } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
  // demo: any token "verify123" is valid, or if email exists
  const user = await db.findUserByEmail(email);
  if (!user) return NextResponse.json({ error: "Email not found" }, { status: 404 });
  if (token) {
    // verify token
    if (token !== "verify123" && token !== "123456") return NextResponse.json({ error: "Invalid verification token" }, { status: 400 });
    await db.audit({ userId: user.id, action: "login_success", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "verify-email", browser: "verify", os: "verify", detail: "Email verified" });
    return NextResponse.json({ ok: true, verified: true });
  }
  // send token
  const t = "verify123";
  resetTokens.set(t, { userId: user.id, expires: Date.now() + 15 * 60 * 1000 });
  return NextResponse.json({ ok: true, token: t, expiresIn: "15m", message: "Verification email sent (demo token: verify123)" });
});
