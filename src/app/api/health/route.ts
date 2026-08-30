import { NextResponse } from "next/server";
import { pool } from "@/lib/db/pg";

export const GET = async () => {
  try {
    await pool.query("SELECT 1");
    return NextResponse.json({ status: "ok", db: "up" });
  } catch {
    return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 });
  }
};