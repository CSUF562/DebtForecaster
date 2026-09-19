import { NextResponse } from "next/server";
import { getPostgresContextEvidenceRepository } from "../../../src/storage/postgresContextRepository";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        databaseConfigured: false,
        records: []
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const records =
      await getPostgresContextEvidenceRepository().listLedger(200);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        databaseConfigured: true,
        count: records.length,
        records
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Evidence ledger unavailable:", error);

    return NextResponse.json(
      {
        error: "ENCLAVE_EVIDENCE_LEDGER_UNAVAILABLE",
        message: "The evidence ledger could not be generated."
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
