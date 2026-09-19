import { NextResponse } from "next/server";
import { getDebtSnapshot } from "../../../src/application/debtSnapshot";
import { buildDailyAccountingBrief } from "../../../src/application/dailyBrief";
import { fetchTreasuryYieldCurveContext } from "../../../src/context/treasuryYieldCurve";
import type { ContextEvidence } from "../../../src/context/contextEvidence";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getDebtSnapshot();
    const context: ContextEvidence[] = [];
    let contextStatus:
      | { status: "available"; sources: string[] }
      | { status: "unavailable"; sources: string[]; reason: string }
      | { status: "not-applicable"; sources: string[] };

    if (!snapshot.latest) {
      contextStatus = {
        status: "not-applicable",
        sources: []
      };
    } else {
      try {
        const treasuryContext = await fetchTreasuryYieldCurveContext({
          asOfDate: snapshot.latest.recordDate
        });

        if (treasuryContext) {
          context.push(treasuryContext);
          contextStatus = {
            status: "available",
            sources: ["Treasury daily par yield curve"]
          };
        } else {
          contextStatus = {
            status: "unavailable",
            sources: ["Treasury daily par yield curve"],
            reason:
              "Treasury returned no yield-curve observation on or before the latest validated debt record date within the requested month."
          };
        }
      } catch (error) {
        console.warn("Live Treasury context unavailable:", error);
        contextStatus = {
          status: "unavailable",
          sources: ["Treasury daily par yield curve"],
          reason:
            error instanceof Error
              ? error.message
              : "Unknown Treasury context retrieval failure."
        };
      }
    }

    const brief = buildDailyAccountingBrief(snapshot.history, context);

    return NextResponse.json(
      {
        generatedAt: snapshot.generatedAt,
        dataSource: snapshot.dataSource,
        latest: snapshot.latest,
        freshness: snapshot.freshness,
        trends: snapshot.trends,
        publication: snapshot.publication,
        contextStatus,
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
