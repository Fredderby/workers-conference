import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import { withError } from "@/lib/api-handler";

function isSuperAdmin(role: string) {
  return role === "super_admin";
}

export const GET = withError(async (req: NextRequest) => {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [registrationLocked, verificationLocked] = await Promise.all([db.isRegistrationLocked(), db.isVerificationLocked()]);
  return NextResponse.json({ registrationLocked, verificationLocked });
});

export const PATCH = withError(async (req: NextRequest) => {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.findUserById(payload.sub);
  if (!user || !isSuperAdmin(user.role as string)) return NextResponse.json({ error: "Forbidden: super_admin only" }, { status: 403 });
  const body = await req.json();
  const { registrationLocked, verificationLocked } = body;
  if (typeof registrationLocked === "boolean") await db.setRegistrationLocked(registrationLocked);
  if (typeof verificationLocked === "boolean") await db.setVerificationLocked(verificationLocked);
  const [reg, ver] = await Promise.all([db.isRegistrationLocked(), db.isVerificationLocked()]);
  await db.audit({ userId: user.id, action: "user_updated", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "", browser: "", os: "", detail: `Locks: registration=${reg} verification=${ver} by ${user.displayName}` });
  return NextResponse.json({ registrationLocked: reg, verificationLocked: ver });
});
