import { NextResponse } from "next/server";
import { getDatabasePool } from "../../../src/storage/postgresDebtRepository.js";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  const databaseConfigured = Boolean(process.env.DATABASE_URL);

  if (!databaseConfigured) {
    return NextResponse.json(
      {
        status: "degraded",
        checkedAt,
        application: "ok",
        database: {
          configured: false,
          reachable: false
        },
        note:
          "Application can fall back to live Treasury reads, but persistent storage is not configured."
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }

  try {
    const pool = getDatabasePool();
    await pool.query("SELECT 1");

    return NextResponse.json(
      {
        status: "ok",
        checkedAt,
        application: "ok",
        database: {
          configured: true,
          reachable: true
        }
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        checkedAt,
        application: "ok",
        database: {
          configured: true,
          reachable: false
        },
        message:
          error instanceof Error ? error.message : "Unknown database failure"
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
}
