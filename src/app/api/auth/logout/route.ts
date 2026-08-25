import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import { withError } from "@/lib/api-handler";

export const POST = withError(async (req: NextRequest) => {
  const token = req.cookies.get("access_token")?.value;
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const ua = req.headers.get("user-agent") || "Unknown";

  const res = NextResponse.json({ ok: true });
  res.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  res.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });

  if (token) {
    verifyToken(token).then(async (payload) => {
      if (payload) {
        try {
          await db.removeSession(payload.sid, payload.sub);
          await db.audit({ userId: payload.sub, action: "logout", ip, device: ua, browser: ua, os: "unknown" });
        } catch {}
      }
    }).catch(() => {});
  }

  return res;
});
