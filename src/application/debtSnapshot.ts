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

export interface DebtSnapshot {
  generatedAt: string;
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
}

export function buildDebtSnapshotFromHistory(
  history: DebtObservation[],
  now: Date = new Date()
): DebtSnapshot {
  const latest = selectLatestPublishableObservation(history);

  if (!latest) {
    return {
      generatedAt: now.toISOString(),
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

export async function getDebtSnapshot(
  options: DebtSnapshotOptions = {}
): Promise<DebtSnapshot> {
  const now = options.now ?? new Date();
  const history = await fetchRecentDebtObservations({
    fetchImpl: options.fetchImpl,
    pageSize: options.pageSize ?? 45,
    retrievedAt: options.retrievedAt ?? now
  });

  return buildDebtSnapshotFromHistory(history, now);
}
