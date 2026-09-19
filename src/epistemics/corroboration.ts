export interface EvidenceDependency {
  evidenceId: string;
  originId: string;
  publisherId: string;
  derivedFromEvidenceIds: string[];
}

export interface CorroborationSet {
  claimId: string;
  evidence: EvidenceDependency[];
  requiredIndependentOrigins: number;
}

function independentOrigins(evidence: EvidenceDependency[]): Set<string> {
  const origins = new Set<string>();

  for (const item of evidence) {
    origins.add(item.originId);
  }

  return origins;
}

export function validateCorroborationSet(
  set: CorroborationSet
): string[] {
  const findings: string[] = [];

  if (set.requiredIndependentOrigins < 1) {
    findings.push("Required independent origin count must be at least one.");
  }

  const origins = independentOrigins(set.evidence);

  if (origins.size < set.requiredIndependentOrigins) {
    findings.push(
      `Claim ${set.claimId} has ${origins.size} independent origin(s), but requires ${set.requiredIndependentOrigins}.`
    );
  }

  const ids = new Set(set.evidence.map(item => item.evidenceId));

  for (const item of set.evidence) {
    for (const dependency of item.derivedFromEvidenceIds) {
      if (!ids.has(dependency)) continue;

      const parent = set.evidence.find(row => row.evidenceId === dependency);

      if (parent && parent.originId === item.originId) {
        findings.push(
          `${item.evidenceId} is not independent corroboration of ${dependency}; both trace to origin ${item.originId}.`
        );
      }
    }
  }

  return findings;
}
