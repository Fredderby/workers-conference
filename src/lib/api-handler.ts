import { NextRequest, NextResponse } from "next/server";

type Handler = (req: NextRequest, ctx?: any) => Promise<NextResponse>;

export function withError(handler: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err: any) {
      console.error("[api]", req.nextUrl.pathname, err?.message || err);
      if (err?.code === "ECONNREFUSED" || err?.code === "EAI_AGAIN" || err?.code === "ENOTFOUND" || err?.code === "ECONNRESET") {
        return NextResponse.json({ error: "Database unavailable. Please try again later." }, { status: 503 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
