import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db, ZONE_STRUCTURE } from "@/lib/db/mock";
import { isAdmin } from "@/lib/auth/rbac";

function auth(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  if (searchParams.get("zones") === "1") {
    return NextResponse.json({ zones: ZONE_STRUCTURE });
  }

  let list = db.workers;
  if (!isAdmin(user.role)) {
    list = list.filter(w => w.registeredBy === user.id);
  }
  return NextResponse.json({ workers: list });
}

export async function POST(req: NextRequest) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, gender, zone, region, division, position, paymentStatus } = await req.json();
  if (!name || !gender || !zone || !region || !division || !position) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const worker = db.createWorker({
    name, gender, zone, region, division, position,
    paymentStatus: paymentStatus || "unpaid",
    verified: false,
    registeredBy: user.id,
    registeredByName: user.displayName,
  });

  db.audit({ userId: user.id, action: "user_created", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "", browser: "", os: "", detail: `Registered worker: ${name}` });
  return NextResponse.json({ worker }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { workerId, action, patch } = body;

  if (action === "delete") {
    db.deleteWorker(workerId);
    return NextResponse.json({ ok: true });
  }

  if (action === "toggleVerified") {
    const w = db.updateWorker(workerId, { verified: !db.workers.find(x => x.id === workerId)?.verified });
    return NextResponse.json({ worker: w });
  }

  if (patch) {
    const w = db.updateWorker(workerId, patch);
    return NextResponse.json({ worker: w });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
