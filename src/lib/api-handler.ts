import { NextRequest, NextResponse } from "next/server";

type Handler = (req: NextRequest, ctx?: any) => Promise<NextResponse>;

export function withError(handler: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err: any) {
      console.error(`[api] ${req.nextUrl.pathname} code=${err?.code || "n/a"} message=${err?.message || err}`);
      console.error(`[api] ${req.nextUrl.pathname} stack=${err?.stack || "no stack"}`);
      const dbCodes = new Set(["ECONNREFUSED", "EAI_AGAIN", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT", "EPIPE", "28P01", "3D000", "42501", "42P01", "42703", "23505", "23502", "23503", "42601"]);
      const msg = err?.message || "";
      const isConnError = dbCodes.has(err?.code)
        || /timeout exceeded when trying to connect|ENOTFOUND|ECONNREFUSED|connection refused|server closed the connection unexpectedly|remaining connection slots are reserved|too many clients|password authentication failed for user|could not translate host name/i.test(msg);
      if (isConnError) {
        const u = (() => { try { const raw = process.env.DATABASE_URL?.trim() || ""; const cut = raw.includes("%23") ? raw : raw.split("#")[0]; return new URL(cut); } catch { return undefined; } })();
        console.error(`[db] unreachable — target=${u ? `${u.host}${u.pathname || "/"}` : "n/a"} (check Dokploy DB service name & shared network / VPN)`);
        return NextResponse.json({ error: "Database unavailable. Please try again shortly." }, { status: 503, headers: { "Retry-After": "5" } });
      }
      if (err?.message?.includes("FATAL: DATABASE_URL") || /database ".*" does not exist|database .* does not exist/i.test(msg)) {
        console.error("[api] misconfigured DATABASE_URL — check Dokploy environment variables");
        return NextResponse.json({ error: "Database configuration error. Contact administrator." }, { status: 500 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
