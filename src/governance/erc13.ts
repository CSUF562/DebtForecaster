import type { WhatChangedExplanation } from "../explanations/whatChanged.js";
import type { ContextEvidence } from "../context/contextEvidence.js";
import { validateContextEvidence } from "../context/contextEvidence.js";
import type { UnresolvedKnowledge } from "../epistemics/unresolvedKnowledge.js";
import { validateUnresolvedKnowledge } from "../epistemics/unresolvedKnowledge.js";
import type { CompetingExplanationSet } from "../epistemics/hypotheses.js";
import { validateCompetingExplanationSet } from "../epistemics/hypotheses.js";
import type { ContextMateriality } from "../epistemics/materiality.js";
import { validateContextMateriality } from "../epistemics/materiality.js";
import type { CorroborationSet } from "../epistemics/corroboration.js";
import { validateCorroborationSet } from "../epistemics/corroboration.js";
import type { CounterevidenceReview } from "../epistemics/counterevidence.js";
import { validateCounterevidenceReview } from "../epistemics/counterevidence.js";
import type { WordingCalibration } from "../epistemics/wording.js";
import { validateWordingCalibration } from "../epistemics/wording.js";
import type { RevisionTrigger } from "../epistemics/revisionTriggers.js";
import { validateRevisionTrigger } from "../epistemics/revisionTriggers.js";

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
    | "G12-revision-trigger";
  status: "pass" | "fail";
  findings: string[];
}

export interface Erc13Assessment {
  protocolVersion: "0.6.0";
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
  revisionTriggers: RevisionTrigger[] = []
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

  const results: Erc13GateResult[] = [
    { gate: "G1-source", status: sourceFindings.length === 0 ? "pass" : "fail", findings: sourceFindings },
    { gate: "G2-classification", status: classificationFindings.length === 0 ? "pass" : "fail", findings: classificationFindings },
    { gate: "G3-causality", status: causalityFindings.length === 0 ? "pass" : "fail", findings: causalityFindings },
    { gate: "G4-source-quality", status: sourceQualityFindings.length === 0 ? "pass" : "fail", findings: sourceQualityFindings },
    { gate: "G5-uncertainty-revision", status: uncertaintyFindings.length === 0 ? "pass" : "fail", findings: uncertaintyFindings },
    { gate: "G6-unresolved-knowledge", status: unresolvedFindings.length === 0 ? "pass" : "fail", findings: unresolvedFindings },
    { gate: "G7-competing-explanations", status: competingExplanationFindings.length === 0 ? "pass" : "fail", findings: competingExplanationFindings },
    { gate: "G8-materiality", status: materialityFindings.length === 0 ? "pass" : "fail", findings: materialityFindings },
    { gate: "G9-corroboration-independence", status: corroborationFindings.length === 0 ? "pass" : "fail", findings: corroborationFindings },
    { gate: "G10-counterevidence", status: counterevidenceFindings.length === 0 ? "pass" : "fail", findings: counterevidenceFindings },
    { gate: "G11-wording-calibration", status: wordingFindings.length === 0 ? "pass" : "fail", findings: wordingFindings },
    { gate: "G12-revision-trigger", status: revisionFindings.length === 0 ? "pass" : "fail", findings: revisionFindings }
  ];

  return {
    protocolVersion: "0.6.0",
    publishable: results.every(result => result.status === "pass"),
    results
  };
}
