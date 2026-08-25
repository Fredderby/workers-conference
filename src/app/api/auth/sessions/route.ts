import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await db.listSessions(payload.sub);
  return NextResponse.json({ sessions, currentSid: payload.sid });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const { sid, all } = await req.json().catch(() => ({ sid: null, all: false }));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (all) {
    const revoked = await db.revokeAllSessions(payload.sub);
    // keep current if needed? For demo revoke all including current -> logout
    const res = NextResponse.json({ ok: true, revoked });
    if (!(await db.sessionExists(payload.sid))) {
      res.cookies.set("access_token", "", { maxAge: 0, path: "/" });
      res.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
    }
    return res;
  }
  if (sid) {
    await db.removeSession(sid, payload.sub);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Missing sid" }, { status: 400 });
}
