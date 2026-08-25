import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/mock";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = db.sessions.filter(s => s.userId === payload.sub);
  return NextResponse.json({ sessions, currentSid: payload.sid });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const { sid, all } = await req.json().catch(() => ({ sid: null, all: false }));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (all) {
    const before = db.sessions.length;
    const remaining = db.sessions.filter(s => s.userId !== payload.sub);
    db.sessions.length = 0;
    db.sessions.push(...remaining);
    // keep current if needed? For demo revoke all including current -> logout
    const res = NextResponse.json({ ok: true, revoked: before - remaining.length });
    if (db.sessions.find(s => s.id === payload.sid) === undefined) {
      res.cookies.set("access_token", "", { maxAge: 0, path: "/" });
      res.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
    }
    return res;
  }
  if (sid) {
    const idx = db.sessions.findIndex(s => s.id === sid && s.userId === payload.sub);
    if (idx !== -1) db.sessions.splice(idx, 1);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Missing sid" }, { status: 400 });
}
