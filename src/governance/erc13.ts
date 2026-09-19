import type { WhatChangedExplanation } from "../explanations/whatChanged.js";
import type { ContextEvidence } from "../context/contextEvidence.js";
import { validateContextEvidence } from "../context/contextEvidence.js";
import type { UnresolvedKnowledge } from "../epistemics/unresolvedKnowledge.js";
import { validateUnresolvedKnowledge } from "../epistemics/unresolvedKnowledge.js";
import type { CompetingExplanationSet } from "../epistemics/hypotheses.js";
import { validateCompetingExplanationSet } from "../epistemics/hypotheses.js";

export interface Erc13GateResult {
  gate:
    | "G1-source"
    | "G2-classification"
    | "G3-causality"
    | "G4-source-quality"
    | "G5-uncertainty-revision"
    | "G6-unresolved-knowledge"
    | "G7-competing-explanations";
  status: "pass" | "fail";
  findings: string[];
}

export interface Erc13Assessment {
  protocolVersion: "0.3.0";
  publishable: boolean;
  results: Erc13GateResult[];
}

export function assessDailyExplanation(
  explanation: WhatChangedExplanation,
  context: ContextEvidence[] = [],
  unresolved: UnresolvedKnowledge[] = [],
  competingExplanations: CompetingExplanationSet[] = []
): Erc13Assessment {
  const sourceFindings: string[] = [];
  const classificationFindings: string[] = [];
  const causalityFindings: string[] = [];
  const sourceQualityFindings: string[] = [];
  const uncertaintyFindings: string[] = [];
  const unresolvedFindings: string[] = [];
  const competingExplanationFindings: string[] = [];

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
    const findings = validateUnresolvedKnowledge(item);
    unresolvedFindings.push(
      ...findings.map(finding => `${item.id}: ${finding}`)
    );
  }

  for (const set of competingExplanations) {
    const findings = validateCompetingExplanationSet(set);
    competingExplanationFindings.push(
      ...findings.map(finding => `${set.questionId}: ${finding}`)
    );
  }

  const results: Erc13GateResult[] = [
    {
      gate: "G1-source",
      status: sourceFindings.length === 0 ? "pass" : "fail",
      findings: sourceFindings
    },
    {
      gate: "G2-classification",
      status: classificationFindings.length === 0 ? "pass" : "fail",
      findings: classificationFindings
    },
    {
      gate: "G3-causality",
      status: causalityFindings.length === 0 ? "pass" : "fail",
      findings: causalityFindings
    },
    {
      gate: "G4-source-quality",
      status: sourceQualityFindings.length === 0 ? "pass" : "fail",
      findings: sourceQualityFindings
    },
    {
      gate: "G5-uncertainty-revision",
      status: uncertaintyFindings.length === 0 ? "pass" : "fail",
      findings: uncertaintyFindings
    },
    {
      gate: "G6-unresolved-knowledge",
      status: unresolvedFindings.length === 0 ? "pass" : "fail",
      findings: unresolvedFindings
    },
    {
      gate: "G7-competing-explanations",
      status: competingExplanationFindings.length === 0 ? "pass" : "fail",
      findings: competingExplanationFindings
    }
  ];

  return {
    protocolVersion: "0.3.0",
    publishable: results.every(result => result.status === "pass"),
    results
  };
}
