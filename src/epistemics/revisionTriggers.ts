export type RevisionTriggerType =
  | "source-revision"
  | "new-primary-evidence"
  | "counterevidence"
  | "model-version-change"
  | "materiality-change"
  | "manual-editorial-review";

export interface RevisionTrigger {
  id: string;
  targetId: string;
  triggerType: RevisionTriggerType;
  evidenceIds: string[];
  detectedAt: string;
  requiresReassessment: boolean;
  rationale: string;
}

export function validateRevisionTrigger(
  trigger: RevisionTrigger
): string[] {
  const findings: string[] = [];

  if (!trigger.targetId.trim()) {
    findings.push("Revision trigger must identify the target record.");
  }

  if (!trigger.rationale.trim()) {
    findings.push("Revision trigger must explain why reassessment is or is not required.");
  }

  if (
    trigger.triggerType !== "manual-editorial-review" &&
    trigger.evidenceIds.length === 0
  ) {
    findings.push(
      "Non-manual revision triggers must reference the evidence that triggered reassessment."
    );
  }

  if (
    [
      "source-revision",
      "new-primary-evidence",
      "counterevidence",
      "model-version-change",
      "materiality-change"
    ].includes(trigger.triggerType) &&
    !trigger.requiresReassessment
  ) {
    findings.push(
      "Evidence-changing triggers must require reassessment."
    );
  }

  return findings;
}
