export interface ContestabilityRecord {
  outputId: string;
  evidenceInspectable: boolean;
  assumptionsInspectable: boolean;
  unresolvedVisible: boolean;
  revisionPathVisible: boolean;
  challengePathVisible: boolean;
  automatedDecisionBinding: boolean;
  humanOverrideAvailable: boolean;
  notes: string;
}

export function validateContestability(
  record: ContestabilityRecord
): string[] {
  const findings: string[] = [];

  if (!record.evidenceInspectable) {
    findings.push("Published output must expose inspectable evidence lineage.");
  }

  if (!record.assumptionsInspectable) {
    findings.push("Published output must expose material assumptions.");
  }

  if (!record.unresolvedVisible) {
    findings.push("Published output must keep unresolved knowledge visible.");
  }

  if (!record.revisionPathVisible) {
    findings.push("Published output must expose how revisions are handled.");
  }

  if (!record.challengePathVisible) {
    findings.push("Published output must preserve a visible path to challenge or contest the conclusion.");
  }

  if (record.automatedDecisionBinding && !record.humanOverrideAvailable) {
    findings.push(
      "Binding automated decisions require a meaningful human override or review path."
    );
  }

  if (!record.notes.trim()) {
    findings.push("Contestability review must include implementation notes.");
  }

  return findings;
}
