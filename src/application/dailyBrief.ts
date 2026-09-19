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
import type { ContestabilityRecord } from "../epistemics/contestability.js";
import {
  createCausationUnresolved,
  type UnresolvedKnowledge
} from "../epistemics/unresolvedKnowledge.js";

export interface DailyAccountingBrief {
  latestObservationId: string | null;
  priorObservationId: string | null;
  explanation: WhatChangedExplanation | null;
  unresolved: UnresolvedKnowledge[];
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
      unresolved: [],
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
      unresolved: [],
      governance: null,
      publicationStatus: "insufficient-history"
    };
  }

  const explanation = explainAccountingChange(latest, prior);

  const unresolved: UnresolvedKnowledge[] = [
    createCausationUnresolved({
      id: `unk-cause-${latest.recordDate}`,
      question: `What caused the reported change in total public debt between ${prior.recordDate} and ${latest.recordDate}?`,
      currentState:
        "Treasury accounting establishes the reported change and its component movements, but the currently assembled evidence does not establish a complete causal explanation.",
      relatedObservationIds: [prior.id, latest.id],
      relatedContextIds: context.map(item => item.id),
      createdAt: latest.retrievedAt,
      resolutionCriteria: [
        "Primary-source evidence that directly links the accounting movement to identifiable federal transactions, financing operations, or other documented drivers.",
        "Any causal interpretation must reconcile with the observed component changes and survive ERC13 source-quality and uncertainty review."
      ]
    })
  ];

  const contestability: ContestabilityRecord[] = [
    {
      outputId: `daily-brief-${latest.recordDate}`,
      evidenceInspectable: true,
      assumptionsInspectable: true,
      unresolvedVisible: true,
      revisionPathVisible: true,
      challengePathVisible: true,
      automatedDecisionBinding: false,
      humanOverrideAvailable: true,
      notes:
        "The dashboard exposes evidence class, unresolved knowledge, ERC13 gate status, methodology, revision policy, and a public challenge path."
    }
  ];

  const governance = assessDailyExplanation(
    explanation,
    context,
    unresolved,
    [],
    [],
    [],
    [],
    [],
    [],
    contestability
  );

  return {
    latestObservationId: latest.id,
    priorObservationId: prior.id,
    explanation,
    unresolved,
    governance,
    publicationStatus: governance.publishable ? "publishable" : "blocked"
  };
}
