import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/mock";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { passwordHash, mfaSecret, ...safe } = user as any;
  return NextResponse.json({ user: safe });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { username, displayName, email } = body;

  if (username) {
    const existing = db.findUserByEmailOrUsername(username);
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
  }

  if (email) {
    const existing = db.findUserByEmailOrUsername(email);
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  const patch: any = {};
  if (username) patch.username = username;
  if (displayName) patch.displayName = displayName;
  if (email) patch.email = email;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  db.updateUser(user.id, patch);
  db.audit({ userId: user.id, action: "user_updated", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "", browser: "", os: "", detail: `Profile updated: ${Object.keys(patch).join(", ")}` });

  const updated = db.findUserById(user.id);
  const { passwordHash: _, mfaSecret: __, ...safe } = updated as any;
  return NextResponse.json({ user: safe });
}
