import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db, POSITION_LABELS, PAYMENT_LABELS } from "@/lib/db/mock";
import { isAdmin } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAllowed = isAdmin(user.role) || user.role === "national_officer";
  if (!isAllowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const zone = req.nextUrl.searchParams.get("zone") || "";
  let workers = db.workers;
  if (zone) workers = workers.filter(w => w.zone === zone);

  const header = "S/N,Full Name,Gender,Zone,Region,Division,Position,Payment Status,Verified,Registered At";
  const rows = workers.map((w, i) => [
    i + 1,
    `"${w.name}"`,
    w.gender,
    `"${w.zone}"`,
    `"${w.region}"`,
    `"${w.division}"`,
    `"${POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}"`,
    PAYMENT_LABELS[w.paymentStatus as keyof typeof PAYMENT_LABELS] || w.paymentStatus,
    w.verified ? "Yes" : "No",
    new Date(w.createdAt).toLocaleDateString(),
  ].join(","));

  const csv = [header, ...rows].join("\n");
  const filename = zone ? `workers-${zone.replace(/\s+/g, "-").toLowerCase()}.csv` : "workers-all.csv";

  db.audit({ userId: payload.sub, action: "user_created", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "admin", browser: "admin", os: "admin", detail: `Exported ${workers.length} workers${zone ? ` for ${zone}` : ""}` });

  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${filename}"` },
  });
}
