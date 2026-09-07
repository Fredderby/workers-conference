import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import { ZONE_STRUCTURE, POSITION_LABELS } from "@/lib/db/mock";
import { isAdmin } from "@/lib/auth/rbac";
import { withError } from "@/lib/api-handler";
import { toProperCase } from "@/lib/utils";
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

function normalize(s: string) { return s.trim().toLowerCase(); }
function findZoneKey(input: string): string | undefined {
  const n = normalize(input);
  return Object.keys(ZONE_STRUCTURE).find(k => k.toLowerCase() === n) || Object.keys(ZONE_STRUCTURE).find(k => normalize(k).replace(/\s+/g, "") === n.replace(/\s+/g, ""));
}
function findRegionKey(zoneKey: string, input: string): string | undefined {
  const n = normalize(input);
  const regions = Object.keys(ZONE_STRUCTURE[zoneKey] || {});
  return regions.find(k => k.toLowerCase() === n);
}
function findDivisionKey(zoneKey: string, regionKey: string, input: string): string | undefined {
  const n = normalize(input);
  return (ZONE_STRUCTURE[zoneKey]?.[regionKey] || []).find(d => d.toLowerCase() === n);
}

function validateRow(row: any, index: number): string | null {
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
    return `Row ${index + 1}: Please fill in ${list}. ${missing.length === 1 ? "This column is empty" : "These columns are empty"} — all 8 columns are required.`;
  }

  const gender = pick(row, "Gender", "gender").trim().toLowerCase();
  if (!VALID_GENDERS.includes(gender)) return `Row ${index + 1}: Gender should be "male" or "female". You wrote "${pick(row, "Gender", "gender")}". Please fix it to male or female.`;
  const rawZone = pick(row, "Zone", "zone");
  const rawRegion = pick(row, "Region", "region");
  const rawDivision = pick(row, "Division", "division");
  const zoneKey = findZoneKey(rawZone);
  if (!zoneKey) {
    const allZones = Object.keys(ZONE_STRUCTURE).join(", ");
    return `Row ${index + 1}: Zone "${rawZone}" is not on our list. Please copy the Zone name exactly from the template. Valid zones: ${allZones}. Spelling does not need to match upper/lower case.`;
  }
  const regionKey = findRegionKey(zoneKey, rawRegion);
  if (!regionKey) {
    const validRegions = Object.keys(ZONE_STRUCTURE[zoneKey] || {}).join(", ");
    return `Row ${index + 1}: Region "${rawRegion}" doesn't belong to Zone "${zoneKey}". For "${zoneKey}", please choose one of: ${validRegions}.`;
  }
  const divisionKey = findDivisionKey(zoneKey, regionKey, rawDivision);
  if (!divisionKey) {
    const validDivs = (ZONE_STRUCTURE[zoneKey]?.[regionKey] || []).join(", ");
    return `Row ${index + 1}: Division "${rawDivision}" is not in Region "${regionKey}". For "${regionKey}", please choose one of: ${validDivs}.`;
  }
  const contact2Raw = (row["Contact_2"] || (row as any)["Contact2"] || "").toString().trim();
  if (contactVal && !/^\d{10}$/.test(contactVal.trim())) return `Row ${index + 1}: Contact should be exactly 10 digits (e.g. 0244123456). You wrote "${contactVal}". Please fix it to 10 digits.`;
  if (contact2Raw && !/^\d{10}$/.test(contact2Raw)) return `Row ${index + 1}: Second Contact should be exactly 10 digits if provided. You wrote "${contact2Raw}".`;
  const rawPos = pick(row, "Position", "position");
  const normPos = rawPos.trim().toLowerCase().replace(/[\s\-\/]+/g, "_").replace(/__+/g, "_");
  if (!VALID_POSITIONS.includes(normPos)) return `Row ${index + 1}: Position "${rawPos}" is not on our list. Please pick one of: ${Object.values(POSITION_LABELS).join(", ")}. You can type "Adult Leader" or "adult_leader" — both work.`;
  if (!VALID_PAYMENTS.includes(paymentVal.trim().toLowerCase())) return `Row ${index + 1}: Payment should be "paid" or "unpaid". You wrote "${paymentVal}". Please fix it to paid or unpaid.`;
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
  // 25y: duplicate = exact Full Name (case-sensitive) + Gender + Contact + Zone + Division
  // Pastor John Dagla (male, 0244...) vs Mrs Janet Dagla (female, 0245...) => different keys, never skipped
  const name = pick(row, "Full Name", "FullName", "fullname", "name").trim();
  const gender = pick(row, "Gender", "gender").toLowerCase().trim();
  const contact = pick(row, "Contact", "contact").trim();
  const zone = pick(row, "Zone", "zone").toLowerCase().trim();
  const division = pick(row, "Division", "division").toLowerCase().trim();
  return `${name}|${gender}|${contact}|${zone}|${division}`;
}

