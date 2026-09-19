export type HypothesisStatus =
  | "candidate"
  | "supported"
  | "weakened"
  | "refuted";

export type Materiality = "high" | "medium" | "low" | "unknown";

export interface HypothesisCandidate {
  id: string;
  questionId: string;
  statement: string;
  causal: boolean;
  status: HypothesisStatus;
  confidence: "low" | "medium";
  supportingEvidenceIds: string[];
  counterEvidenceIds: string[];
  assumptions: string[];
  materiality: Materiality;
  materialityRationale: string;
  disconfirmingEvidenceNeeded: string[];
}

export interface CompetingExplanationSet {
  questionId: string;
  candidates: HypothesisCandidate[];
  preferredHypothesisId: string | null;
  preferenceRationale: string | null;
}

export function validateHypothesisCandidate(
  candidate: HypothesisCandidate
): string[] {
  const findings: string[] = [];

  if (!candidate.statement.trim()) {
    findings.push("Hypothesis must state a proposition.");
  }

  if (candidate.confidence === "medium" && candidate.supportingEvidenceIds.length === 0) {
    findings.push(
      "A medium-confidence hypothesis requires at least one supporting evidence record."
    );
  }

  if (candidate.assumptions.length === 0) {
    findings.push("Hypothesis must expose at least one assumption.");
  }

  if (candidate.materiality === "unknown" && !candidate.materialityRationale.trim()) {
    findings.push(
      "Unknown materiality requires an explanation of why materiality cannot yet be assessed."
    );
  }

  if (candidate.disconfirmingEvidenceNeeded.length === 0) {
    findings.push(
      "Hypothesis must state what evidence could weaken or refute it."
    );
  }

  return findings;
}

export function validateCompetingExplanationSet(
  set: CompetingExplanationSet
): string[] {
  const findings: string[] = [];

  for (const candidate of set.candidates) {
    findings.push(
      ...validateHypothesisCandidate(candidate).map(
        finding => `${candidate.id}: ${finding}`
      )
    );
  }

  const causalCandidates = set.candidates.filter(candidate => candidate.causal);

  if (causalCandidates.length === 1 && set.preferredHypothesisId) {
    findings.push(
      "A sole causal candidate cannot be designated preferred without an explicit competing explanation."
    );
  }

  if (set.preferredHypothesisId) {
    const preferred = set.candidates.find(
      candidate => candidate.id === set.preferredHypothesisId
    );

    if (!preferred) {
      findings.push("Preferred hypothesis ID does not match any candidate.");
    }

    if (!set.preferenceRationale?.trim()) {
      findings.push(
        "Selecting a preferred hypothesis requires an explicit evidence-based rationale."
      );
    }
  }

  return findings;
}
