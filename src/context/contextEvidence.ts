export type ContextSourceTier =
  | "primary-government"
  | "primary-institutional"
  | "reputable-secondary"
  | "other";

export type ContextConfidence = "high" | "medium" | "low";

export interface ContextEvidence {
  id: string;
  eventDate: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  sourceTier: ContextSourceTier;
  retrievedAt: string;
  confidence: ContextConfidence;
  revisionOfId: string | null;
  supersededById: string | null;
  causalClaim: boolean;
  uncertaintyNote: string;
}

export function validateContextEvidence(
  evidence: ContextEvidence
): string[] {
  const findings: string[] = [];

  if (!/^https?:\/\//.test(evidence.sourceUrl)) {
    findings.push("Context evidence must include an http(s) source URL.");
  }

  if (!evidence.sourceName.trim()) {
    findings.push("Context evidence must name its source.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(evidence.eventDate)) {
    findings.push("Context evidence must include an ISO event date.");
  }

  if (!evidence.uncertaintyNote.trim()) {
    findings.push("Context evidence must include an uncertainty note.");
  }

  if (evidence.causalClaim) {
    findings.push(
      "Context evidence may not assert causation at ingestion time; causal analysis requires a later explicit evidentiary step."
    );
  }

  return findings;
}
