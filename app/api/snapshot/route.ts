import { NextResponse } from "next/server";
import { getDebtSnapshot } from "../../../src/application/debtSnapshot";
import { buildDailyAccountingBrief } from "../../../src/application/dailyBrief";
import { fetchTreasuryYieldCurveContext } from "../../../src/context/treasuryYieldCurve";
import { fetchCboMonthlyBudgetContext } from "../../../src/context/cboMonthlyBudget";
import { fetchFedFomcContext } from "../../../src/context/fedFomc";
import type { ContextEvidence } from "../../../src/context/contextEvidence";

export const dynamic = "force-dynamic";

type SourceStatus = {
  source: string;
  status: "available" | "unavailable" | "not-applicable";
  reason?: string;
};

export async function GET() {
  try {
    const snapshot = await getDebtSnapshot();
    const context: ContextEvidence[] = [];
    const contextStatus: SourceStatus[] = [];

    if (!snapshot.latest) {
      contextStatus.push(
        { source: "Treasury daily par yield curve", status: "not-applicable" },
        { source: "CBO Monthly Budget Review", status: "not-applicable" },
        { source: "Federal Reserve FOMC statement", status: "not-applicable" }
      );
    } else {
      const sources = [
        {
          name: "Treasury daily par yield curve",
          run: () =>
            fetchTreasuryYieldCurveContext({
              asOfDate: snapshot.latest!.recordDate
            })
        },
        {
          name: "CBO Monthly Budget Review",
          run: () =>
            fetchCboMonthlyBudgetContext({
              asOfDate: snapshot.latest!.recordDate
            })
        },
        {
          name: "Federal Reserve FOMC statement",
          run: () =>
            fetchFedFomcContext({
              asOfDate: snapshot.latest!.recordDate
            })
        }
      ];

      for (const source of sources) {
        try {
          const item = await source.run();
          if (item) {
            context.push(item);
            contextStatus.push({ source: source.name, status: "available" });
          } else {
            contextStatus.push({
              source: source.name,
              status: "unavailable",
              reason: "No applicable current record was found on or before the latest validated debt date."
            });
          }
        } catch (error) {
          console.warn(`Live context unavailable from ${source.name}:`, error);
          contextStatus.push({
            source: source.name,
            status: "unavailable",
            reason:
              error instanceof Error ? error.message : "Unknown context retrieval failure."
          });
        }
      }
    }

    const brief = buildDailyAccountingBrief(snapshot.history, context);
    const availableContextSources = contextStatus.filter(
      item => item.status === "available"
    ).length;
    const contextCoverage = {
      available: availableContextSources,
      total: contextStatus.length,
      status:
        availableContextSources === contextStatus.length && contextStatus.length > 0
          ? "complete"
          : availableContextSources > 0
            ? "partial"
            : contextStatus.length > 0
              ? "unavailable"
              : "not-applicable"
    };

    return NextResponse.json(
      {
        generatedAt: snapshot.generatedAt,
        dataSource: snapshot.dataSource,
        latest: snapshot.latest,
        freshness: snapshot.freshness,
        trends: snapshot.trends,
        publication: snapshot.publication,
        contextStatus,
        contextCoverage,
        brief: {
          publicationStatus: brief.publicationStatus,
          explanation: brief.explanation,
          unresolved: brief.unresolved,
          context: brief.context,
          materiality: brief.materiality,
          governance: brief.governance
        }
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "ENCLAVE_SNAPSHOT_UNAVAILABLE",
        message: error instanceof Error ? error.message : "Unknown snapshot failure"
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
