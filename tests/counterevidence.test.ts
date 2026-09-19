import assert from "node:assert/strict";
import test from "node:test";
import { validateCounterevidenceReview } from "../src/epistemics/counterevidence.js";

test("requires an actual search for counterevidence", () => {
  const findings = validateCounterevidenceReview({
    questionId: "q1",
    hypothesisId: "h1",
    searched: false,
    searchScope: [],
    counterEvidenceIds: [],
    noCounterevidenceFoundRationale: null,
    reviewedAt: "2026-09-18T22:00:00Z"
  });

  assert.match(findings.join(" "), /must be performed/);
});

test("requires a rationale when no counterevidence is found", () => {
  const findings = validateCounterevidenceReview({
    questionId: "q1",
    hypothesisId: "h1",
    searched: true,
    searchScope: ["Treasury", "CBO"],
    counterEvidenceIds: [],
    noCounterevidenceFoundRationale: null,
    reviewedAt: "2026-09-18T22:00:00Z"
  });

  assert.match(findings.join(" "), /must document why/);
});

test("accepts a documented counterevidence search", () => {
  const findings = validateCounterevidenceReview({
    questionId: "q1",
    hypothesisId: "h1",
    searched: true,
    searchScope: ["Treasury", "CBO", "Federal Reserve"],
    counterEvidenceIds: ["counter-1"],
    noCounterevidenceFoundRationale: null,
    reviewedAt: "2026-09-18T22:00:00Z"
  });

  assert.deepEqual(findings, []);
});
