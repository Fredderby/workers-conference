import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import { ZONE_STRUCTURE } from "@/lib/db/mock";
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

  const { searchParams } = new URL(req.url);
  if (searchParams.get("zones") === "1") {
    return NextResponse.json({ zones: ZONE_STRUCTURE });
  }

  let list = await db.listWorkers();
  if (!isAdmin(user.role)) {
    list = list.filter(w => w.registeredBy === user.id);
  }
  return NextResponse.json({ workers: list });
}

export async function POST(req: NextRequest) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, gender, zone, region, division, position, paymentStatus } = await req.json();
  if (!name || !gender || !zone || !region || !division || !position) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const worker = await db.createWorker({
    name, gender, zone, region, division, position,
    paymentStatus: paymentStatus || "unpaid",
    verified: false,
    registeredBy: user.id,
    registeredByName: user.displayName,
  });

  await db.audit({ userId: user.id, action: "user_created", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "", browser: "", os: "", detail: `Registered worker: ${name}` });
  return NextResponse.json({ worker }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { workerId, action, patch } = body;

  if (action === "delete") {
    await db.deleteWorker(workerId);
    return NextResponse.json({ ok: true });
  }

  if (action === "toggleVerified") {
    const w = await db.findWorkerById(workerId);
    if (!w) return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    const updated = await db.updateWorker(workerId, { verified: !w.verified });
    return NextResponse.json({ worker: updated });
  }

  if (patch) {
    const w = await db.updateWorker(workerId, patch);
    return NextResponse.json({ worker: w });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
