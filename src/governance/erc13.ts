import type { WhatChangedExplanation } from "../explanations/whatChanged";
import type { ContextEvidence } from "../context/contextEvidence";
import { validateContextEvidence } from "../context/contextEvidence";
import type { UnresolvedKnowledge } from "../epistemics/unresolvedKnowledge";
import { validateUnresolvedKnowledge } from "../epistemics/unresolvedKnowledge";
import type { CompetingExplanationSet } from "../epistemics/hypotheses";
import { validateCompetingExplanationSet } from "../epistemics/hypotheses";
import type { ContextMateriality } from "../epistemics/materiality";
import { validateContextMateriality } from "../epistemics/materiality";
import type { CorroborationSet } from "../epistemics/corroboration";
import { validateCorroborationSet } from "../epistemics/corroboration";
import type { CounterevidenceReview } from "../epistemics/counterevidence";
import { validateCounterevidenceReview } from "../epistemics/counterevidence";
import type { WordingCalibration } from "../epistemics/wording";
import { validateWordingCalibration } from "../epistemics/wording";
import type { RevisionTrigger } from "../epistemics/revisionTriggers";
import { validateRevisionTrigger } from "../epistemics/revisionTriggers";
import type { ContestabilityRecord } from "../epistemics/contestability";
import { validateContestability } from "../epistemics/contestability";

export interface Erc13GateResult {
  gate:
    | "G1-source"
    | "G2-classification"
    | "G3-causality"
    | "G4-source-quality"
    | "G5-uncertainty-revision"
    | "G6-unresolved-knowledge"
    | "G7-competing-explanations"
    | "G8-materiality"
    | "G9-corroboration-independence"
    | "G10-counterevidence"
    | "G11-wording-calibration"
    | "G12-revision-trigger"
    | "G13-contestability-agency";
  status: "pass" | "fail" | "not-applicable";
  findings: string[];
}

export interface Erc13Assessment {
  protocolVersion: "1.0.0";
  publishable: boolean;
  results: Erc13GateResult[];
}

