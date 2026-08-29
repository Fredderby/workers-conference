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
  if (user.role === "super_admin" || user.role === "national_officer") {
    // Super admin + National officer → full list only
  } else if (user.role === "regional_officer") {
    // Regional officers → only workers in their assigned region/zone
    if (!user.region && !user.zone) {
      list = [];
    } else {
      list = list.filter(w => {
        if (user.region && w.region === user.region) return true;
        if (user.zone && w.zone === user.zone) return true;
        return false;
      });
    }
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

  // Regional officers can only register workers within their assigned region/zone
  if (user.role === "regional_officer") {
    if (user.region && region !== user.region) {
      return NextResponse.json({ error: `Forbidden: You can only register workers in your assigned region "${user.region}".` }, { status: 403 });
    }
    if (user.zone && !user.region && zone !== user.zone) {
      return NextResponse.json({ error: `Forbidden: You can only register workers in your assigned zone "${user.zone}".` }, { status: 403 });
    }
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

function canEditWorker(user: any, worker: any): boolean {
  if (!user || !worker) return false;
  if (isAdmin(user.role)) return true;
  if (user.role === "regional_officer") {
    // Regional officers can edit workers within their assigned region/zone
    // If user has no region/zone assigned, allow edit but log (fallback)
    if (!user.region && !user.zone) return true;
    if (user.region && worker.region === user.region) return true;
    if (user.zone && worker.zone === user.zone) return true;
    return false;
  }
  return false;
}

function canDeleteWorker(user: any): boolean {
  // Only National superadmin and National (national_officer) have full delete access
  // Regional officers cannot delete single workers - only via reupload within their access level
  return isAdmin(user.role);
}

export const PATCH = withError(async (req: NextRequest) => {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { workerId, action, patch } = body;

  if (action === "delete") {
    if (!canDeleteWorker(user)) {
      return NextResponse.json({ error: "Forbidden: Regional officers cannot delete workers individually. Use reupload within your access level." }, { status: 403 });
    }
    await db.deleteWorker(workerId);
    await db.audit({ userId: user.id, action: "user_created", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "", browser: "", os: "", detail: `Deleted worker ${workerId} by ${user.displayName} (${user.role})` });
    return NextResponse.json({ ok: true });
  }

  if (action === "toggleVerified") {
    const w = await db.findWorkerById(workerId);
    if (!w) return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    if (!canEditWorker(user, w)) {
      return NextResponse.json({ error: "Forbidden: You can only verify workers within your assigned region/zone." }, { status: 403 });
    }
    const newVerified = !w.verified;
    // Strict logic: unpaid workers cannot be verified
    if (newVerified && w.paymentStatus !== "paid") {
      return NextResponse.json({ error: `Cannot verify "${w.name}" — payment status is "${w.paymentStatus}". Only PAID workers can be verified.` }, { status: 400 });
    }
    const patchData: any = { verified: newVerified };
    if (newVerified) patchData.verifiedAt = new Date().toISOString();
    else patchData.verifiedAt = undefined;
    const updated = await db.updateWorker(workerId, patchData);
    return NextResponse.json({ worker: updated });
  }

  if (patch) {
    const existing = await db.findWorkerById(workerId);
    if (!existing) return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    if (!canEditWorker(user, existing)) {
      return NextResponse.json({ error: "Forbidden: You can only edit workers within your assigned region/zone." }, { status: 403 });
    }
    // Prevent regional officers from moving worker outside their region via edit
    if (user.role === "regional_officer") {
      const newRegion = patch.region ?? existing.region;
      const newZone = patch.zone ?? existing.zone;
      if (user.region && newRegion !== user.region) {
        return NextResponse.json({ error: "Forbidden: Cannot move worker outside your assigned region." }, { status: 403 });
      }
      if (user.zone && !user.region && newZone !== user.zone) {
        return NextResponse.json({ error: "Forbidden: Cannot move worker outside your assigned zone." }, { status: 403 });
      }
    }
    const w = await db.updateWorker(workerId, patch);
    await db.audit({ userId: user.id, action: "user_updated", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "", browser: "", os: "", detail: `Edited worker ${w?.name} (${workerId})` });
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
