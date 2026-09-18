import type { DebtObservation } from "../fiscal/debt.js";
import { selectLatestPublishableObservation } from "../fiscal/debt.js";
import {
  explainAccountingChange,
  type WhatChangedExplanation
} from "../explanations/whatChanged.js";
import {
  assessDailyExplanation,
  type Erc13Assessment
} from "../governance/erc13.js";
import type { ContextEvidence } from "../context/contextEvidence.js";

export interface DailyAccountingBrief {
  latestObservationId: string | null;
  priorObservationId: string | null;
  explanation: WhatChangedExplanation | null;
  governance: Erc13Assessment | null;
  publicationStatus:
    | "publishable"
    | "blocked"
    | "insufficient-history";
}

export function buildDailyAccountingBrief(
  history: DebtObservation[],
  context: ContextEvidence[] = []
): DailyAccountingBrief {
  const latest = selectLatestPublishableObservation(history);

  if (!latest) {
    return {
      latestObservationId: null,
      priorObservationId: null,
      explanation: null,
      governance: null,
      publicationStatus: "insufficient-history"
    };
  }

  const prior =
    history
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
      governance: null,
      publicationStatus: "insufficient-history"
    };
  }

  const explanation = explainAccountingChange(latest, prior);
  const governance = assessDailyExplanation(explanation, context);

  return {
    latestObservationId: latest.id,
    priorObservationId: prior.id,
    explanation,
    governance,
    publicationStatus: governance.publishable ? "publishable" : "blocked"
  };
}