export function assessDailyExplanation(
  explanation: WhatChangedExplanation,
  context: ContextEvidence[] = [],
  unresolved: UnresolvedKnowledge[] = [],
  competingExplanations: CompetingExplanationSet[] = [],
  materiality: ContextMateriality[] = [],
  corroboration: CorroborationSet[] = [],
  counterevidence: CounterevidenceReview[] = [],
  wording: WordingCalibration[] = [],
  revisionTriggers: RevisionTrigger[] = [],
  contestability: ContestabilityRecord[] = []
): Erc13Assessment {
  const sourceFindings: string[] = [];
  const classificationFindings: string[] = [];
  const causalityFindings: string[] = [];
  const sourceQualityFindings: string[] = [];
  const uncertaintyFindings: string[] = [];
  const unresolvedFindings: string[] = [];
  const competingExplanationFindings: string[] = [];
  const materialityFindings: string[] = [];
  const corroborationFindings: string[] = [];
  const counterevidenceFindings: string[] = [];
  const wordingFindings: string[] = [];
  const revisionFindings: string[] = [];
  const contestabilityFindings: string[] = [];

  if (!explanation.currentObservationId || !explanation.priorObservationId) {
    sourceFindings.push("Explanation is missing source observation lineage.");
  }

  for (const claim of explanation.claims) {
    if (claim.sourceObservationIds.length === 0) {
      sourceFindings.push(`Claim ${claim.id} has no source observation IDs.`);
    }

    if (!claim.evidenceClass) {
      classificationFindings.push(`Claim ${claim.id} has no evidence classification.`);
    }

    if (claim.causal && claim.evidenceClass === "observed") {
      causalityFindings.push(
        `Claim ${claim.id} presents an observed accounting claim as causal.`
      );
    }
  }

  if (!explanation.evidenceBoundary.trim()) {
    causalityFindings.push("Explanation is missing an explicit evidence boundary.");
  }

  for (const item of context) {
    const validationFindings = validateContextEvidence(item);

    for (const finding of validationFindings) {
      if (finding.includes("source") || finding.includes("URL")) {
        sourceQualityFindings.push(`${item.id}: ${finding}`);
      } else {
        uncertaintyFindings.push(`${item.id}: ${finding}`);
      }
    }

    if (item.sourceTier === "other" && item.confidence === "high") {
      sourceQualityFindings.push(
        `${item.id}: low-tier source cannot be assigned high confidence without corroboration.`
      );
    }

    if (item.revisionOfId && item.revisionOfId === item.id) {
      uncertaintyFindings.push(
        `${item.id}: revisionOfId cannot reference the same record.`
      );
    }

    if (item.supersededById && item.supersededById === item.id) {
      uncertaintyFindings.push(
        `${item.id}: supersededById cannot reference the same record.`
      );
    }
  }

  for (const item of unresolved) {
    unresolvedFindings.push(
      ...validateUnresolvedKnowledge(item).map(finding => `${item.id}: ${finding}`)
    );
  }

  for (const set of competingExplanations) {
    competingExplanationFindings.push(
      ...validateCompetingExplanationSet(set).map(
        finding => `${set.questionId}: ${finding}`
      )
    );
  }

  for (const item of materiality) {
    materialityFindings.push(
      ...validateContextMateriality(item).map(
        finding => `${item.contextId}: ${finding}`
      )
    );
  }

  for (const set of corroboration) {
    corroborationFindings.push(...validateCorroborationSet(set));
  }

  for (const review of counterevidence) {
    counterevidenceFindings.push(
      ...validateCounterevidenceReview(review).map(
        finding => `${review.hypothesisId}: ${finding}`
      )
    );
  }

  for (const item of wording) {
    wordingFindings.push(
      ...validateWordingCalibration(item).map(
        finding => `${item.claimId}: ${finding}`
      )
    );
  }

  for (const trigger of revisionTriggers) {
    revisionFindings.push(
      ...validateRevisionTrigger(trigger).map(
        finding => `${trigger.id}: ${finding}`
      )
    );
  }

  if (contestability.length === 0) {
    contestabilityFindings.push(
      "Publishable output requires at least one contestability record."
    );
  }

  for (const record of contestability) {
    contestabilityFindings.push(
      ...validateContestability(record).map(
        finding => `${record.outputId}: ${finding}`
      )
    );
  }

  const results: Erc13GateResult[] = [
    { gate: "G1-source", status: sourceFindings.length === 0 ? "pass" : "fail", findings: sourceFindings },
    { gate: "G2-classification", status: classificationFindings.length === 0 ? "pass" : "fail", findings: classificationFindings },
    { gate: "G3-causality", status: causalityFindings.length === 0 ? "pass" : "fail", findings: causalityFindings },
    { gate: "G4-source-quality", status: sourceQualityFindings.length === 0 ? "pass" : "fail", findings: sourceQualityFindings },
    { gate: "G5-uncertainty-revision", status: uncertaintyFindings.length === 0 ? "pass" : "fail", findings: uncertaintyFindings },
    { gate: "G6-unresolved-knowledge", status: unresolvedFindings.length === 0 ? "pass" : "fail", findings: unresolvedFindings },
    { gate: "G7-competing-explanations", status: competingExplanations.length === 0 ? "not-applicable" : competingExplanationFindings.length === 0 ? "pass" : "fail", findings: competingExplanationFindings },
    { gate: "G8-materiality", status: materiality.length === 0 ? "not-applicable" : materialityFindings.length === 0 ? "pass" : "fail", findings: materialityFindings },
    { gate: "G9-corroboration-independence", status: corroboration.length === 0 ? "not-applicable" : corroborationFindings.length === 0 ? "pass" : "fail", findings: corroborationFindings },
    { gate: "G10-counterevidence", status: counterevidence.length === 0 ? "not-applicable" : counterevidenceFindings.length === 0 ? "pass" : "fail", findings: counterevidenceFindings },
    { gate: "G11-wording-calibration", status: wording.length === 0 ? "not-applicable" : wordingFindings.length === 0 ? "pass" : "fail", findings: wordingFindings },
    { gate: "G12-revision-trigger", status: revisionTriggers.length === 0 ? "not-applicable" : revisionFindings.length === 0 ? "pass" : "fail", findings: revisionFindings },
    { gate: "G13-contestability-agency", status: contestabilityFindings.length === 0 ? "pass" : "fail", findings: contestabilityFindings }
  ];

  return {
    protocolVersion: "1.0.0",
    publishable: results.every(result => result.status !== "fail"),
    results
  };
}
