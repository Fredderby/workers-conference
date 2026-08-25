import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";

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
  return NextResponse.json({ attendances: await db.listAttendances() });
}

export async function POST(req: NextRequest) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workerId, workerName, zone, region, division, action } = await req.json();

  if (action === "checkout") {
    const a = await db.checkOut(workerId);
    return NextResponse.json({ attendance: a });
  }

  if (!workerId || !workerName) {
    return NextResponse.json({ error: "Missing worker info" }, { status: 400 });
  }

  const a = await db.checkIn({
    workerId, workerName, zone: zone || "", region: region || "", division: division || "",
    checkedInBy: user.id,
    checkedInByName: user.displayName,
  });

  return NextResponse.json({ attendance: a }, { status: 201 });
}
