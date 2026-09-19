import assert from "node:assert/strict";
import test from "node:test";
import {
  validateCompetingExplanationSet,
  validateHypothesisCandidate,
  type HypothesisCandidate
} from "../src/epistemics/hypotheses.js";

function candidate(overrides: Partial<HypothesisCandidate> = {}): HypothesisCandidate {
  return {
    id: "hyp-1",
    questionId: "unk-cause-2026-09-17",
    statement:
      "A documented financing operation may have contributed to the observed debt movement.",
    causal: true,
    status: "candidate",
    confidence: "low",
    supportingEvidenceIds: [],
    counterEvidenceIds: [],
    assumptions: [
      "The timing of the financing operation overlaps the accounting interval."
    ],
    materiality: "unknown",
    materialityRationale:
      "Transaction-level attribution is not yet available.",
    disconfirmingEvidenceNeeded: [
      "Primary-source accounting evidence showing the operation did not contribute materially."
    ],
    ...overrides
  };
}

test("accepts a transparent low-confidence candidate hypothesis", () => {
  assert.deepEqual(validateHypothesisCandidate(candidate()), []);
});

test("requires support before medium confidence is allowed", () => {
  const result = validateHypothesisCandidate(
    candidate({ confidence: "medium", supportingEvidenceIds: [] })
  );

  assert.match(result.join(" "), /requires at least one supporting evidence/);
});

test("prevents a lone causal hypothesis from being declared preferred", () => {
  const result = validateCompetingExplanationSet({
    questionId: "unk-cause-2026-09-17",
    candidates: [candidate()],
    preferredHypothesisId: "hyp-1",
    preferenceRationale: "It seems plausible."
  });

  assert.match(result.join(" "), /explicit competing explanation/);
});

test("allows multiple hypotheses to remain unresolved without choosing a winner", () => {
  const result = validateCompetingExplanationSet({
    questionId: "unk-cause-2026-09-17",
    candidates: [
      candidate(),
      candidate({
        id: "hyp-2",
        statement:
          "Routine timing differences in federal receipts and outlays may explain part of the movement."
      })
    ],
    preferredHypothesisId: null,
    preferenceRationale: null
  });

  assert.deepEqual(result, []);
});
