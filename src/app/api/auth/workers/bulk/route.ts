import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import { ZONE_STRUCTURE } from "@/lib/db/mock";
import { withError } from "@/lib/api-handler";

const VALID_POSITIONS = ["adult_leader", "adult_worker", "youth_worker", "youth_leader", "children_leader", "children_worker"];
const VALID_PAYMENTS = ["paid", "unpaid"];
const VALID_GENDERS = ["male", "female"];

function validateRow(row: any, index: number): string | null {
  if (!row.FullName || !row.FullName.trim()) return `Row ${index + 1}: Full Name is required`;
  if (!row.Gender || !VALID_GENDERS.includes(row.Gender.toLowerCase())) return `Row ${index + 1}: Gender must be "male" or "female"`;
  if (!row.Zone || !ZONE_STRUCTURE[row.Zone]) return `Row ${index + 1}: Invalid zone "${row.Zone}"`;
  if (!row.Region || !ZONE_STRUCTURE[row.Zone]?.[row.Region]) return `Row ${index + 1}: Region "${row.Region}" not found in ${row.Zone}`;
  if (!row.Division || !(ZONE_STRUCTURE[row.Zone]?.[row.Region] || []).includes(row.Division)) return `Row ${index + 1}: Division "${row.Division}" not found in ${row.Region}`;
  if (row.Position && !VALID_POSITIONS.includes(row.Position)) return `Row ${index + 1}: Invalid position "${row.Position}"`;
  if (row.PaymentStatus && !VALID_PAYMENTS.includes(row.PaymentStatus.toLowerCase())) return `Row ${index + 1}: Payment status must be "paid" or "unpaid"`;
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

  const csv = "FullName,Gender,Zone,Region,Division,Position,PaymentStatus\nJohn Mensah,male,Central-Western Zone,Tarkwa,Tarkwa div,adult_worker,paid\nGrace Asante,female,Greater Accra Zone,Accra Metro,Abeka-Lapaz,youth_worker,unpaid";
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
  if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  if (rows.length > 500) return NextResponse.json({ error: "Maximum 500 rows per upload" }, { status: 400 });

  const errors: { row: number; message: string }[] = [];
  const created: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const err = validateRow(row, i);
    if (err) { errors.push({ row: i + 1, message: err }); continue; }

    const worker = await db.createWorker({
      name: row.FullName.trim(),
      gender: row.Gender.toLowerCase(),
      zone: row.Zone,
      region: row.Region,
      division: row.Division,
      position: row.Position || "adult_worker",
      paymentStatus: (row.PaymentStatus || "unpaid").toLowerCase(),
      verified: false,
      registeredBy: payload.sub,
      registeredByName: "Bulk Import",
    });
    created.push(worker);
  }

  await db.audit({ userId: payload.sub, action: "workers_bulk_import", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "admin", browser: "admin", os: "admin", detail: `Bulk imported ${created.length} workers, ${errors.length} errors` });

  return NextResponse.json({ created: created.length, errors, total: rows.length });
});
