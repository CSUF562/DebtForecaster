import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTreasuryDebtRow } from "../src/fiscal/debt.js";
import { InMemoryDebtObservationRepository } from "../src/storage/debtRepository.js";

const retrievedAt = new Date("2026-09-18T12:00:00Z");

function observation(date: string, publicAmount: string, intragov: string, total: string) {
  return normalizeTreasuryDebtRow(
    {
      record_date: date,
      debt_held_public_amt: publicAmount,
      intragov_hold_amt: intragov,
      tot_pub_debt_out_amt: total
    },
    retrievedAt
  );
}

test("deduplicates the same source version", async () => {
  const repo = new InMemoryDebtObservationRepository();
  const row = observation("2026-09-17", "10.00", "5.00", "15.00");

  assert.equal(await repo.save(row), "inserted");
  assert.equal(await repo.save(row), "duplicate");
  assert.equal((await repo.listByRecordDate("2026-09-17")).length, 1);
});

test("preserves revised source versions for the same record date", async () => {
  const repo = new InMemoryDebtObservationRepository();

  await repo.save(observation("2026-09-17", "10.00", "5.00", "15.00"));
  await repo.save(observation("2026-09-17", "11.00", "5.00", "16.00"));

  assert.equal((await repo.listByRecordDate("2026-09-17")).length, 2);
});
