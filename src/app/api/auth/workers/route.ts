import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import { ZONE_STRUCTURE } from "@/lib/db/mock";
import { isAdmin } from "@/lib/auth/rbac";
import { withError } from "@/lib/api-handler";
import { toProperCase } from "@/lib/utils";

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
    // Regional officers → only workers in their assigned region (case-insensitive, trimmed) — 25y fix for 263/248 drift
    if (!user.region) {
      list = [];
    } else {
      const want = user.region.trim().toLowerCase();
      list = list.filter(w => w.region && w.region.trim().toLowerCase() === want);
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

  const { name, gender, zone, region, division, position, paymentStatus, contact, contact2 } = await req.json();

  const requiredFields: [string, any, string][] = [
    ["Name", name, "Full name"],
    ["Gender", gender, "Gender"],
    ["Zone", zone, "Zone"],
    ["Region", region, "Region"],
    ["Division", division, "Division"],
    ["Position", position, "Position"],
    ["Payment status", paymentStatus, "Payment status"],
    ["Contact", contact, "Contact number"],
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
  const contactStr = String(contact || "").trim();
  if (!/^\d{10}$/.test(contactStr)) {
    return NextResponse.json({ error: "Contact must be exactly 10 digits (e.g. 0244123456)." }, { status: 400 });
  }
  if (contact2 && String(contact2).trim() && !/^\d{10}$/.test(String(contact2).trim())) {
    return NextResponse.json({ error: "Second contact must be exactly 10 digits if provided." }, { status: 400 });
  }
  const contact2Str = contact2 ? String(contact2).trim() : "";
  // One contact number cannot be reused — check contact/contact2 against all workers
  {
    const all = await db.listWorkers();
    const norm = (s: any) => String(s || "").trim();
    const dup = all.find(w => norm(w.contact) === contactStr || norm((w as any).contact2) === contactStr);
    if (dup) return NextResponse.json({ error: `Contact ${contactStr} is already used by "${dup.name}" (${dup.division}). One number cannot be used for two workers.` }, { status: 400 });
    if (contact2Str) {
      const dup2 = all.find(w => norm(w.contact) === contact2Str || norm((w as any).contact2) === contact2Str);
      if (dup2) return NextResponse.json({ error: `Second contact ${contact2Str} is already used by "${dup2.name}" (${dup2.division}). One number cannot be used for two workers.` }, { status: 400 });
      if (contact2Str === contactStr) return NextResponse.json({ error: "Contact and Second contact cannot be the same number." }, { status: 400 });
    }
  }

  if ((await db.isRegistrationLocked()) && user.role !== "super_admin") {
    return NextResponse.json({ error: "Registration is locked by super_admin. Only super_admin can register workers now." }, { status: 423 });
  }

  // Regional officers can only register workers within their assigned region — case-insensitive
  if (user.role === "regional_officer" && user.region) {
    if (String(region).trim().toLowerCase() !== String(user.region).trim().toLowerCase()) {
      return NextResponse.json({ error: `Forbidden: You can only register workers in your assigned region "${user.region}".` }, { status: 403 });
    }
  }

  const worker = await db.createWorker({
    name: toProperCase(String(name).trim()), gender: String(gender).trim().toLowerCase() as any, zone: String(zone).trim(), region: String(region).trim(), division: String(division).trim(), position: String(position).trim().toLowerCase().replace(/[\s\-\/]+/g, "_") as any,
    paymentStatus: String(paymentStatus).trim().toLowerCase() as any,
    verified: false,
    registeredBy: user.id,
    registeredByName: user.displayName,
    contact: contactStr,
    contact2: contact2 ? String(contact2).trim() : undefined,
  } as any);

  await db.audit({ userId: user.id, action: "user_created", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "", browser: "", os: "", detail: `Registered worker: ${name}` });
  return NextResponse.json({ worker }, { status: 201 });
});

