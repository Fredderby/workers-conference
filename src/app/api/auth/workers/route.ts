import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import { ZONE_STRUCTURE } from "@/lib/db/mock";
import { isAdmin } from "@/lib/auth/rbac";
import { withError } from "@/lib/api-handler";

function auth(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export const GET = withError(async (req: NextRequest) => {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  if (searchParams.get("zones") === "1") {
    return NextResponse.json({ zones: ZONE_STRUCTURE });
  }

  let list = await db.listWorkers();
  if (isAdmin(user.role) || user.role === "viewer" || user.role === "regional_officer") {
    // Admins, viewers, and regional officers → all workers
  } else if (user.role === "verifier") {
    list = list.filter(w => w.registeredBy === user.id);
  } else {
    list = list.filter(w => w.registeredBy === user.id);
  }
  return NextResponse.json({ workers: list });
});

export const POST = withError(async (req: NextRequest) => {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, gender, zone, region, division, position, paymentStatus } = await req.json();

  const requiredFields: [string, any, string][] = [
    ["Name", name, "Full name"],
    ["Gender", gender, "Gender"],
    ["Zone", zone, "Zone"],
    ["Region", region, "Region"],
    ["Division", division, "Division"],
    ["Position", position, "Position"],
    ["Payment status", paymentStatus, "Payment status"],
  ];
  const missing = requiredFields.filter(([, v]) => !v || !String(v).trim()).map(([, , label]) => label);
  if (missing.length > 0) {
    const list = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}`;
    return NextResponse.json({ error: `${list} ${missing.length === 1 ? "is" : "are"} required. Please fill in every field before registering.` }, { status: 400 });
  }

  if (!["male", "female"].includes(String(gender).toLowerCase())) {
    return NextResponse.json({ error: "Gender must be either \"male\" or \"female\"." }, { status: 400 });
  }
  if (paymentStatus && !["paid", "unpaid"].includes(String(paymentStatus).toLowerCase())) {
    return NextResponse.json({ error: "Payment status must be either \"paid\" or \"unpaid\"." }, { status: 400 });
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
});

export const PATCH = withError(async (req: NextRequest) => {
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
    const newVerified = !w.verified;
    const patch: any = { verified: newVerified };
    if (newVerified) patch.verifiedAt = new Date().toISOString();
    else patch.verifiedAt = undefined;
    const updated = await db.updateWorker(workerId, patch);
    return NextResponse.json({ worker: updated });
  }

  if (patch) {
    const w = await db.updateWorker(workerId, patch);
    return NextResponse.json({ worker: w });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
});

export const DELETE = withError(async (req: NextRequest) => {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.findUserById(payload.sub);
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const registeredByName = searchParams.get("registeredByName");
  if (!registeredByName) return NextResponse.json({ error: "registeredByName required" }, { status: 400 });

  const workers = await db.listWorkers();
  const targets = workers.filter(w => w.registeredBy === null || w.registeredByName === registeredByName);
  for (const w of targets) {
    await db.deleteWorker(w.id);
  }

  await db.audit({ userId: user.id, action: "workers_cleanup", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "", browser: "", os: "", detail: `Cleaned up ${targets.length} phantom workers (registeredByName="${registeredByName}")` });
  return NextResponse.json({ deleted: targets.length });
});
