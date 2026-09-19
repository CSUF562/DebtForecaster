import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTreasuryDebtRow } from "../src/fiscal/debt.js";
import { explainAccountingChange } from "../src/explanations/whatChanged.js";
import { assessDailyExplanation } from "../src/governance/erc13.js";
import type { ContextEvidence } from "../src/context/contextEvidence.js";
import type { ContestabilityRecord } from "../src/epistemics/contestability.js";

function observation(
  date: string,
  publicAmt: string,
  intragovAmt: string,
  totalAmt: string
) {
  return normalizeTreasuryDebtRow(
    {
      record_date: date,
      debt_held_public_amt: publicAmt,
      intragov_hold_amt: intragovAmt,
      tot_pub_debt_out_amt: totalAmt
    },
    new Date("2026-09-18T12:00:00Z")
  );
}

function explanation() {
  return explainAccountingChange(
    observation("2026-09-17", "110.00", "52.00", "162.00"),
    observation("2026-09-16", "100.00", "50.00", "150.00")
  );
}

function context(): ContextEvidence {
  return {
    id: "ctx-1",
    eventDate: "2026-09-17",
    title: "Example event",
    summary: "Documented contextual event.",
    sourceName: "U.S. Department of the Treasury",
    sourceUrl: "https://home.treasury.gov/example",
    sourceTier: "primary-government",
    retrievedAt: "2026-09-18T20:00:00Z",
    confidence: "high",
    revisionOfId: null,
    supersededById: null,
    causalClaim: false,
    uncertaintyNote:
      "Chronologically relevant, but not independently sufficient to establish causation."
  };
}

function contestability(): ContestabilityRecord {
  return {
    outputId: "daily-brief-test",
    evidenceInspectable: true,
    assumptionsInspectable: true,
    unresolvedVisible: true,
    revisionPathVisible: true,
    challengePathVisible: true,
    automatedDecisionBinding: false,
    humanOverrideAvailable: true,
    notes:
      "Test output exposes evidence, assumptions, unresolved knowledge, revision handling, and a challenge path."
  };
}

test("passes applicable gates and marks unused conditional gates not-applicable", () => {
  const result = assessDailyExplanation(
    explanation(),
    [context()],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [contestability()]
  );

  assert.equal(result.publishable, true);
  assert.equal(result.results.some(gate => gate.status === "fail"), false);
  assert.equal(
    result.results.find(gate => gate.gate === "G7-competing-explanations")?.status,
    "not-applicable"
  );
  assert.equal(
    result.results.find(gate => gate.gate === "G13-contestability-agency")?.status,
    "pass"
  );
});

test("fails publication when no contestability record is supplied", () => {
  const result = assessDailyExplanation(explanation(), [context()]);

  assert.equal(result.publishable, false);
  assert.equal(
    result.results.find(gate => gate.gate === "G13-contestability-agency")?.status,
    "fail"
  );
});

test("fails when an observed claim is incorrectly marked causal", () => {
  const value = explanation();
  value.claims[0] = { ...value.claims[0], causal: true };

  const result = assessDailyExplanation(
    value,
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [contestability()]
  );

  assert.equal(result.publishable, false);
  assert.equal(
    result.results.find(item => item.gate === "G3-causality")?.status,
    "fail"
  );
});

test("fails when a claim loses source lineage", () => {
  const value = explanation();
  value.claims[1] = { ...value.claims[1], sourceObservationIds: [] };

  const result = assessDailyExplanation(
    value,
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [contestability()]
  );

  assert.equal(result.publishable, false);
  assert.equal(
    result.results.find(item => item.gate === "G1-source")?.status,
    "fail"
  );
});

test("fails G4 when a low-tier source is assigned high confidence", () => {
  const item = { ...context(), sourceTier: "other" as const, confidence: "high" as const };
  const result = assessDailyExplanation(
    explanation(),
    [item],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [contestability()]
  );

  assert.equal(
    result.results.find(gate => gate.gate === "G4-source-quality")?.status,
    "fail"
  );
});

test("fails G5 when contextual evidence omits uncertainty", () => {
  const item = { ...context(), uncertaintyNote: "" };
  const result = assessDailyExplanation(
    explanation(),
    [item],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [contestability()]
  );

  assert.equal(
    result.results.find(gate => gate.gate === "G5-uncertainty-revision")?.status,
    "fail"
  );
});
