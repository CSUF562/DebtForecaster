import assert from "node:assert/strict";
import test from "node:test";
import {
  createCausationUnresolved,
  validateUnresolvedKnowledge,
  type UnresolvedKnowledge
} from "../src/epistemics/unresolvedKnowledge.js";

test("accepts a causation-unresolved record with explicit resolution criteria", () => {
  const item = createCausationUnresolved({
    id: "unk-1",
    question: "Why did total public debt increase on this record date?",
    currentState:
      "Treasury accounting establishes the change, but the available context does not establish a causal explanation.",
    relatedObservationIds: ["obs-1", "obs-2"],
    relatedContextIds: ["ctx-1"],
    createdAt: "2026-09-18T21:00:00Z",
    resolutionCriteria: [
      "Primary-source documentation directly linking the accounting movement to a specific transaction class or policy event."
    ]
  });

  assert.deepEqual(validateUnresolvedKnowledge(item), []);
});

test("requires missing evidence details for insufficient-evidence records", () => {
  const item: UnresolvedKnowledge = {
    id: "unk-2",
    reason: "insufficient-evidence",
    question: "What explains the change?",
    currentState: "Evidence is incomplete.",
    missingEvidence: [],
    conflictingEvidenceIds: [],
    relatedObservationIds: [],
    relatedContextIds: [],
    resolvable: true,
    resolutionCriteria: ["Acquire transaction-level evidence."],
    createdAt: "2026-09-18T21:00:00Z",
    revisedAt: null
  };

  assert.match(
    validateUnresolvedKnowledge(item).join(" "),
    /missing evidence requirement/
  );
});

test("requires at least two conflicting records for conflicting-evidence unknowns", () => {
  const item: UnresolvedKnowledge = {
    id: "unk-3",
    reason: "conflicting-evidence",
    question: "Which interpretation is supported?",
    currentState: "Available evidence conflicts.",
    missingEvidence: [],
    conflictingEvidenceIds: ["ctx-1"],
    relatedObservationIds: [],
    relatedContextIds: ["ctx-1"],
    resolvable: true,
    resolutionCriteria: ["Obtain a corroborating primary source."],
    createdAt: "2026-09-18T21:00:00Z",
    revisedAt: null
  };

  assert.match(
    validateUnresolvedKnowledge(item).join(" "),
    /at least two conflicting evidence records/
  );
});
