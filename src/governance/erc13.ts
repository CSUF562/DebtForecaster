import type { WhatChangedExplanation } from "../explanations/whatChanged.js";

export interface Erc13GateResult {
  gate: "G1-source" | "G2-classification" | "G3-causality";
  status: "pass" | "fail";
  findings: string[];
}

export interface Erc13Assessment {
  protocolVersion: "0.1.0";
  publishable: boolean;
  results: Erc13GateResult[];
}

export function assessDailyExplanation(
  explanation: WhatChangedExplanation
): Erc13Assessment {
  const sourceFindings: string[] = [];
  const classificationFindings: string[] = [];
  const causalityFindings: string[] = [];

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
    }
  ];

  return {
    protocolVersion: "0.1.0",
    publishable: results.every(result => result.status === "pass"),
    results
  };
}
