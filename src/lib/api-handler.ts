import { NextRequest, NextResponse } from "next/server";

type Handler = (req: NextRequest, ctx?: any) => Promise<NextResponse>;

export function withError(handler: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err: any) {
      console.error("[api]", req.nextUrl.pathname, `code=${err?.code || "n/a"}`, err?.message || err);
      const dbCodes = new Set(["ECONNREFUSED", "EAI_AGAIN", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT", "28P01", "3D000", "42501", "ECONNREFUSED"]);
      if (dbCodes.has(err?.code)) {
        return NextResponse.json({ error: "Database unavailable. Please try again shortly." }, { status: 503, headers: { "Retry-After": "5" } });
      }
      if (err?.message?.includes("FATAL: DATABASE_URL")) {
        console.error("[api] misconfigured DATABASE_URL — check Dokploy environment variables");
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
