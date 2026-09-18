import type { WhatChangedExplanation } from "../explanations/whatChanged.js";
import type { ContextEvidence } from "../context/contextEvidence.js";
import { validateContextEvidence } from "../context/contextEvidence.js";

export interface Erc13GateResult {
  gate:
    | "G1-source"
    | "G2-classification"
    | "G3-causality"
    | "G4-source-quality"
    | "G5-uncertainty-revision";
  status: "pass" | "fail";
  findings: string[];
}

export interface Erc13Assessment {
  protocolVersion: "0.2.0";
  publishable: boolean;
  results: Erc13GateResult[];
}

export function assessDailyExplanation(
  explanation: WhatChangedExplanation,
  context: ContextEvidence[] = []
): Erc13Assessment {
  const sourceFindings: string[] = [];
  const classificationFindings: string[] = [];
  const causalityFindings: string[] = [];
  const sourceQualityFindings: string[] = [];
  const uncertaintyFindings: string[] = [];

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
    }
  ];

  return {
    protocolVersion: "0.2.0",
    publishable: results.every(result => result.status === "pass"),
    results
  };
}
