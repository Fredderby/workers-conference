import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import { withError } from "@/lib/api-handler";

export const GET = withError(async (req: NextRequest) => {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const logs = await db.listAuditLogs(payload.role === "super_admin" ? undefined : payload.sub);
  return NextResponse.json({ logs });
});
