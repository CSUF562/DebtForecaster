import assert from "node:assert/strict";
import test from "node:test";
import { validateContextEvidence, type ContextEvidence } from "../src/context/contextEvidence.js";

function base(): ContextEvidence {
  return {
    id: "ctx-1",
    eventDate: "2026-09-18",
    title: "Example fiscal event",
    summary: "Example contextual event.",
    sourceName: "U.S. Department of the Treasury",
    sourceUrl: "https://home.treasury.gov/example",
    sourceTier: "primary-government",
    retrievedAt: "2026-09-18T20:00:00Z",
    confidence: "high",
    revisionOfId: null,
    supersededById: null,
    causalClaim: false,
    uncertaintyNote:
      "Relevant in time, but this record alone does not establish a causal relationship to daily debt movement."
  };
}

test("accepts sourced contextual evidence with an uncertainty boundary", () => {
  assert.deepEqual(validateContextEvidence(base()), []);
});

test("rejects causal attribution at context ingestion time", () => {
  const evidence = { ...base(), causalClaim: true };
  assert.match(validateContextEvidence(evidence).join(" "), /may not assert causation/);
});

test("requires an uncertainty note", () => {
  const evidence = { ...base(), uncertaintyNote: "" };
  assert.match(validateContextEvidence(evidence).join(" "), /uncertainty note/);
});
