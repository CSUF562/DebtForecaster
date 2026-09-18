import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTreasuryDebtRow } from "../src/fiscal/debt.js";
import { explainAccountingChange } from "../src/explanations/whatChanged.js";

const retrievedAt = new Date("2026-09-18T12:00:00Z");

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
    retrievedAt
  );
}

test("produces an accounting-first explanation with observed and derived claims", () => {
  const prior = observation("2026-09-16", "100.00", "50.00", "150.00");
  const current = observation("2026-09-17", "110.00", "52.00", "162.00");

  const result = explainAccountingChange(current, prior);

  assert.equal(result.publicDebtChange, "+$10.00");
  assert.equal(result.intragovernmentalChange, "+$2.00");
  assert.equal(result.totalDebtChange.absoluteChange, "12.00");
  assert.equal(result.claims[0].evidenceClass, "observed");
  assert.equal(result.claims[3].evidenceClass, "derived");
  assert.equal(result.claims.every(claim => claim.causal === false), true);
});

test("supports decreases without implying causation", () => {
  const prior = observation("2026-09-16", "100.00", "50.00", "150.00");
  const current = observation("2026-09-17", "95.00", "48.00", "143.00");

  const result = explainAccountingChange(current, prior);

  assert.match(result.claims[0].text, /decreased/);
  assert.match(result.evidenceBoundary, /do not, by themselves, establish why/);
});

test("rejects component deltas that do not reconcile to total delta", () => {
  const prior = observation("2026-09-16", "100.00", "50.00", "150.00");
  const current = {
    ...observation("2026-09-17", "110.00", "52.00", "162.00"),
    totalPublicDebtOutstanding: "170.00"
  };

  assert.throws(
    () => explainAccountingChange(current, prior),
    /Component changes do not reconcile/
  );
});
