import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000,
      max: 1,
    });

    const client = await pool.connect();
    const result = await client.query("SELECT 1 as ok, NOW() as time");
    client.release();
    await pool.end();

    return NextResponse.json({ success: true, ...result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
    }, { status: 500 });
  }
}
