import type { DebtObservation } from "../fiscal/debt.js";
import { selectLatestPublishableObservation } from "../fiscal/debt.js";
import { explainAccountingChange, type WhatChangedExplanation } from "../explanations/whatChanged.js";

export interface DailyAccountingBrief {
  latestObservationId: string | null;
  priorObservationId: string | null;
  explanation: WhatChangedExplanation | null;
  publicationStatus: "ready" | "insufficient-history";
}

export function buildDailyAccountingBrief(
  history: DebtObservation[]
): DailyAccountingBrief {
  const latest = selectLatestPublishableObservation(history);

  if (!latest) {
    return {
      latestObservationId: null,
      priorObservationId: null,
      explanation: null,
      publicationStatus: "insufficient-history"
    };
  }

  const prior = history
    .filter(
      item =>
        item.validationStatus !== "fail" &&
        item.recordDate < latest.recordDate
    )
    .sort((a, b) => b.recordDate.localeCompare(a.recordDate))[0] ?? null;

  if (!prior) {
    return {
      latestObservationId: latest.id,
      priorObservationId: null,
      explanation: null,
      publicationStatus: "insufficient-history"
    };
  }

  return {
    latestObservationId: latest.id,
    priorObservationId: prior.id,
    explanation: explainAccountingChange(latest, prior),
    publicationStatus: "ready"
  };
}
