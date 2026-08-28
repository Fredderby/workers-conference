import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import { ZONE_STRUCTURE, POSITION_LABELS } from "@/lib/db/mock";
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

  const gender = pick(row, "Gender", "gender").trim().toLowerCase();
  if (!VALID_GENDERS.includes(gender)) return `Row ${index + 1}: Gender must be "male" or "female" — got "${pick(row, "Gender", "gender")}".`;
  const zone = pick(row, "Zone", "zone");
  const region = pick(row, "Region", "region");
  const division = pick(row, "Division", "division");
  if (!ZONE_STRUCTURE[zone]) return `Row ${index + 1}: Zone "${zone}" is not recognised. Check the template's list of zones.`;
  if (!ZONE_STRUCTURE[zone]?.[region]) return `Row ${index + 1}: Region "${region}" does not belong to zone "${zone}".`;
  if (!(ZONE_STRUCTURE[zone]?.[region] || []).includes(division)) return `Row ${index + 1}: Division "${division}" is not in region "${region}".`;
  // Position: accept snake_case or human labels (Adult Leader) - normalize spaces/hyphens → underscores
  const rawPos = pick(row, "Position", "position");
  const normPos = rawPos.trim().toLowerCase().replace(/[\s\-\/]+/g, "_").replace(/__+/g, "_");
  if (!VALID_POSITIONS.includes(normPos)) return `Row ${index + 1}: Position "${rawPos}" is not recognised. Select from dropdown: ${Object.values(POSITION_LABELS).join(", ")}.`;
  if (!VALID_PAYMENTS.includes(paymentVal.trim().toLowerCase())) return `Row ${index + 1}: Payment must be "paid" or "unpaid" — got "${paymentVal}".`;
  return null;
}

