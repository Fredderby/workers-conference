import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/mock";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ user: null }, { status: 401 });
  const user = db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  const { passwordHash, mfaSecret, ...safe } = user as any;
  return NextResponse.json({ user: safe, sessionId: payload.sid });
}
