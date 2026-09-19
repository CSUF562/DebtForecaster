import type { DebtObservation } from "../fiscal/debt";
import { selectLatestPublishableObservation } from "../fiscal/debt";
import {
  explainAccountingChange,
  type WhatChangedExplanation
} from "../explanations/whatChanged";
import {
  assessDailyExplanation,
  type Erc13Assessment
} from "../governance/erc13";
import type { ContextEvidence } from "../context/contextEvidence";
import type { ContestabilityRecord } from "../epistemics/contestability";
import { buildDailyNarrative, type DailyNarrative } from "../explanations/dailyNarrative";
import { buildUnknownMateriality, type ContextMateriality } from "../epistemics/materiality";
import {
  createCausationUnresolved,
  type UnresolvedKnowledge
} from "../epistemics/unresolvedKnowledge";
import {
  getReleaseMetadata,
  type ReleaseMetadata
} from "./releaseMetadata";

export interface DailyAccountingBrief {
  publicationId: string | null;
  release: ReleaseMetadata;
  latestObservationId: string | null;
  priorObservationId: string | null;
  explanation: WhatChangedExplanation | null;
  narrative: DailyNarrative | null;
  unresolved: UnresolvedKnowledge[];
  context: ContextEvidence[];
  materiality: ContextMateriality[];
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
  const release = getReleaseMetadata();
  const latest = selectLatestPublishableObservation(history);

  if (!latest) {
    return {
      publicationId: null,
      release,
      latestObservationId: null,
      priorObservationId: null,
      explanation: null,
      narrative: null,
      unresolved: [],
      context: [],
      materiality: [],
      governance: null,
      publicationStatus: "insufficient-history"
    };
  }

  const publicationId = `daily-brief-${latest.recordDate}-${(
    release.commitSha ?? "local"
  ).slice(0, 12)}`;

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
      publicationId,
      release,
      latestObservationId: latest.id,
      priorObservationId: null,
      explanation: null,
      narrative: null,
      unresolved: [],
      context: [],
      materiality: [],
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

  const materiality = context.map(buildUnknownMateriality);
  const narrativeResult = buildDailyNarrative(explanation, context, unresolved);

  const contestability: ContestabilityRecord[] = [
    {
      outputId: publicationId,
      evidenceInspectable: true,
      assumptionsInspectable: true,
      unresolvedVisible: true,
      revisionPathVisible: true,
      challengePathVisible: true,
      automatedDecisionBinding: false,
      humanOverrideAvailable: true,
      notes:
        "The dashboard exposes evidence class, unresolved knowledge, ERC13 gate status, methodology, revision policy, release provenance, and a public challenge path."
    }
  ];

  const governance = assessDailyExplanation(
    explanation,
    context,
    unresolved,
    [],
    materiality,
    [],
    [],
    narrativeResult.wording,
    [],
    contestability
  );

  return {
    publicationId,
    release,
    latestObservationId: latest.id,
    priorObservationId: prior.id,
    explanation,
    narrative: narrativeResult.narrative,
    unresolved,
    context,
    materiality,
    governance,
    publicationStatus: governance.publishable ? "publishable" : "blocked"
  };
}
