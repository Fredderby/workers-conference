import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import type { RoleType, User } from "@/lib/db/mock";
import { hashPassword } from "@/lib/auth/password";
import { isAdmin } from "@/lib/auth/rbac";
import { withError } from "@/lib/api-handler";

export const GET = withError(async (req: NextRequest) => {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.findUserById(payload.sub);
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = (await db.listUsers()).map(({ passwordHash, mfaSecret, ...u }) => u);
  return NextResponse.json({ users });
});

export const POST = withError(async (req: NextRequest) => {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const currentUser = await db.findUserById(payload.sub);
  if (!currentUser || !isAdmin(currentUser.role)) return NextResponse.json({ error: "Forbidden — only admins can create users" }, { status: 403 });

  const { email, username, displayName, role, zone, region, tempPassword } = await req.json();
  if (!email || !username || !displayName || !role) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  if (await db.findUserByEmailOrUsername(email) || await db.findUserByEmailOrUsername(username)) {
    return NextResponse.json({ error: "Email or username already exists" }, { status: 409 });
  }

  const validRoles: RoleType[] = ["super_admin", "national_officer", "regional_officer", "verifier", "viewer"];
  if (!validRoles.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const pw = tempPassword || "TempPass123!";
  const hash = await hashPassword(pw);
  const newUser = await db.createUser({
    email, username, displayName, role, zone, region,
    passwordHash: hash,
    isActive: true,
    isTempPassword: true,
    mfaEnabled: false,
    createdBy: currentUser.id,
  });

  await db.audit({ userId: currentUser.id, action: "user_created", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "admin", browser: "admin", os: "admin", detail: `Created ${role} (${displayName})${zone ? ` — Zone: ${zone}` : ""}${region ? ` — Region: ${region}` : ""} — temp password: ${pw}` });

  const { passwordHash, mfaSecret, ...safe } = newUser as any;
  return NextResponse.json({ user: safe, tempPassword: pw }, { status: 201 });
});

export const PATCH = withError(async (req: NextRequest) => {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const currentUser = await db.findUserById(payload.sub);
  if (!currentUser || !isAdmin(currentUser.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, action, ...patch } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  if (action === "activate") {
    await db.activateUser(userId);
    await db.audit({ userId: currentUser.id, action: "user_activated", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "admin", browser: "admin", os: "admin", detail: `Activated ${userId}` });
    return NextResponse.json({ ok: true });
  }
  if (action === "deactivate") {
    await db.deactivateUser(userId);
    await db.audit({ userId: currentUser.id, action: "user_deactivated", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "admin", browser: "admin", os: "admin", detail: `Deactivated ${userId}` });
    return NextResponse.json({ ok: true });
  }
  if (action === "reset_password") {
    const { newPassword } = patch;
    if (!newPassword || newPassword.length < 12) return NextResponse.json({ error: "Password must be at least 12 characters" }, { status: 400 });
    const hash = await hashPassword(newPassword);
    const u = await db.updateUser(userId, { passwordHash: hash, isTempPassword: true } as any);
    if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });
    await db.audit({ userId: currentUser.id, action: "password_reset", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "admin", browser: "admin", os: "admin", detail: `Reset password for ${userId}` });
    return NextResponse.json({ ok: true });
  }

  const user = await db.updateUser(userId, patch);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  await db.audit({ userId: currentUser.id, action: "user_updated", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "admin", browser: "admin", os: "admin", detail: `Updated ${userId}` });
  return NextResponse.json({ ok: true });
});