export const GET = withError(async (req: NextRequest) => {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DCLM Workers Conference";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Workers", {
    properties: { tabColor: { argb: "FF1e3a8a" } },
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  // Column widths - 9 columns as requested: headers only
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

  // ONLY column headings - beautifully styled header row
  const headers = ["Zone", "Region", "Division", "Full Name", "Gender", "Position", "Contact", "Payment", "Contact"];
  const headerRow = sheet.addRow(headers);
  headerRow.height = 26;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1e3a8a" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "medium", color: { argb: "FF1e3a8a" } },
      bottom: { style: "medium", color: { argb: "FF1e3a8a" } },
      left: { style: "thin", color: { argb: "FF334155" } },
      right: { style: "thin", color: { argb: "FF334155" } },
    };
  });
  // Second Contact slightly distinct but still part of requested headings
  headerRow.getCell(7).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1e3a8a" } };
  headerRow.getCell(9).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF312e81" } };
  headerRow.commit();

  // Style Contact columns as text to preserve leading zeros
  sheet.getColumn(7).numFmt = "@";
  sheet.getColumn(9).numFmt = "@";

  // Data validations for dropdowns (rows 2-1000) - Gender, Position, Payment
  // Show human labels in Excel dropdown (e.g. Adult Leader) - validation normalizes both forms
  const positionLabels = Object.values(POSITION_LABELS).join(",");
  for (let r = 2; r <= 1000; r++) {
    sheet.getCell(`E${r}`).dataValidation = {
      type: "list",
      formulae: ['"male,female"'],
      showErrorMessage: true,
      errorTitle: "Invalid Gender",
      error: "Please select male or female",
    } as any;
    sheet.getCell(`F${r}`).dataValidation = {
      type: "list",
      formulae: [`"${positionLabels}"`],
      showErrorMessage: true,
      errorTitle: "Invalid Position",
      error: `Please select one of: ${positionLabels}`,
    } as any;
    sheet.getCell(`H${r}`).dataValidation = {
      type: "list",
      formulae: ['"paid,unpaid"'],
      showErrorMessage: true,
      errorTitle: "Invalid Payment",
      error: "Please select paid or unpaid",
    } as any;
  }

  // Auto filter + freeze header row
  sheet.autoFilter = { from: "A1", to: "I1" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

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

function makeDuplicateKey(row: any): string {
  const name = pick(row, "Full Name", "FullName", "fullname", "name").toLowerCase().trim();
  const zone = pick(row, "Zone", "zone").toLowerCase().trim();
  const division = pick(row, "Division", "division").toLowerCase().trim();
  return `${name}|${zone}|${division}`;
}

export const POST = withError(async (req: NextRequest) => {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const rows = body.rows;
  const mode: "append" | "replace" = body.mode === "replace" ? "replace" : "append";
  const onDuplicate: "skip" | "replace" = body.onDuplicate === "replace" ? "replace" : "skip";
  const isConfirmed = body.confirmed === true;

  if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: "Your file is empty or has a header row only. Add at least one worker row before uploading." }, { status: 400 });
  if (rows.length > 500) return NextResponse.json({ error: "Your file has too many rows. Split it into batches of 500 workers or fewer." }, { status: 400 });

  // Step 1: Validate all rows first (do not delete anything before validation)
  const validationErrors: { row: number; message: string }[] = [];
  const validRows: { index: number; row: any }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const err = validateRow(rows[i], i);
    if (err) validationErrors.push({ row: i + 1, message: err });
    else validRows.push({ index: i, row: rows[i] });
  }
  if (validationErrors.length > 0 && validRows.length === 0) {
    return NextResponse.json({ created: 0, errors: validationErrors, total: rows.length, duplicates: [] });
  }

  // Step 2: Handle replace mode - delete all existing after validation
  let toCreate: typeof validRows = validRows;
  if (mode === "replace") {
    if (!isConfirmed) {
      const existing = await db.listWorkers();
      return NextResponse.json({
        needsConfirmation: true,
        confirmationType: "replaceAll",
        existingCount: existing.length,
        message: `You have ${existing.length} existing workers. Replace will delete all and import ${validRows.length} new workers.`,
        validationErrors,
      });
    }
    await db.deleteAllWorkers();
    // Dedupe file-internal duplicates for replace as well (last-write-wins, handles both key and contact)
    const dedupMapR = new Map<string, typeof validRows[0]>();
    const contactToKeyR = new Map<string, string>();
    for (const vr of validRows) {
      const k = makeDuplicateKey(vr.row);
      const c = pick(vr.row, "Contact", "contact").trim();
      const ck = c ? `contact:${c}` : null;
      if (ck && contactToKeyR.has(ck)) {
        const prevKey = contactToKeyR.get(ck)!;
        if (prevKey !== k) dedupMapR.delete(prevKey);
      }
      if (dedupMapR.has(k)) {
        const prev = dedupMapR.get(k)!;
        const prevC = pick(prev.row, "Contact", "contact").trim();
        if (prevC) contactToKeyR.delete(`contact:${prevC}`);
      }
      dedupMapR.set(k, vr);
      if (ck) contactToKeyR.set(ck, k);
    }
    toCreate = [...dedupMapR.values()];
  }

  // Step 3: Duplicate detection for append mode
  let duplicates: { row: number; key: string; existing: any; newRow: any }[] = [];

  if (mode === "append") {
    const existingWorkers = await db.listWorkers();
    const existingMap = new Map<string, any>();
    for (const w of existingWorkers) {
      const k = `${w.name.toLowerCase().trim()}|${w.zone.toLowerCase().trim()}|${w.division.toLowerCase().trim()}`;
      existingMap.set(k, w);
      // Also index by contact if present
      if ((w as any).contact) existingMap.set(`contact:${(w as any).contact.trim()}`, w);
    }

    // Check for duplicates within file and against DB
    const fileSeen = new Set<string>();
    const dupIndices = new Set<number>();
    const uniqueRows: typeof validRows = [];

    for (const vr of validRows) {
      const key = makeDuplicateKey(vr.row);
      const contact = pick(vr.row, "Contact", "contact").trim();
      const contactKey = contact ? `contact:${contact}` : null;

      const isFileDuplicate = fileSeen.has(key) || (contactKey !== null && fileSeen.has(contactKey));
      const isDbDuplicate = existingMap.has(key) || (contactKey !== null && existingMap.has(contactKey));

      if (isFileDuplicate || isDbDuplicate) {
        const existing = existingMap.get(key) || (contactKey !== null ? existingMap.get(contactKey) : null);
        duplicates.push({ row: vr.index + 1, key, existing: existing || null, newRow: vr.row });
        dupIndices.add(vr.index);
      } else {
        fileSeen.add(key);
        if (contactKey !== null) fileSeen.add(contactKey);
        uniqueRows.push(vr);
      }
    }

    if (duplicates.length > 0 && !isConfirmed) {
      return NextResponse.json({
        needsConfirmation: true,
        confirmationType: "duplicates",
        duplicates: duplicates.map(d => ({
          row: d.row,
          name: pick(d.newRow, "Full Name", "FullName", "name"),
          zone: pick(d.newRow, "Zone"),
          division: pick(d.newRow, "Division"),
          existingName: d.existing?.name,
        })),
        duplicateCount: duplicates.length,
        validCount: uniqueRows.length,
        validationErrors,
        message: `Found ${duplicates.length} duplicate worker(s) already in the system. Choose to skip them or replace the existing records.`,
      });
    }

    // Apply onDuplicate strategy - dedupe file-internal duplicates last-write-wins
    if (onDuplicate === "skip") {
      toCreate = uniqueRows;
    } else if (onDuplicate === "replace") {
      // Delete existing duplicates first (dedupe ids)
      const seenIds = new Set<string>();
      for (const d of duplicates) {
        if (d.existing?.id && !seenIds.has(d.existing.id)) {
          seenIds.add(d.existing.id);
          try { await db.deleteWorker(d.existing.id); } catch {}
        }
      }
      // Rebuild toCreate deduped last-write-wins (handles both name|zone|division and contact collisions)
      const dedupMap = new Map<string, typeof validRows[0]>();
      const contactToKey = new Map<string, string>();
      for (const vr of validRows) {
        const k = makeDuplicateKey(vr.row);
        const c = pick(vr.row, "Contact", "contact").trim();
        const ck = c ? `contact:${c}` : null;
        // If contact already maps to a different main key, remove old entry (last-write-wins for contact)
        if (ck && contactToKey.has(ck)) {
          const prevKey = contactToKey.get(ck)!;
          if (prevKey !== k) dedupMap.delete(prevKey);
        }
        // If main key exists, clean its old contact mapping
        if (dedupMap.has(k)) {
          const prev = dedupMap.get(k)!;
          const prevC = pick(prev.row, "Contact", "contact").trim();
          if (prevC) contactToKey.delete(`contact:${prevC}`);
        }
        dedupMap.set(k, vr);
        if (ck) contactToKey.set(ck, k);
      }
      toCreate = [...dedupMap.values()];
    }
  }

  // Step 4: Create workers
  const errors: { row: number; message: string }[] = [...validationErrors];
  const created: any[] = [];
  let skipped = 0;
  if (mode === "append" && onDuplicate === "skip" && duplicates.length > 0) {
    skipped = duplicates.length;
  }

  for (const vr of toCreate) {
    try {
      const contactVal = pick(vr.row, "Contact", "contact");
      const contact2Val = (vr.row["Contact_2"] || vr.row["Contact2"] || vr.row["_contact2"] || "").toString().trim();
      // Normalize position: "Adult Leader" -> "adult_leader", case-insensitive, spaces/hyphens → underscores
      const rawPos2 = pick(vr.row, "Position", "position");
      const normPos2 = rawPos2.trim().toLowerCase().replace(/[\s\-\/]+/g, "_").replace(/__+/g, "_");
      const finalPos = VALID_POSITIONS.includes(normPos2) ? normPos2 : rawPos2.trim().toLowerCase();
      const worker = await db.createWorker({
        name: pick(vr.row, "Full Name", "FullName", "fullname", "name"),
        gender: pick(vr.row, "Gender", "gender").trim().toLowerCase() as "male" | "female",
        zone: pick(vr.row, "Zone", "zone"),
        region: pick(vr.row, "Region", "region"),
        division: pick(vr.row, "Division", "division"),
        position: finalPos as any,
        contact: contactVal ? contactVal : undefined,
        contact2: contact2Val ? contact2Val : undefined,
        paymentStatus: pick(vr.row, "Payment", "PaymentStatus", "payment").trim().toLowerCase() as "paid" | "unpaid",
        verified: false,
        registeredBy: payload.sub,
        registeredByName: "Bulk Import",
      } as any);
      created.push(worker);
    } catch (e: any) {
      errors.push({ row: vr.index + 1, message: e?.message || "Failed to create worker" });
    }
  }

  const detail = mode === "replace"
    ? `Bulk replace: deleted all and imported ${created.length} workers, ${errors.length} errors`
    : `Bulk ${onDuplicate === "replace" ? "replace duplicates" : "append"}: imported ${created.length} workers, skipped ${skipped}, ${errors.length} errors`;
  await db.audit({ userId: payload.sub, action: "workers_bulk_import", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "admin", browser: "admin", os: "admin", detail });

  return NextResponse.json({
    created: created.length,
    skipped,
    errors,
    total: rows.length,
    duplicates: duplicates.length,
    mode,
    onDuplicate,
  });
});