// Normalize region for comparison: trim, lowercase, strip spaces/hyphens/underscores so
// "Ga Central", "Ga-Central", "GA CENTRAL", "Ga-Central " all match. Prevents access-control
// drift from a stored region that differs cosmetically from the account's assigned region.
function normRegion(s: any): string {
  return String(s || "").trim().toLowerCase().replace(/[\s\-_]+/g, "");
}

function canEditWorker(user: any, worker: any): boolean {
  if (!user || !worker) return false;
  if (isAdmin(user.role)) return true;
  if (user.role === "regional_officer") {
    if (!user.region) return true;
    return !!(worker.region && normRegion(worker.region) === normRegion(user.region));
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
    if ((await db.isVerificationLocked()) && user.role !== "super_admin") {
      return NextResponse.json({ error: "Verification is locked by super_admin. Only super_admin can verify now." }, { status: 423 });
    }
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
    if (user.role === "regional_officer" && user.region) {
      const newRegion = (patch.region ?? existing.region);
      if (normRegion(newRegion) !== normRegion(user.region)) {
        return NextResponse.json({ error: "Forbidden: Cannot move worker outside your assigned region." }, { status: 403 });
      }
    }
    if (patch.name !== undefined) patch.name = toProperCase(String(patch.name).trim());
    // Contact uniqueness on edit — exclude self
    if (patch.contact !== undefined || (patch as any).contact2 !== undefined) {
      const all = await db.listWorkers();
      const norm = (s: any) => String(s || "").trim();
      const newContact = patch.contact !== undefined ? norm(patch.contact) : norm(existing.contact);
      const newContact2 = (patch as any).contact2 !== undefined ? norm((patch as any).contact2) : norm((existing as any).contact2);
      if (newContact && !/^\d{10}$/.test(newContact)) return NextResponse.json({ error: "Contact must be exactly 10 digits." }, { status: 400 });
      if (newContact2 && !/^\d{10}$/.test(newContact2)) return NextResponse.json({ error: "Second contact must be exactly 10 digits if provided." }, { status: 400 });
      if (newContact && newContact2 && newContact === newContact2) return NextResponse.json({ error: "Contact and Second contact cannot be the same number." }, { status: 400 });
      const dup = newContact ? all.find(w => w.id !== workerId && (norm(w.contact) === newContact || norm((w as any).contact2) === newContact)) : null;
      if (dup) return NextResponse.json({ error: `Contact ${newContact} is already used by "${dup.name}" (${dup.division}). One number cannot be used for two workers.` }, { status: 400 });
      const dup2 = newContact2 ? all.find(w => w.id !== workerId && (norm(w.contact) === newContact2 || norm((w as any).contact2) === newContact2)) : null;
      if (dup2) return NextResponse.json({ error: `Second contact ${newContact2} is already used by "${dup2.name}" (${dup2.division}).` }, { status: 400 });
      if (patch.contact !== undefined) patch.contact = newContact;
      if ((patch as any).contact2 !== undefined) (patch as any).contact2 = newContact2 || undefined;
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
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  // Red-flag cleanup: delete all workers with missing/invalid 10-digit contact — 25y fix for re-upload flow
  if (searchParams.get("missingContact") === "1") {
    if (!isAdmin(user.role) && user.role !== "regional_officer" && user.role !== "national_officer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const all = await db.listWorkers();
    let targets = all.filter(w => !w.contact || !/^\d{10}$/.test(String(w.contact).trim()));
    // Regional officers can only clean their own region
    if (user.role === "regional_officer" && user.region) {
      const want = user.region.trim().toLowerCase();
      targets = targets.filter(w => w.region && w.region.trim().toLowerCase() === want);
    }
    for (const w of targets) await db.deleteWorker(w.id);
    await db.audit({ userId: user.id, action: "workers_cleanup", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "", browser: "", os: "", detail: `Red-flag cleanup: deleted ${targets.length} workers with missing contact by ${user.displayName} (${user.role})` });
    return NextResponse.json({ deleted: targets.length });
  }

  if (!isAdmin(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
