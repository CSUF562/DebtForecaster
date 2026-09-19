import type { ContextEvidence } from "../context/contextEvidence";
import { fetchTreasuryYieldCurveContext } from "../context/treasuryYieldCurve";
import { fetchCboMonthlyBudgetContext } from "../context/cboMonthlyBudget";
import { fetchFedFomcContext } from "../context/fedFomc";
import {
  getPostgresContextEvidenceRepository,
  type ContextSourceKey,
  type PersistedContextEvidence
} from "../storage/postgresContextRepository";

export interface ContextSourceStatus {
  source: string;
  sourceKey: ContextSourceKey;
  status: "available" | "unavailable" | "not-applicable";
  origin?: "live" | "persisted";
  persistence?: "inserted" | "duplicate" | "revised" | "rejected" | "unavailable";
  reason?: string;
}

export interface ContextCoverage {
  available: number;
  live: number;
  total: number;
  status:
    | "complete-live"
    | "complete-with-persisted-fallback"
    | "partial"
    | "unavailable"
    | "not-applicable";
}

export interface ContextSnapshot {
  items: ContextEvidence[];
  status: ContextSourceStatus[];
  coverage: ContextCoverage;
}

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

function buildCoverage(status: ContextSourceStatus[]): ContextCoverage {
  const available = status.filter(item => item.status === "available").length;
  const live = status.filter(
    item => item.status === "available" && item.origin === "live"
  ).length;

  return {
    available,
    live,
    total: status.length,
    status:
      available === status.length && status.length > 0
        ? live === status.length
          ? "complete-live"
          : "complete-with-persisted-fallback"
        : available > 0
          ? "partial"
          : status.length > 0
            ? "unavailable"
            : "not-applicable"
  };
}

export async function getContextSnapshot(
  asOfDate: string | null
): Promise<ContextSnapshot> {
  const items: ContextEvidence[] = [];
  const status: ContextSourceStatus[] = [];

  const definitions: Array<{
    name: string;
    sourceKey: ContextSourceKey;
    run: (date: string) => Promise<ContextEvidence | null>;
  }> = [
    {
      name: "Treasury daily par yield curve",
      sourceKey: "treasury-yield-curve",
      run: date => fetchTreasuryYieldCurveContext({ asOfDate: date })
    },
    {
      name: "CBO Monthly Budget Review",
      sourceKey: "cbo-monthly-budget-review",
      run: date => fetchCboMonthlyBudgetContext({ asOfDate: date })
    },
    {
      name: "Federal Reserve FOMC statement",
      sourceKey: "fed-fomc-statement",
      run: date => fetchFedFomcContext({ asOfDate: date })
    }
  ];

  if (!asOfDate) {
    for (const definition of definitions) {
      status.push({
        source: definition.name,
        sourceKey: definition.sourceKey,
        status: "not-applicable"
      });
    }

    return { items, status, coverage: buildCoverage(status) };
  }

  const repository = process.env.DATABASE_URL
    ? getPostgresContextEvidenceRepository()
    : null;

  let persistedBySource = new Map<
    ContextSourceKey,
    PersistedContextEvidence
  >();

  if (repository) {
    try {
      const persisted = await repository.listLatestApplicable(asOfDate);
      persistedBySource = new Map(
        persisted.map(item => [item.sourceKey, item])
      );
    } catch (error) {
      console.warn("Persisted context lookup unavailable:", error);
    }
  }

  for (const definition of definitions) {
    try {
      const item = await definition.run(asOfDate);

      if (item) {
        let persistence: ContextSourceStatus["persistence"] = repository
          ? "unavailable"
          : undefined;
        let evidence = item;

        if (repository) {
          try {
            const saved = await repository.save(definition.sourceKey, item);
            persistence = saved.status;

            if (saved.record) {
              evidence = asContextEvidence(saved.record);
            }
          } catch (error) {
            console.warn(
              `Context persistence unavailable for ${definition.name}:`,
              error
            );
          }
        }

        items.push(evidence);
        status.push({
          source: definition.name,
          sourceKey: definition.sourceKey,
          status: "available",
          origin: "live",
          persistence
        });
        continue;
      }

      const stored = persistedBySource.get(definition.sourceKey);
      if (stored) {
        items.push(asContextEvidence(stored));
        status.push({
          source: definition.name,
          sourceKey: definition.sourceKey,
          status: "available",
          origin: "persisted",
          persistence: "duplicate",
          reason:
            "No applicable live record was returned; using the latest previously validated persisted record applicable to the debt date."
        });
      } else {
        status.push({
          source: definition.name,
          sourceKey: definition.sourceKey,
          status: "unavailable",
          reason:
            "No applicable current record was found on or before the latest validated debt date."
        });
      }
    } catch (error) {
      console.warn(`Live context unavailable from ${definition.name}:`, error);

      const stored = persistedBySource.get(definition.sourceKey);
      if (stored) {
        items.push(asContextEvidence(stored));
        status.push({
          source: definition.name,
          sourceKey: definition.sourceKey,
          status: "available",
          origin: "persisted",
          persistence: "duplicate",
          reason:
            "Live retrieval failed; using the latest previously validated persisted record applicable to the debt date."
        });
      } else {
        status.push({
          source: definition.name,
          sourceKey: definition.sourceKey,
          status: "unavailable",
          reason:
            error instanceof Error
              ? error.message
              : "Unknown context retrieval failure."
        });
      }
    }
  }

  return { items, status, coverage: buildCoverage(status) };
}
