import assert from "node:assert/strict";
import test from "node:test";
import { buildDailyAccountingBrief } from "../src/application/dailyBrief";
import type { DebtObservation } from "../src/fiscal/debt";

function observation(
  id: string,
  recordDate: string,
  total: string,
  publicDebt: string,
  intragov: string
): DebtObservation {
  return {
    id,
    recordDate,
    debtHeldByPublic: publicDebt,
    intragovernmentalHoldings: intragov,
    totalPublicDebtOutstanding: total,
    sourceLineNumber: "1",
    sourceUrl: "https://fiscaldata.treasury.gov/",
    retrievedAt: "2026-09-19T00:00:00Z",
    rawPayloadHash: "a".repeat(64),
    adapterVersion: "1.0.0",
    validationStatus: "pass",
    validationFindings: []
  };
}

test("daily brief carries a stable publication id and release provenance", () => {
  const prior = observation(
    "prior",
    "2026-09-16",
    "1000.00",
    "600.00",
    "400.00"
  );
  const current = observation(
    "current",
    "2026-09-17",
    "1100.00",
    "660.00",
    "440.00"
  );

  const brief = buildDailyAccountingBrief([prior, current], []);

  assert.ok(brief.publicationId);
  assert.match(brief.publicationId!, /^daily-brief-2026-09-17-/);
  assert.equal(brief.release.erc13ProtocolVersion, "1.0.0");
  assert.equal(brief.release.productionTestGate, "npm-test-before-build");
  assert.equal(
    brief.governance?.results.at(-1)?.gate,
    "G13-contestability-agency"
  );
});
