import { NextResponse } from "next/server";
import { getDebtSnapshot } from "../../../src/application/debtSnapshot";
import { buildDailyAccountingBrief } from "../../../src/application/dailyBrief";
import { fetchTreasuryYieldCurveContext } from "../../../src/context/treasuryYieldCurve";
import { fetchCboMonthlyBudgetContext } from "../../../src/context/cboMonthlyBudget";
import { fetchFedFomcContext } from "../../../src/context/fedFomc";
import type { ContextEvidence } from "../../../src/context/contextEvidence";
import {
  getPostgresContextEvidenceRepository,
  type ContextSourceKey,
  type PersistedContextEvidence
} from "../../../src/storage/postgresContextRepository";

export const dynamic = "force-dynamic";

type SourceStatus = {
  source: string;
  sourceKey: ContextSourceKey;
  status: "available" | "unavailable" | "not-applicable";
  origin?: "live" | "persisted";
  persistence?: "inserted" | "duplicate" | "revised" | "rejected" | "unavailable";
  reason?: string;
};

function asContextEvidence(
  persisted: PersistedContextEvidence
): ContextEvidence {
  return {
    id: persisted.id,
    eventDate: persisted.eventDate,
    title: persisted.title,
    summary: persisted.summary,
    sourceName: persisted.sourceName,
    sourceUrl: persisted.sourceUrl,
    sourceTier: persisted.sourceTier,
    retrievedAt: persisted.retrievedAt,
    confidence: persisted.confidence,
    revisionOfId: persisted.revisionOfId,
    supersededById: persisted.supersededById,
    causalClaim: persisted.causalClaim,
    uncertaintyNote: persisted.uncertaintyNote
  };
}

export async function GET() {
  try {
    const snapshot = await getDebtSnapshot();
    const context: ContextEvidence[] = [];
    const contextStatus: SourceStatus[] = [];

    if (!snapshot.latest) {
      contextStatus.push(
        {
          source: "Treasury daily par yield curve",
          sourceKey: "treasury-yield-curve",
          status: "not-applicable"
        },
        {
          source: "CBO Monthly Budget Review",
          sourceKey: "cbo-monthly-budget-review",
          status: "not-applicable"
        },
        {
          source: "Federal Reserve FOMC statement",
          sourceKey: "fed-fomc-statement",
          status: "not-applicable"
        }
      );
    } else {
      const repository = process.env.DATABASE_URL
        ? getPostgresContextEvidenceRepository()
        : null;

      let persistedBySource = new Map<
        ContextSourceKey,
        PersistedContextEvidence
      >();

      if (repository) {
        try {
          const persisted = await repository.listLatestApplicable(
            snapshot.latest.recordDate
          );
          persistedBySource = new Map(
            persisted.map(item => [item.sourceKey, item])
          );
        } catch (error) {
          console.warn("Persisted context lookup unavailable:", error);
        }
      }

      const sources: Array<{
        name: string;
        sourceKey: ContextSourceKey;
        run: () => Promise<ContextEvidence | null>;
      }> = [
        {
          name: "Treasury daily par yield curve",
          sourceKey: "treasury-yield-curve",
          run: () =>
            fetchTreasuryYieldCurveContext({
              asOfDate: snapshot.latest!.recordDate
            })
        },
        {
          name: "CBO Monthly Budget Review",
          sourceKey: "cbo-monthly-budget-review",
          run: () =>
            fetchCboMonthlyBudgetContext({
              asOfDate: snapshot.latest!.recordDate
            })
        },
        {
          name: "Federal Reserve FOMC statement",
          sourceKey: "fed-fomc-statement",
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
            let persistence: SourceStatus["persistence"] = repository
              ? "unavailable"
              : undefined;
            let evidence = item;

            if (repository) {
              try {
                const saved = await repository.save(source.sourceKey, item);
                persistence = saved.status;

                if (saved.record) {
                  evidence = asContextEvidence(saved.record);
                }
              } catch (error) {
                console.warn(
                  `Context persistence unavailable for ${source.name}:`,
                  error
                );
              }
            }

            context.push(evidence);
            contextStatus.push({
              source: source.name,
              sourceKey: source.sourceKey,
              status: "available",
              origin: "live",
              persistence
            });
            continue;
          }

          const stored = persistedBySource.get(source.sourceKey);
          if (stored) {
            context.push(asContextEvidence(stored));
            contextStatus.push({
              source: source.name,
              sourceKey: source.sourceKey,
              status: "available",
              origin: "persisted",
              persistence: "duplicate",
              reason:
                "No applicable live record was returned; using the latest previously validated persisted record applicable to the debt date."
            });
          } else {
            contextStatus.push({
              source: source.name,
              sourceKey: source.sourceKey,
              status: "unavailable",
              reason:
                "No applicable current record was found on or before the latest validated debt date."
            });
          }
        } catch (error) {
          console.warn(`Live context unavailable from ${source.name}:`, error);

          const stored = persistedBySource.get(source.sourceKey);
          if (stored) {
            context.push(asContextEvidence(stored));
            contextStatus.push({
              source: source.name,
              sourceKey: source.sourceKey,
              status: "available",
              origin: "persisted",
              persistence: "duplicate",
              reason:
                "Live retrieval failed; using the latest previously validated persisted record applicable to the debt date."
            });
          } else {
            contextStatus.push({
              source: source.name,
              sourceKey: source.sourceKey,
              status: "unavailable",
              reason:
                error instanceof Error
                  ? error.message
                  : "Unknown context retrieval failure."
            });
          }
        }
      }
    }

    const brief = buildDailyAccountingBrief(snapshot.history, context);
    const availableContextSources = contextStatus.filter(
      item => item.status === "available"
    ).length;
    const liveContextSources = contextStatus.filter(
      item => item.status === "available" && item.origin === "live"
    ).length;

    const contextCoverage = {
      available: availableContextSources,
      live: liveContextSources,
      total: contextStatus.length,
      status:
        availableContextSources === contextStatus.length &&
        contextStatus.length > 0
          ? liveContextSources === contextStatus.length
            ? "complete-live"
            : "complete-with-persisted-fallback"
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
    console.error("Enclave snapshot unavailable:", error);

    return NextResponse.json(
      {
        error: "ENCLAVE_SNAPSHOT_UNAVAILABLE",
        message: "The current Enclave snapshot could not be generated."
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
