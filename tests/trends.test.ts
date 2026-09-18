import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTreasuryDebtRow } from "../src/fiscal/debt.js";
import {
  buildTrendSummary,
  deriveDebtChange,
  findPriorObservationAtOrBefore
} from "../src/fiscal/trends.js";

const retrievedAt = new Date("2026-09-18T12:00:00Z");

function observation(date: string, total: string) {
  return normalizeTreasuryDebtRow(
    {
      record_date: date,
      debt_held_public_amt: total,
      intragov_hold_amt: "0.00",
      tot_pub_debt_out_amt: total
    },
    retrievedAt
  );
}

test("derives absolute and percent debt changes with source lineage", () => {
  const prior = observation("2026-09-10", "100.00");
  const current = observation("2026-09-17", "110.00");

  const result = deriveDebtChange(current, prior);

  assert.equal(result.evidenceClass, "derived");
  assert.equal(result.absoluteChange, "10.00");
  assert.equal(result.percentChange, "10.0000%");
  assert.equal(result.intervalDays, 7);
  assert.equal(result.currentObservationId, current.id);
  assert.equal(result.priorObservationId, prior.id);
});

test("supports negative changes without floating-point currency math", () => {
  const prior = observation("2026-09-10", "100.00");
  const current = observation("2026-09-17", "95.50");

  const result = deriveDebtChange(current, prior);

  assert.equal(result.absoluteChange, "-4.50");
  assert.equal(result.percentChange, "-4.5000%");
});

test("selects the most recent valid observation at or before the target interval", () => {
  const latest = observation("2026-09-17", "110.00");
  const history = [
    latest,
    observation("2026-09-11", "105.00"),
    observation("2026-09-10", "100.00"),
    observation("2026-09-09", "99.00")
  ];

  assert.equal(
    findPriorObservationAtOrBefore(latest, history, 7)?.recordDate,
    "2026-09-10"
  );
});

test("builds previous, seven-day, and thirty-day summaries when data exists", () => {
  const latest = observation("2026-09-17", "130.00");
  const history = [
    latest,
    observation("2026-09-16", "129.00"),
    observation("2026-09-10", "120.00"),
    observation("2026-08-18", "100.00")
  ];

  const summary = buildTrendSummary(latest, history);

  assert.equal(summary.previous?.absoluteChange, "1.00");
  assert.equal(summary.sevenDay?.absoluteChange, "10.00");
  assert.equal(summary.thirtyDay?.absoluteChange, "30.00");
});
