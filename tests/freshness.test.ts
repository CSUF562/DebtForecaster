import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTreasuryDebtRow } from "../src/fiscal/debt.js";
import {
  assessDebtFreshness,
  businessDaysBetween
} from "../src/fiscal/freshness.js";

function observation(date: string) {
  return normalizeTreasuryDebtRow(
    {
      record_date: date,
      debt_held_public_amt: "10.00",
      intragov_hold_amt: "5.00",
      tot_pub_debt_out_amt: "15.00"
    },
    new Date("2026-09-18T12:00:00Z")
  );
}

test("weekends do not count as business-day staleness", () => {
  assert.equal(businessDaysBetween("2026-09-18", "2026-09-21"), 1);
});

test("marks an observation within one business day as current", () => {
  const result = assessDebtFreshness(
    observation("2026-09-17"),
    new Date("2026-09-18T18:00:00Z")
  );

  assert.equal(result.status, "current");
  assert.equal(result.businessDaysOld, 1);
});

test("marks two business days as delayed rather than silently current", () => {
  const result = assessDebtFreshness(
    observation("2026-09-16"),
    new Date("2026-09-18T18:00:00Z")
  );

  assert.equal(result.status, "delayed");
});

test("marks data older than two business days as stale", () => {
  const result = assessDebtFreshness(
    observation("2026-09-15"),
    new Date("2026-09-18T18:00:00Z")
  );

  assert.equal(result.status, "stale");
});
