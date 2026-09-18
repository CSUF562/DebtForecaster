import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTreasuryDebtRow } from "../src/fiscal/debt.js";
import { buildDebtSnapshotFromHistory } from "../src/application/debtSnapshot.js";

function observation(date: string, total: string) {
  return normalizeTreasuryDebtRow(
    {
      record_date: date,
      debt_held_public_amt: total,
      intragov_hold_amt: "0.00",
      tot_pub_debt_out_amt: total
    },
    new Date("2026-09-18T12:00:00Z")
  );
}

test("builds a dashboard-ready snapshot with freshness and lineage-preserving trends", () => {
  const now = new Date("2026-09-18T18:00:00Z");
  const history = [
    observation("2026-09-17", "130.00"),
    observation("2026-09-16", "129.00"),
    observation("2026-09-10", "120.00"),
    observation("2026-08-18", "100.00")
  ];

  const snapshot = buildDebtSnapshotFromHistory(history, now);

  assert.equal(snapshot.latest?.recordDate, "2026-09-17");
  assert.equal(snapshot.freshness?.status, "current");
  assert.equal(snapshot.trends.previous?.absoluteChange, "1.00");
  assert.equal(snapshot.trends.sevenDay?.absoluteChange, "10.00");
  assert.equal(snapshot.trends.thirtyDay?.absoluteChange, "30.00");
  assert.equal(snapshot.publication.canPresentAsCurrent, true);
});

test("blocks stale observations from being presented as current", () => {
  const snapshot = buildDebtSnapshotFromHistory(
    [observation("2026-09-14", "130.00")],
    new Date("2026-09-18T18:00:00Z")
  );

  assert.equal(snapshot.freshness?.status, "stale");
  assert.equal(snapshot.publication.canPresentAsCurrent, false);
});
