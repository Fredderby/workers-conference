import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import { isAdmin } from "@/lib/auth/rbac";

function auth(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let list = await db.listReports();
  if (!isAdmin(user.role)) {
    list = list.filter(r => r.submittedBy === user.id);
  }
  return NextResponse.json({ reports: list });
}

export async function POST(req: NextRequest) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, category, zone, region, division } = await req.json();
  if (!title || !description || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const report = await db.createReport({
    title, description, category, zone: zone || "", region: region || "", division: division || "",
    submittedBy: user.id,
    submittedByName: user.displayName,
  });

  return NextResponse.json({ report }, { status: 201 });
}
