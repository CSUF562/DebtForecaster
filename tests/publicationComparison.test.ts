import assert from "node:assert/strict";
import test from "node:test";
import { comparePublications } from "../src/application/publicationComparison";
import type { PersistedDailyPublication } from "../src/storage/postgresDailyPublicationRepository";

function publication(id: string): PersistedDailyPublication {
  return {
    publicationId: id,
    recordDate: "2026-09-17",
    publicationStatus: "publishable",
    latestObservationId: "current",
    priorObservationId: "prior",
    contextIds: ["ctx-1"],
    unresolvedIds: ["unk-1"],
    narrative: {
      version: "1.0.0",
      accounting: "Accounting.",
      context: "Context.",
      unresolved: "Unresolved.",
      evidenceBoundary: "Boundary."
    },
    governance: null,
    release: {
      commitSha: "abc",
      branch: "main",
      deploymentId: "dep-1",
      snapshotId: "snap-1",
      serviceName: "enclave-web",
      environmentName: "production",
      erc13ProtocolVersion: "1.0.0",
      productionTestGate: "npm-test-before-build"
    },
    contentHash: "a".repeat(64),
    createdAt: "2026-09-19T09:00:00Z"
  };
}

test("publication comparison reports no tracked differences for equal records", () => {
  const a = publication("a");
  const b = { ...publication("b"), publicationId: "b" };

  const result = comparePublications(a, b);

  assert.deepEqual(result.details, ["No tracked publication fields differ."]);
  assert.equal(result.sameRecordDate, true);
});

test("publication comparison identifies narrative and release changes", () => {
  const a = publication("a");
  const b = publication("b");
  b.narrative = { ...b.narrative!, context: "Changed context." };
  b.release = { ...b.release, commitSha: "def", deploymentId: "dep-2" };
  b.contentHash = "b".repeat(64);

  const result = comparePublications(a, b);

  assert.equal(result.changed.contextNarrative, true);
  assert.equal(result.changed.releaseCommit, true);
  assert.equal(result.changed.deployment, true);
  assert.equal(result.changed.contentHash, true);
});
