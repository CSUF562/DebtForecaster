import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTreasuryDebtRow } from "../src/fiscal/debt.js";
import { explainAccountingChange } from "../src/explanations/whatChanged.js";
import { assessDailyExplanation } from "../src/governance/erc13.js";

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

test("passes a properly sourced and classified accounting explanation", () => {
  const explanation = explainAccountingChange(
    observation("2026-09-17", "110.00", "52.00", "162.00"),
    observation("2026-09-16", "100.00", "50.00", "150.00")
  );

  const result = assessDailyExplanation(explanation);

  assert.equal(result.publishable, true);
  assert.equal(result.results.every(gate => gate.status === "pass"), true);
});

test("fails when an observed claim is incorrectly marked causal", () => {
  const explanation = explainAccountingChange(
    observation("2026-09-17", "110.00", "52.00", "162.00"),
    observation("2026-09-16", "100.00", "50.00", "150.00")
  );

  explanation.claims[0] = {
    ...explanation.claims[0],
    causal: true
  };

  const result = assessDailyExplanation(explanation);

  assert.equal(result.publishable, false);
  assert.equal(
    result.results.find(item => item.gate === "G3-causality")?.status,
    "fail"
  );
});

test("fails when a claim loses source lineage", () => {
  const explanation = explainAccountingChange(
    observation("2026-09-17", "110.00", "52.00", "162.00"),
    observation("2026-09-16", "100.00", "50.00", "150.00")
  );

  explanation.claims[1] = {
    ...explanation.claims[1],
    sourceObservationIds: []
  };

  const result = assessDailyExplanation(explanation);

  assert.equal(result.publishable, false);
  assert.equal(
    result.results.find(item => item.gate === "G1-source")?.status,
    "fail"
  );
});
