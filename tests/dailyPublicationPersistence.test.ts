import assert from "node:assert/strict";
import test from "node:test";
import { hashDailyPublication } from "../src/storage/postgresDailyPublicationRepository";
import type { DailyAccountingBrief } from "../src/application/dailyBrief";

function brief(): DailyAccountingBrief {
  return {
    publicationId: "daily-brief-2026-09-17-abcdef123456",
    release: {
      commitSha: "abcdef1234567890",
      branch: "main",
      deploymentId: "dep-1",
      snapshotId: "snap-1",
      serviceName: "enclave-web",
      environmentName: "production",
      erc13ProtocolVersion: "1.0.0",
      productionTestGate: "npm-test-before-build"
    },
    latestObservationId: "current",
    priorObservationId: "prior",
    explanation: null,
    narrative: {
      version: "1.0.0",
      accounting: "Observed accounting movement.",
      context: null,
      unresolved: "Cause remains unresolved.",
      evidenceBoundary: "Accounting establishes what changed, not why."
    },
    unresolved: [],
    context: [],
    materiality: [],
    governance: null,
    publicationStatus: "publishable"
  };
}

test("daily publication hash is deterministic", () => {
  assert.equal(hashDailyPublication(brief()), hashDailyPublication(brief()));
});

test("daily publication hash changes when narrative changes", () => {
  const a = brief();
  const b = brief();
  b.narrative = { ...b.narrative!, unresolved: "Different unresolved wording." };

  assert.notEqual(hashDailyPublication(a), hashDailyPublication(b));
});