function normRegion(s: any): string {
  return String(s || "").trim().toLowerCase().replace(/[\s\-_]+/g, "");
}

function isWithinAccessLevel(user: any, row: any): boolean {
  if (!user) return false;
  if (isAdmin(user.role)) return true;
  if (user.role === "regional_officer") {
    if (!user.region) return true;
    const rowRegion = pick(row, "Region", "region");
    if (normRegion(rowRegion) !== normRegion(user.region)) return false;
    return true;
  }
  return true;
}

function isWithinWorkerAccessLevel(user: any, worker: any): boolean {
  if (isAdmin(user.role)) return true;
  if (user.role === "regional_officer") {
    if (!user.region) return true;
    if (worker.region && normRegion(worker.region) === normRegion(user.region)) return true;
    return false;
  }
  return false;
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

  const user = await db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: "Your file is empty or has a header row only. Add at least one worker row before uploading." }, { status: 400 });
  if (rows.length > 500) return NextResponse.json({ error: "Your file has too many rows. Split it into batches of 500 workers or fewer." }, { status: 400 });

  // Regional officers can only upload within their assigned region — plain language, per-row detail
  if (user.role === "regional_officer") {
    const outOfScope = rows
      .map((r, idx) => ({ r, idx }))
      .filter(({ r }) => !isWithinAccessLevel(user, r));
    if (outOfScope.length > 0) {
      const sample = outOfScope.slice(0, 3).map(({ r }) => `"${pick(r, "Full Name", "FullName") || "Row"}" for Region "${pick(r, "Region") || "?"}" (Zone "${pick(r, "Zone") || "?"}" )`).join(", ");
      const rowErrors = outOfScope.map(({ r, idx }) => {
        const name = pick(r, "Full Name", "FullName") || "Unnamed worker";
        const region = pick(r, "Region") || "(empty)";
        const zone = pick(r, "Zone") || "(empty)";
        return {
          row: idx + 1,
          message: `Row ${idx + 1} ("${name}"): Region is "${region}" (Zone "${zone}") — but you can only add workers for your region: "${user.region}". Please change Region to "${user.region}" and pick a Zone/Division that belongs to "${user.region}", or ask a National Officer to upload this row.`,
        };
      });
      return NextResponse.json(
        {
          error: `You can only add workers for your region: "${user.region}". Your file has ${outOfScope.length} worker${outOfScope.length === 1 ? "" : "s"} for a different region — e.g. ${sample}${outOfScope.length > 3 ? ` and ${outOfScope.length - 3} more` : ""}. Please change those rows to "${user.region}", or ask a National Officer to upload them.`,
          errors: rowErrors,
          rowErrors,
          total: rows.length,
          created: 0,
          skipped: 0,
        },
        { status: 403 }
      );
    }
  }

  // Step 1: Validate all rows first (do not delete anything before validation)
  const validationErrors: { row: number; message: string }[] = [];
  const validRows: { index: number; row: any }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const err = validateRow(rows[i], i);
    if (err) validationErrors.push({ row: i + 1, message: err });
    else validRows.push({ index: i, row: rows[i] });
  }
  if (validationErrors.length > 0 && validRows.length === 0) {
    return NextResponse.json({
      created: 0,
      errors: validationErrors,
      skipped: 0,
      skippedDetails: [],
      total: rows.length,
      duplicates: 0,
      error: `Your file was rejected — none of the ${rows.length} row${rows.length === 1 ? "" : "s"} could be imported. Please fix every row listed below and upload again.`,
    });
  }

  // Contact uniqueness — one number cannot be reused (contact + contact2 pool, global)
  {
    const norm = (s: any) => String(s || "").trim();
    let existingContacts = new Set<string>();
    const skipDbCheck = mode === "replace" && isAdmin(user.role);
    if (!skipDbCheck) {
      const allExistingForContact = await db.listWorkers();
      allExistingForContact.forEach((w: any) => {
        const c1 = norm(w.contact); if (c1) existingContacts.add(c1);
        const c2 = norm((w as any).contact2); if (c2) existingContacts.add(c2);
      });
      if (mode === "replace" && !isAdmin(user.role)) {
        const scoped = allExistingForContact.filter((w: any) => isWithinWorkerAccessLevel(user, w));
        scoped.forEach((w: any) => { existingContacts.delete(norm(w.contact)); existingContacts.delete(norm((w as any).contact2)); });
      }
    }
    const fileContactMap = new Map<string, number>();
    const remainingValid: typeof validRows = [];
    for (const vr of validRows) {
      const c1 = norm(pick(vr.row, "Contact", "contact"));
      const c2 = norm((vr.row as any)["Contact_2"] || (vr.row as any)["Contact2"] || "");
      if (c1 && c2 && c1 === c2) {
        validationErrors.push({ row: vr.index + 1, message: `Row ${vr.index + 1}: Contact and Second contact cannot be the same number (${c1}).` });
        continue;
      }
      let dupReason: string | null = null;
      for (const c of [c1, c2].filter(Boolean) as string[]) {
        if (existingContacts.has(c)) {
          dupReason = `Contact ${c} is already used by an existing worker. One number cannot be used for two workers.`;
          break;
        }
        if (fileContactMap.has(c)) {
          dupReason = `Contact ${c} is duplicated inside your file (also in Row ${fileContactMap.get(c)! + 1}). One number cannot be used for two workers.`;
          break;
        }
      }
      if (dupReason) {
        validationErrors.push({ row: vr.index + 1, message: `Row ${vr.index + 1}: ${dupReason}` });
      } else {
        remainingValid.push(vr);
        if (c1) fileContactMap.set(c1, vr.index);
        if (c2) fileContactMap.set(c2, vr.index);
      }
    }
    validRows.length = 0; validRows.push(...remainingValid);
    if (validationErrors.length > 0 && validRows.length === 0) {
      return NextResponse.json({
        created: 0,
        errors: validationErrors,
        skipped: 0,
        skippedDetails: [],
        total: rows.length,
        duplicates: 0,
        error: `Your file was rejected — none of the ${rows.length} row${rows.length === 1 ? "" : "s"} could be imported. Please fix every row listed below and upload again.`,
      });
    }
  }

  // Step 2: Handle replace mode - delete existing after validation (scoped by role)
  let toCreate: typeof validRows = validRows;
  if (mode === "replace") {
    const allExisting = await db.listWorkers();
    const scopedExisting = isAdmin(user.role) ? allExisting : allExisting.filter(w => isWithinWorkerAccessLevel(user, w));
    if (!isConfirmed) {
      const scopeLabel = isAdmin(user.role) ? "all" : `your ${user.region ? `region "${user.region}"` : `zone "${user.zone}"`}`;
      return NextResponse.json({
        needsConfirmation: true,
        confirmationType: "replaceAll",
        existingCount: scopedExisting.length,
        totalExisting: allExisting.length,
        message: isAdmin(user.role)
          ? `You have ${scopedExisting.length} existing workers. Replace will delete all and import ${validRows.length} new workers.`
          : `You have ${scopedExisting.length} workers in ${scopeLabel}. Replace will delete only those and import ${validRows.length} new workers within your access level.`,
        validationErrors,
      });
    }
    if (isAdmin(user.role)) {
      await db.deleteAllWorkers();
    } else {
      // Regional officers: delete only workers within their access level
      for (const w of scopedExisting) {
        try { await db.deleteWorker(w.id); } catch {}
      }
    }
    // Dedupe file-internal duplicates for replace — exact Full Name + Zone + Division only (Pastor John Dagla vs Mrs Janet Dagla are NOT duplicates)
    const dedupMapR = new Map<string, typeof validRows[0]>();
    const replaceInternalDups: { row: number; message: string }[] = [];
    for (const vr of validRows) {
      const k = makeDuplicateKey(vr.row);
      if (dedupMapR.has(k)) {
        const dropped = dedupMapR.get(k)!;
        const name = pick(dropped.row, "Full Name", "FullName", "name") || "Unnamed";
        replaceInternalDups.push({
          row: dropped.index + 1,
          message: `Row ${dropped.index + 1} ("${name}"): Duplicate in your file — another row (Row ${vr.index + 1}) has same Full Name + Gender + Contact + Zone + Division. Only the last occurrence (Row ${vr.index + 1}) was kept.`,
        });
      }
      dedupMapR.set(k, vr);
    }
    toCreate = [...dedupMapR.values()];
    (globalThis as any).__replaceInternalDups = replaceInternalDups;
  }

  // Step 3: Duplicate detection for append mode
  let duplicates: { row: number; key: string; existing: any; newRow: any }[] = [];

  if (mode === "append") {
    const allExisting = await db.listWorkers();
    // Regional officers only see duplicates within their access level
    const scopedExisting = isAdmin(user.role) ? allExisting : allExisting.filter(w => isWithinWorkerAccessLevel(user, w));
    const existingMap = new Map<string, any>();
    for (const w of scopedExisting) {
      const k = `${w.name.trim()}|${(w.gender || "").toLowerCase().trim()}|${(w.contact || "").trim()}|${w.zone.toLowerCase().trim()}|${w.division.toLowerCase().trim()}`;
      existingMap.set(k, w);
    }

    // Check for duplicates within file and against DB — exact Full Name + Zone + Division only
    const fileSeen = new Set<string>();
    const dupIndices = new Set<number>();
    const uniqueRows: typeof validRows = [];

    for (const vr of validRows) {
      const key = makeDuplicateKey(vr.row);
      const isFileDuplicate = fileSeen.has(key);
      const isDbDuplicate = existingMap.has(key);

      if (isFileDuplicate || isDbDuplicate) {
        const existing = existingMap.get(key) || null;
        duplicates.push({ row: vr.index + 1, key, existing: existing || null, newRow: vr.row });
        dupIndices.add(vr.index);
      } else {
        fileSeen.add(key);
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
          gender: pick(d.newRow, "Gender", "gender"),
          contact: pick(d.newRow, "Contact", "contact"),
          zone: pick(d.newRow, "Zone"),
          division: pick(d.newRow, "Division"),
          existingName: d.existing?.name,
        })),
        duplicateCount: duplicates.length,
        validCount: uniqueRows.length,
        validationErrors,
        message: `Found ${duplicates.length} duplicate(s) — same Full Name + Gender + Contact + Zone + Division. Pastor John Dagla vs Mrs Janet Dagla (different gender/contact) are NOT duplicates. Choose to skip or replace.`,
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
      // Rebuild toCreate deduped last-write-wins — exact name only
      const dedupMap = new Map<string, typeof validRows[0]>();
      for (const vr of validRows) {
        const k = makeDuplicateKey(vr.row);
        dedupMap.set(k, vr);
      }
      toCreate = [...dedupMap.values()];
    }
  }

  // Step 4: Create workers
  const errors: { row: number; message: string }[] = [...validationErrors];
  const created: any[] = [];
  let skipped = 0;
  let skippedDetails: { row: number; message: string }[] = [];
  if (mode === "append" && onDuplicate === "skip" && duplicates.length > 0) {
    skipped = duplicates.length;
    skippedDetails = duplicates.map(d => {
      const name = pick(d.newRow, "Full Name", "FullName", "name") || d.existing?.name || "Unnamed";
      const zone = pick(d.newRow, "Zone", "zone") || d.existing?.zone || "?";
      const region = pick(d.newRow, "Region", "region") || d.existing?.region || "?";
      const division = pick(d.newRow, "Division", "division") || d.existing?.division || "?";
      const contact = pick(d.newRow, "Contact", "contact") || "";
      const existingInfo = d.existing
        ? `already exists as "${d.existing.name}" (${d.existing.gender}, Contact: ${d.existing.contact || "—"}) in ${d.existing.zone} › ${d.existing.region} › ${d.existing.division}`
        : "another row in your file has the same Full Name + Gender + Contact + Zone + Division";
      return {
        row: d.row,
        message: `Row ${d.row} ("${name}" — ${zone} › ${region} › ${division}${contact ? `, Contact: ${contact}` : ""}): Skipped — ${existingInfo}. We left the existing record unchanged. To update it with this file's data, upload again and choose "Delete & Replace".`,
      };
    });
  } else if (mode === "replace") {
    const internal = (globalThis as any).__replaceInternalDups as { row: number; message: string }[] | undefined;
    if (internal && internal.length > 0) {
      skipped = internal.length;
      skippedDetails = internal;
    }
    // cleanup
    try { delete (globalThis as any).__replaceInternalDups; } catch {}
  }

  for (const vr of toCreate) {
    try {
      const contactVal = pick(vr.row, "Contact", "contact");
      const contact2Val = (vr.row["Contact_2"] || vr.row["Contact2"] || vr.row["_contact2"] || "").toString().trim();
      const rawPos2 = pick(vr.row, "Position", "position");
      const normPos2 = rawPos2.trim().toLowerCase().replace(/[\s\-\/]+/g, "_").replace(/__+/g, "_");
      const finalPos = VALID_POSITIONS.includes(normPos2) ? normPos2 : rawPos2.trim().toLowerCase();
      const rawZone2 = pick(vr.row, "Zone", "zone");
      const rawRegion2 = pick(vr.row, "Region", "region");
      const rawDivision2 = pick(vr.row, "Division", "division");
      const canonicalZone = findZoneKey(rawZone2) || rawZone2.trim();
      const canonicalRegion = (canonicalZone && findRegionKey(canonicalZone, rawRegion2)) || rawRegion2.trim();
      const canonicalDivision = (canonicalZone && canonicalRegion && findDivisionKey(canonicalZone, canonicalRegion, rawDivision2)) || rawDivision2.trim();
      const worker = await db.createWorker({
        name: toProperCase(pick(vr.row, "Full Name", "FullName", "fullname", "name").trim()),
        gender: pick(vr.row, "Gender", "gender").trim().toLowerCase() as "male" | "female",
        zone: canonicalZone,
        region: canonicalRegion,
        division: canonicalDivision,
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
    skippedDetails,
    errors,
    total: rows.length,
    duplicates: duplicates.length,
    mode,
    onDuplicate,
    // also expose rowErrors for file-level rejections so frontend always has per-row detail
    rowErrors: errors,
  });
});
