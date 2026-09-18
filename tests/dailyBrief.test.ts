import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTreasuryDebtRow } from "../src/fiscal/debt.js";
import { buildDailyAccountingBrief } from "../src/application/dailyBrief.js";

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

test("builds a ready daily brief from the two latest valid observations", () => {
  const result = buildDailyAccountingBrief([
    observation("2026-09-15", "90.00", "45.00", "135.00"),
    observation("2026-09-16", "100.00", "50.00", "150.00"),
    observation("2026-09-17", "110.00", "52.00", "162.00")
  ]);

  assert.equal(result.publicationStatus, "ready");
  assert.equal(result.explanation?.recordDate, "2026-09-17");
  assert.equal(result.explanation?.priorRecordDate, "2026-09-16");
});

test("returns insufficient-history when there is no prior valid observation", () => {
  const result = buildDailyAccountingBrief([
    observation("2026-09-17", "110.00", "52.00", "162.00")
  ]);

  assert.equal(result.publicationStatus, "insufficient-history");
  assert.equal(result.explanation, null);
});
