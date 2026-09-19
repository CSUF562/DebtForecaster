import {
  fetchRecentDebtObservations,
  selectLatestPublishableObservation,
  type DebtObservation,
  type FetchDebtOptions
} from "../fiscal/debt.js";
import {
  assessDebtFreshness,
  type FreshnessAssessment
} from "../fiscal/freshness.js";
import {
  buildTrendSummary,
  type DebtChange
} from "../fiscal/trends.js";
import { getPostgresDebtRepository } from "../storage/postgresDebtRepository.js";

export type DebtSnapshotSource =
  | "database"
  | "treasury-live"
  | "provided-history";

export interface DebtSnapshot {
  generatedAt: string;
  dataSource: DebtSnapshotSource;
  history: DebtObservation[];
  latest: DebtObservation | null;
  freshness: FreshnessAssessment | null;
  trends: {
    previous: DebtChange | null;
    sevenDay: DebtChange | null;
    thirtyDay: DebtChange | null;
  };
  publication: {
    canPresentAsCurrent: boolean;
    reason: string;
  };
}

export interface DebtSnapshotOptions extends FetchDebtOptions {
  now?: Date;
  preferDatabase?: boolean;
}

export function buildDebtSnapshotFromHistory(
  history: DebtObservation[],
  now: Date = new Date(),
  dataSource: DebtSnapshotSource = "provided-history"
): DebtSnapshot {
  const latest = selectLatestPublishableObservation(history);

  if (!latest) {
    return {
      generatedAt: now.toISOString(),
      dataSource,
      history,
      latest: null,
      freshness: null,
      trends: {
        previous: null,
        sevenDay: null,
        thirtyDay: null
      },
      publication: {
        canPresentAsCurrent: false,
        reason: "No validated Treasury debt observation is available."
      }
    };
  }

  const freshness = assessDebtFreshness(latest, now);
  const trends = buildTrendSummary(latest, history);
  const canPresentAsCurrent = freshness.status !== "stale";

  return {
    generatedAt: now.toISOString(),
    dataSource,
    history,
    latest,
    freshness,
    trends,
    publication: {
      canPresentAsCurrent,
      reason: canPresentAsCurrent
        ? "Latest validated observation satisfies the current freshness policy."
        : "Latest validated observation is stale and requires an explicit stale-data presentation."
    }
  };
}

async function readStoredHistory(limit: number): Promise<DebtObservation[]> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  const repository = getPostgresDebtRepository();
  return repository.listRecent(limit);
}

export async function getDebtSnapshot(
  options: DebtSnapshotOptions = {}
): Promise<DebtSnapshot> {
  const now = options.now ?? new Date();
  const pageSize = options.pageSize ?? 45;
  const preferDatabase = options.preferDatabase ?? true;

  if (preferDatabase && !options.fetchImpl && process.env.DATABASE_URL) {
    try {
      const storedHistory = await readStoredHistory(pageSize);

      if (storedHistory.length > 0) {
        return buildDebtSnapshotFromHistory(
          storedHistory,
          now,
          "database"
        );
      }
    } catch (error) {
      console.warn(
        "Enclave database snapshot unavailable; falling back to live Treasury data.",
        error
      );
    }
  }

  const history = await fetchRecentDebtObservations({
    fetchImpl: options.fetchImpl,
    pageSize,
    retrievedAt: options.retrievedAt ?? now
  });

  return buildDebtSnapshotFromHistory(
    history,
    now,
    "treasury-live"
  );
}
