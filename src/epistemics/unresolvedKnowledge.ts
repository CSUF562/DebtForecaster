export type UnknownReason =
  | "insufficient-evidence"
  | "conflicting-evidence"
  | "causation-unresolved"
  | "source-unavailable"
  | "model-sensitive"
  | "outside-scope";

export interface UnresolvedKnowledge {
  id: string;
  reason: UnknownReason;
  question: string;
  currentState: string;
  missingEvidence: string[];
  conflictingEvidenceIds: string[];
  relatedObservationIds: string[];
  relatedContextIds: string[];
  resolvable: boolean;
  resolutionCriteria: string[];
  createdAt: string;
  revisedAt: string | null;
}

export function validateUnresolvedKnowledge(
  item: UnresolvedKnowledge
): string[] {
  const findings: string[] = [];

  if (!item.question.trim()) {
    findings.push("Unresolved item must state the question that remains open.");
  }

  if (!item.currentState.trim()) {
    findings.push("Unresolved item must describe the current state of knowledge.");
  }

  if (item.reason === "insufficient-evidence" && item.missingEvidence.length === 0) {
    findings.push(
      "Insufficient-evidence items must identify at least one missing evidence requirement."
    );
  }

  if (
    item.reason === "conflicting-evidence" &&
    item.conflictingEvidenceIds.length < 2
  ) {
    findings.push(
      "Conflicting-evidence items must reference at least two conflicting evidence records."
    );
  }

  if (item.resolvable && item.resolutionCriteria.length === 0) {
    findings.push(
      "Resolvable unknowns must state what evidence or condition could resolve them."
    );
  }

  if (!item.resolvable && item.reason !== "outside-scope") {
    findings.push(
      "Only outside-scope items may be marked permanently non-resolvable."
    );
  }

  return findings;
}

export function createCausationUnresolved(params: {
  id: string;
  question: string;
  currentState: string;
  relatedObservationIds: string[];
  relatedContextIds: string[];
  createdAt: string;
  resolutionCriteria: string[];
}): UnresolvedKnowledge {
  return {
    id: params.id,
    reason: "causation-unresolved",
    question: params.question,
    currentState: params.currentState,
    missingEvidence: [],
    conflictingEvidenceIds: [],
    relatedObservationIds: params.relatedObservationIds,
    relatedContextIds: params.relatedContextIds,
    resolvable: true,
    resolutionCriteria: params.resolutionCriteria,
    createdAt: params.createdAt,
    revisedAt: null
  };
}
