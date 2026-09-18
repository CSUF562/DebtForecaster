import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTreasuryDebtRow } from "../src/fiscal/debt.js";
import { buildDailyAccountingBrief } from "../src/application/dailyBrief.js";
import type { ContextEvidence } from "../src/context/contextEvidence.js";

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

function validContext(): ContextEvidence {
  return {
    id: "ctx-1",
    eventDate: "2026-09-17",
    title: "Example context",
    summary: "Documented contextual event.",
    sourceName: "Congressional Budget Office",
    sourceUrl: "https://www.cbo.gov/example",
    sourceTier: "primary-government",
    retrievedAt: "2026-09-18T20:00:00Z",
    confidence: "high",
    revisionOfId: null,
    supersededById: null,
    causalClaim: false,
    uncertaintyNote:
      "Relevant context, but not independently sufficient to establish causation."
  };
}

test("builds a publishable daily brief with structured unresolved causation", () => {
  const result = buildDailyAccountingBrief(
    [
      observation("2026-09-15", "90.00", "45.00", "135.00"),
      observation("2026-09-16", "100.00", "50.00", "150.00"),
      observation("2026-09-17", "110.00", "52.00", "162.00")
    ],
    [validContext()]
  );

  assert.equal(result.publicationStatus, "publishable");
  assert.equal(result.governance?.publishable, true);
  assert.equal(result.unresolved.length, 1);
  assert.equal(result.unresolved[0].reason, "causation-unresolved");
  assert.equal(result.unresolved[0].resolvable, true);
  assert.ok(result.unresolved[0].resolutionCriteria.length > 0);
});

test("returns insufficient-history when there is no prior valid observation", () => {
  const result = buildDailyAccountingBrief([
    observation("2026-09-17", "110.00", "52.00", "162.00")
  ]);

  assert.equal(result.publicationStatus, "insufficient-history");
  assert.equal(result.explanation, null);
  assert.equal(result.unresolved.length, 0);
  assert.equal(result.governance, null);
});

test("blocks a brief when contextual evidence fails ERC13", () => {
  const badContext: ContextEvidence = {
    ...validContext(),
    sourceUrl: "https://example.com/opinion",
    sourceTier: "other",
    confidence: "high"
  };

  const result = buildDailyAccountingBrief(
    [
      observation("2026-09-16", "100.00", "50.00", "150.00"),
      observation("2026-09-17", "110.00", "52.00", "162.00")
    ],
    [badContext]
  );

  assert.equal(result.publicationStatus, "blocked");
  assert.equal(result.governance?.publishable, false);
});
