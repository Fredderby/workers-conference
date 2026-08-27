import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import { ZONE_STRUCTURE } from "@/lib/db/mock";
import { withError } from "@/lib/api-handler";
import ExcelJS from "exceljs";

const VALID_POSITIONS = ["adult_leader", "adult_worker", "youth_worker", "youth_leader", "children_leader", "children_worker", "zonal_admin", "regional_admin", "divisional_admin", "national_officer", "campus_leader", "campus_worker"];
const VALID_PAYMENTS = ["paid", "unpaid"];
const VALID_GENDERS = ["male", "female"];

// Support both old and new header names for backwards compatibility
function pick(row: any, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && String(row[k]).trim() !== "") return String(row[k]).trim();
  }
  // case-insensitive fallback with normalized keys (trim, lower)
  const lowerKeys = keys.map(k => k.toLowerCase().replace(/\s+/g, ""));
  for (const rk of Object.keys(row)) {
    const norm = rk.toLowerCase().replace(/\s+/g, "");
    if (lowerKeys.includes(norm) && String(row[rk]).trim() !== "") return String(row[rk]).trim();
  }
  return "";
}

// New beautiful template headers: Zone, Region, Division, Full Name, Gender, Position, Contact, Payment, Contact
// Second Contact is treated as alternate contact (Contact 2)
const REQUIRED_HEADERS = ["Zone", "Region", "Division", "Full Name", "Gender", "Position", "Contact", "Payment"];
// Note: Second Contact (col I) is optional alternate contact - not required

function validateRow(row: any, index: number): string | null {
  // Handle duplicate Contact: first Contact is required, second is optional
  // Row object will have Contact and Contact_2 keys if Excel has duplicate headers
  const contactVal = pick(row, "Contact", "contact");
  const paymentVal = pick(row, "Payment", "PaymentStatus", "Payment Status");

  const missing = [];
  if (!pick(row, "Zone", "zone")) missing.push("Zone");
  if (!pick(row, "Region", "region")) missing.push("Region");
  if (!pick(row, "Division", "division")) missing.push("Division");
  if (!pick(row, "Full Name", "FullName", "fullname", "name")) missing.push("Full Name");
  if (!pick(row, "Gender", "gender")) missing.push("Gender");
  if (!pick(row, "Position", "position")) missing.push("Position");
  if (!contactVal) missing.push("Contact");
  if (!paymentVal) missing.push("Payment");

  if (missing.length > 0) {
    const list = missing.length === 1 ? missing[0] : missing.slice(0, -1).join(", ") + " and " + missing[missing.length - 1];
    return `Row ${index + 1}: ${list} ${missing.length === 1 ? "is" : "are"} missing. Fill in every column to import this worker.`;
  }

  const gender = pick(row, "Gender", "gender").toLowerCase();
  if (!VALID_GENDERS.includes(gender)) return `Row ${index + 1}: Gender must be "male" or "female" — got "${pick(row, "Gender")}".`;
  const zone = pick(row, "Zone", "zone");
  const region = pick(row, "Region", "region");
  const division = pick(row, "Division", "division");
  if (!ZONE_STRUCTURE[zone]) return `Row ${index + 1}: Zone "${zone}" is not recognised. Check the template's list of zones.`;
  if (!ZONE_STRUCTURE[zone]?.[region]) return `Row ${index + 1}: Region "${region}" does not belong to zone "${zone}".`;
  if (!(ZONE_STRUCTURE[zone]?.[region] || []).includes(division)) return `Row ${index + 1}: Division "${division}" is not in region "${region}".`;
  if (!VALID_POSITIONS.includes(pick(row, "Position", "position"))) return `Row ${index + 1}: Position "${pick(row, "Position")}" is not recognised.`;
  if (!VALID_PAYMENTS.includes(paymentVal.toLowerCase())) return `Row ${index + 1}: Payment must be "paid" or "unpaid" — got "${paymentVal}".`;
  return null;
}

function parseCSV(text: string): { headers: string[]; rows: any[] } {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith("#"));
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim());
  // Handle duplicate Contact headers by making second unique
  const seen: Record<string, number> = {};
  const uniqueHeaders = headers.map(h => {
    const count = seen[h] || 0;
    seen[h] = count + 1;
    if (count > 0 && h.toLowerCase() === "contact") return `Contact_2`;
    return h;
  });
  const rows = lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    const obj: any = {};
    uniqueHeaders.forEach((h, i) => { obj[h] = values[i] || ""; });
    // Also keep original duplicate key for compatibility
    headers.forEach((h, i) => { if (obj[h] === undefined) obj[h] = values[i] || ""; });
    return obj;
  });
  return { headers: uniqueHeaders, rows };
}

