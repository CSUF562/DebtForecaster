import { NextResponse } from "next/server";
import { getPostgresDailyPublicationRepository } from "../../../src/storage/postgresDailyPublicationRepository";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { generatedAt: new Date().toISOString(), records: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const records =
      await getPostgresDailyPublicationRepository().listRecent(100);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        count: records.length,
        records
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Publication archive unavailable:", error);

    return NextResponse.json(
      {
        error: "ENCLAVE_PUBLICATION_ARCHIVE_UNAVAILABLE",
        message: "The publication archive could not be generated."
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
