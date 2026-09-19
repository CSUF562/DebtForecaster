import type { PersistedDailyPublication } from "../storage/postgresDailyPublicationRepository";

export interface PublicationComparison {
  leftPublicationId: string;
  rightPublicationId: string;
  sameRecordDate: boolean;
  changed: {
    contentHash: boolean;
    publicationStatus: boolean;
    accountingNarrative: boolean;
    contextNarrative: boolean;
    unresolvedNarrative: boolean;
    contextEvidenceSet: boolean;
    unresolvedSet: boolean;
    governance: boolean;
    releaseCommit: boolean;
    deployment: boolean;
    erc13Protocol: boolean;
  };
  details: string[];
}

function sameStringArray(a: string[], b: string[]): boolean {
  return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
}

export function comparePublications(
  left: PersistedDailyPublication,
  right: PersistedDailyPublication
): PublicationComparison {
  const changed = {
    contentHash: left.contentHash !== right.contentHash,
    publicationStatus: left.publicationStatus !== right.publicationStatus,
    accountingNarrative:
      left.narrative?.accounting !== right.narrative?.accounting,
    contextNarrative:
      left.narrative?.context !== right.narrative?.context,
    unresolvedNarrative:
      left.narrative?.unresolved !== right.narrative?.unresolved,
    contextEvidenceSet: !sameStringArray(left.contextIds, right.contextIds),
    unresolvedSet: !sameStringArray(left.unresolvedIds, right.unresolvedIds),
    governance:
      JSON.stringify(left.governance) !== JSON.stringify(right.governance),
    releaseCommit: left.release.commitSha !== right.release.commitSha,
    deployment: left.release.deploymentId !== right.release.deploymentId,
    erc13Protocol:
      left.release.erc13ProtocolVersion !== right.release.erc13ProtocolVersion
  };

  const details: string[] = [];

  if (changed.contentHash) details.push("Archived content hash differs.");
  if (changed.publicationStatus) details.push("Publication status differs.");
  if (changed.accountingNarrative) details.push("Accounting narrative differs.");
  if (changed.contextNarrative) details.push("Context narrative differs.");
  if (changed.unresolvedNarrative) details.push("Unresolved-knowledge narrative differs.");
  if (changed.contextEvidenceSet) details.push("Referenced context evidence set differs.");
  if (changed.unresolvedSet) details.push("Referenced unresolved-knowledge set differs.");
  if (changed.governance) details.push("ERC13 governance assessment differs.");
  if (changed.releaseCommit) details.push("Software commit differs.");
  if (changed.deployment) details.push("Railway deployment differs.");
  if (changed.erc13Protocol) details.push("ERC13 protocol version differs.");

  if (details.length === 0) {
    details.push("No tracked publication fields differ.");
  }

  return {
    leftPublicationId: left.publicationId,
    rightPublicationId: right.publicationId,
    sameRecordDate: left.recordDate === right.recordDate,
    changed,
    details
  };
}
