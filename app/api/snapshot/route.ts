import { NextResponse } from "next/server";
import { getDebtSnapshot } from "../../../src/application/debtSnapshot.js";
import { buildDailyAccountingBrief } from "../../../src/application/dailyBrief.js";
import { buildSeptember2026ContextBundle } from "../../../src/context/currentCaseStudy.js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getDebtSnapshot();
    const context = buildSeptember2026ContextBundle();
    const brief = buildDailyAccountingBrief(snapshot.history, context.items);

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
