import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import { isAdmin } from "@/lib/auth/rbac";
import { withError } from "@/lib/api-handler";

export const GET = withError(async (req: NextRequest) => {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const approvals = await db.listApprovals();
  return NextResponse.json({ approvals });
});

export const POST = withError(async (req: NextRequest) => {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.findUserById(payload.sub);
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { region, verifiedCount, notes } = await req.json();
  if (!region) return NextResponse.json({ error: "Region is required" }, { status: 400 });

  const batchNumber = (await db.getLatestBatchNumber(region)) + 1;

  const approval = await db.createApproval({
    region,
    approvedBy: user.id,
    approvedByName: user.displayName,
    verifiedCount: verifiedCount || 0,
    batchNumber,
    notes,
  });

  await db.audit({
    userId: user.id,
    action: "user_updated",
    ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
    device: "admin",
    browser: "admin",
    os: "admin",
    detail: `Approved batch ${batchNumber} for region "${region}" (${verifiedCount} workers)`,
  });

  return NextResponse.json({ approval }, { status: 201 });
});
