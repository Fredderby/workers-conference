import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import { verifyPassword, hashPassword, validatePasswordPolicy } from "@/lib/auth/password";
import { withError } from "@/lib/api-handler";

export const POST = withError(async (req: NextRequest) => {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  const { currentPassword, newPassword } = await req.json();
  const user = await db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Current password incorrect" }, { status: 400 });
  const policyError = validatePasswordPolicy(newPassword);
  if (policyError) return NextResponse.json({ error: policyError }, { status: 400 });
  await db.updateUser(user.id, { passwordHash: await hashPassword(newPassword), isTempPassword: false });
  await db.audit({ userId: user.id, action: "password_change", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "password-change", browser: "change", os: "unknown" });
  return NextResponse.json({ ok: true });
});
