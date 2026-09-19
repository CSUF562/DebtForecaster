import type { ContextEvidence } from "../context/contextEvidence.js";

export type MaterialityAssessment =
  | "material"
  | "possibly-material"
  | "immaterial"
  | "unknown";

export interface ContextMateriality {
  contextId: string;
  assessment: MaterialityAssessment;
  rationale: string;
  evidenceIds: string[];
  magnitudeKnown: boolean;
  directAccountingLinkKnown: boolean;
}

export function validateContextMateriality(
  item: ContextMateriality
): string[] {
  const findings: string[] = [];

  if (!item.rationale.trim()) {
    findings.push("Materiality assessment requires an explicit rationale.");
  }

  if (
    item.assessment === "material" &&
    item.evidenceIds.length === 0
  ) {
    findings.push(
      "A material classification requires supporting evidence."
    );
  }

  if (
    item.assessment === "material" &&
    !item.directAccountingLinkKnown
  ) {
    findings.push(
      "Context cannot be classified as material to the debt movement without a known accounting link."
    );
  }

  if (
    item.assessment === "possibly-material" &&
    item.evidenceIds.length === 0
  ) {
    findings.push(
      "Possibly-material context requires at least one supporting evidence record."
    );
  }

  return findings;
}

export function buildUnknownMateriality(
  context: ContextEvidence
): ContextMateriality {
  return {
    contextId: context.id,
    assessment: "unknown",
    rationale:
      "The event is documented as context, but its magnitude and accounting contribution have not been established.",
    evidenceIds: [context.id],
    magnitudeKnown: false,
    directAccountingLinkKnown: false
  };
}