export const GET = withError(async (req: NextRequest) => {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DCLM Workers Conference";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Workers Template", {
    properties: { tabColor: { argb: "FF1e3a8a" } },
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  // Column widths - 9 columns as requested
  sheet.columns = [
    { width: 22 }, // Zone
    { width: 20 }, // Region
    { width: 20 }, // Division
    { width: 26 }, // Full Name
    { width: 12 }, // Gender
    { width: 20 }, // Position
    { width: 18 }, // Contact
    { width: 14 }, // Payment
    { width: 18 }, // Contact (2nd)
  ];

  // Title row - merged across 9 columns
  const titleRow = sheet.addRow(["NATIONAL WORKERS CONFERENCE — Bulk Upload Template"]);
  titleRow.height = 28;
  sheet.mergeCells("A1:I1");
  titleRow.getCell(1).font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1e3a8a" } };
  titleRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  titleRow.getCell(1).border = { bottom: { style: "thin", color: { argb: "FF1e3a8a" } } };

  // Subtitle
  const subRow = sheet.addRow(["Fill in EVERY column for each worker. Verification is done during event day — system will indicate verified status."]);
  subRow.height = 18;
  sheet.mergeCells("A2:I2");
  subRow.getCell(1).font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF64748b" } };
  subRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1f5f9" } };
  subRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

  // Instructions row
  const instRow = sheet.addRow(["Instructions: Use exact Zone / Region / Division names • Gender: male/female • Position: see list • Payment: paid/unpaid • Contact: phone number"]);
  instRow.height = 16;
  sheet.mergeCells("A3:I3");
  instRow.getCell(1).font = { name: "Calibri", size: 8, color: { argb: "FF475569" } };
  instRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0f2fe" } };
  instRow.getCell(1).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  instRow.getCell(1).border = { bottom: { style: "thin", color: { argb: "FFcbd5e1" } } };

  // Header row - 9 columns beautifully styled
  const headers = ["Zone", "Region", "Division", "Full Name", "Gender", "Position", "Contact", "Payment", "Contact"];
  const headerRow = sheet.addRow(headers);
  headerRow.height = 22;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1e3a8a" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF1e3a8a" } },
      bottom: { style: "thin", color: { argb: "FF1e3a8a" } },
      left: { style: "thin", color: { argb: "FF334155" } },
      right: { style: "thin", color: { argb: "FF334155" } },
    };
  });
  // Distinguish second Contact with slightly different shade
  headerRow.getCell(9).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1e40af" } };
  headerRow.getCell(9).note = "Alternate / emergency contact (optional)";

  // Example data row - light and helpful
  const exampleRow = sheet.addRow(["Greater Accra Zone", "Accra Metro", "Abeka-Lapaz", "John Mensah", "male", "adult_leader", "0244123456", "paid", "0200123456"]);
  exampleRow.height = 18;
  exampleRow.eachCell(cell => {
    cell.font = { name: "Calibri", size: 9, color: { argb: "FF64748b" }, italic: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFf8fafc" } };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFe2e8f0" } },
      bottom: { style: "thin", color: { argb: "FFe2e8f0" } },
      left: { style: "thin", color: { argb: "FFe2e8f0" } },
      right: { style: "thin", color: { argb: "FFe2e8f0" } },
    };
  });
  exampleRow.getCell(7).numFmt = "@";
  exampleRow.getCell(9).numFmt = "@";

  // Add 50 empty styled rows for data entry
  for (let i = 0; i < 50; i++) {
    const row = sheet.addRow(["", "", "", "", "", "", "", "", ""]);
    row.height = 16;
    const isAlt = i % 2 === 1;
    row.eachCell(cell => {
      cell.font = { name: "Calibri", size: 10, color: { argb: "FF1e293b" } };
      cell.fill = isAlt ? { type: "pattern", pattern: "solid", fgColor: { argb: "FFf1f5f9" } } : { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "left", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFe2e8f0" } },
        bottom: { style: "thin", color: { argb: "FFe2e8f0" } },
        left: { style: "thin", color: { argb: "FFe2e8f0" } },
        right: { style: "thin", color: { argb: "FFe2e8f0" } },
      };
    });
    row.getCell(7).numFmt = "@";
    row.getCell(9).numFmt = "@";
  }

  // Data validations
  // Gender dropdown
  for (let r = 6; r <= 55; r++) {
    sheet.getCell(`E${r}`).dataValidation = {
      type: "list",
      formulae: ['"male,female"'],
      showErrorMessage: true,
      errorTitle: "Invalid Gender",
      error: 'Please select male or female',
    } as any;
    sheet.getCell(`H${r}`).dataValidation = {
      type: "list",
      formulae: ['"paid,unpaid"'],
      showErrorMessage: true,
      errorTitle: "Invalid Payment",
      error: 'Please select paid or unpaid',
    } as any;
  }

  // Auto filter on header row
  sheet.autoFilter = { from: "A4", to: "I4" };
  // Freeze panes at header row
  sheet.views = [{ state: "frozen", ySplit: 4 }];

  // Print settings
  (sheet.pageSetup as any).printTitlesRow = "1:4";
  sheet.properties.defaultRowHeight = 15;

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Workers_Bulk_Upload_Template.xlsx"',
      "Cache-Control": "no-cache",
    },
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
    // Normalize for duplicate Contact: prefer first Contact, fallback to Contact_2 for second
    if (row["Contact_2"] && !row["Contact"]) { /* keep first */ }
    // If both Contacts exist, second is contact2
    const err = validateRow(row, i);
    if (err) { errors.push({ row: i + 1, message: err }); continue; }

    const contactVal = pick(row, "Contact", "contact");
    // Second Contact (col I) - check by position if header was duplicate
    const contact2Val = (row["Contact_2"] || row["Contact2"] || row["_contact2"] || "").toString().trim();

    const worker = await db.createWorker({
      name: pick(row, "Full Name", "FullName", "fullname", "name"),
      gender: pick(row, "Gender", "gender").toLowerCase() as "male" | "female",
      zone: pick(row, "Zone", "zone"),
      region: pick(row, "Region", "region"),
      division: pick(row, "Division", "division"),
      position: pick(row, "Position", "position") as any,
      contact: contactVal,
      contact2: contact2Val || undefined,
      paymentStatus: pick(row, "Payment", "PaymentStatus", "payment").toLowerCase() as "paid" | "unpaid",
      verified: false, // verification only during event day
      registeredBy: payload.sub,
      registeredByName: "Bulk Import",
    } as any);
    created.push(worker);
  }

  await db.audit({ userId: payload.sub, action: "workers_bulk_import", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "admin", browser: "admin", os: "admin", detail: `Bulk imported ${created.length} workers, ${errors.length} errors` });

  return NextResponse.json({ created: created.length, errors, total: rows.length });
});
