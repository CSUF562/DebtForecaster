export type WordingStrength =
  | "established"
  | "strongly-supported"
  | "plausible"
  | "speculative";

export interface WordingCalibration {
  claimId: string;
  requestedStrength: WordingStrength;
  evidenceClass: "observed" | "derived" | "contextual" | "modeled" | "hypothesis" | "unresolved";
  independentOrigins: number;
  hasCounterevidenceReview: boolean;
  unresolvedConflict: boolean;
}

export function validateWordingCalibration(
  item: WordingCalibration
): string[] {
  const findings: string[] = [];

  if (
    item.requestedStrength === "established" &&
    !["observed", "derived"].includes(item.evidenceClass)
  ) {
    findings.push(
      "Only observed or deterministic derived claims may be worded as established without additional domain-specific justification."
    );
  }

  if (
    item.requestedStrength === "strongly-supported" &&
    item.independentOrigins < 2
  ) {
    findings.push(
      "Strongly-supported wording requires at least two independent evidence origins."
    );
  }

  if (
    ["established", "strongly-supported"].includes(item.requestedStrength) &&
    !item.hasCounterevidenceReview
  ) {
    findings.push(
      "High-strength wording requires a documented counterevidence review."
    );
  }

  if (
    item.unresolvedConflict &&
    item.requestedStrength !== "speculative"
  ) {
    findings.push(
      "Claims with unresolved evidentiary conflict must remain speculative."
    );
  }

  return findings;
}
