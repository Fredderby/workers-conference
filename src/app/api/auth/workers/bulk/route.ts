import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import { ZONE_STRUCTURE } from "@/lib/db/mock";
import { withError } from "@/lib/api-handler";

const VALID_POSITIONS = ["adult_leader", "adult_worker", "youth_worker", "youth_leader", "children_leader", "children_worker", "zonal_admin", "regional_admin", "divisional_admin", "national_officer", "campus_leader", "campus_worker"];
const VALID_PAYMENTS = ["paid", "unpaid"];
const VALID_GENDERS = ["male", "female"];

function pick(row: any, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && String(row[k]).trim() !== "") return String(row[k]).trim();
  }
  return "";
}

const REQUIRED_HEADERS = ["FullName", "Gender", "Zone", "Region", "Division", "Position", "PaymentStatus"];

function validateRow(row: any, index: number): string | null {
  const missing = REQUIRED_HEADERS.filter(h => pick(row, h) === "").map(h => ({
    FullName: "Full Name", Gender: "Gender", Zone: "Zone", Region: "Region",
    Division: "Division", Position: "Position", PaymentStatus: "Payment Status",
  }[h]));
  if (missing.length > 0) {
    const list = missing.length === 1 ? missing[0] : missing.slice(0, -1).join(", ") + " and " + missing[missing.length - 1];
    return `Row ${index + 1}: ${list} ${missing.length === 1 ? "is" : "are"} missing. Fill in every column to import this worker.`;
  }

  const gender = pick(row, "Gender").toLowerCase();
  if (!VALID_GENDERS.includes(gender)) return `Row ${index + 1}: Gender must be "male" or "female" — got "${row.Gender}".`;
  if (!ZONE_STRUCTURE[row.Zone]) return `Row ${index + 1}: Zone "${row.Zone}" is not recognised. Check the template's list of zones.`;
  if (!ZONE_STRUCTURE[row.Zone]?.[row.Region]) return `Row ${index + 1}: Region "${row.Region}" does not belong to zone "${row.Zone}".`;
  if (!(ZONE_STRUCTURE[row.Zone]?.[row.Region] || []).includes(row.Division)) return `Row ${index + 1}: Division "${row.Division}" is not in region "${row.Region}".`;
  if (!VALID_POSITIONS.includes(row.Position)) return `Row ${index + 1}: Position "${row.Position}" is not recognised.`;
  if (!VALID_PAYMENTS.includes(row.PaymentStatus.toLowerCase())) return `Row ${index + 1}: Payment status must be "paid" or "unpaid" — got "${row.PaymentStatus}".`;
  return null;
}

function parseCSV(text: string): { headers: string[]; rows: any[] } {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    const obj: any = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
  return { headers, rows };
}

export const GET = withError(async (req: NextRequest) => {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const csv = [
    "# Workers Conference — Bulk Upload Template",
    "# Fill in EVERY column for each worker. Do not edit or remove the header row (last line).",
    "# Zone / Region / Division: use the exact names from the system.",
    "# Position: adult_leader, adult_worker, youth_worker, youth_leader, children_leader, children_worker, zonal_admin, regional_admin, divisional_admin, national_officer, campus_leader, campus_worker",
    "# PaymentStatus: paid OR unpaid",
    "FullName,Gender,Zone,Region,Division,Position,PaymentStatus",
  ].join("\n");
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="worker-upload-template.csv"' },
  });
});

export const POST = withError(async (req: NextRequest) => {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await req.json();
  if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: "Your file is empty or has a header row only. Add at least one worker row before uploading." }, { status: 400 });
  if (rows.length > 500) return NextResponse.json({ error: "Your file has too many rows. Split it into batches of 500 workers or fewer." }, { status: 400 });

  const errors: { row: number; message: string }[] = [];
  const created: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const err = validateRow(row, i);
    if (err) { errors.push({ row: i + 1, message: err }); continue; }

    const worker = await db.createWorker({
      name: pick(row, "FullName"),
      gender: pick(row, "Gender").toLowerCase() as "male" | "female",
      zone: pick(row, "Zone"),
      region: pick(row, "Region"),
      division: pick(row, "Division"),
      position: pick(row, "Position") as any,
      paymentStatus: pick(row, "PaymentStatus").toLowerCase() as "paid" | "unpaid",
      verified: false,
      registeredBy: payload.sub,
      registeredByName: "Bulk Import",
    });
    created.push(worker);
  }

  await db.audit({ userId: payload.sub, action: "workers_bulk_import", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "admin", browser: "admin", os: "admin", detail: `Bulk imported ${created.length} workers, ${errors.length} errors` });

  return NextResponse.json({ created: created.length, errors, total: rows.length });
});
