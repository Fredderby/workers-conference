import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/mock";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Super admin sees all, others see own
  const logs = payload.role === "super_admin" ? db.auditLogs : db.auditLogs.filter(l => l.userId === payload.sub);
  return NextResponse.json({ logs });
}
