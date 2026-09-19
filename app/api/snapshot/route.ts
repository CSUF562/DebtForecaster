import { NextResponse } from "next/server";
import { getDebtSnapshot } from "../../../src/application/debtSnapshot";
import { buildDailyAccountingBrief } from "../../../src/application/dailyBrief";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getDebtSnapshot();
    // Production context remains empty until verified live source adapters are wired.
    // This preserves the boundary between live Treasury accounting and non-live case-study fixtures.
    const brief = buildDailyAccountingBrief(snapshot.history, []);

    return NextResponse.json(
      {
        generatedAt: snapshot.generatedAt,
        dataSource: snapshot.dataSource,
        latest: snapshot.latest,
        freshness: snapshot.freshness,
        trends: snapshot.trends,
        publication: snapshot.publication,
        brief: {
          publicationStatus: brief.publicationStatus,
          explanation: brief.explanation,
          unresolved: brief.unresolved,
          context: brief.context,
          materiality: brief.materiality,
          governance: brief.governance
        }
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "ENCLAVE_SNAPSHOT_UNAVAILABLE",
        message:
          error instanceof Error ? error.message : "Unknown snapshot failure"
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
