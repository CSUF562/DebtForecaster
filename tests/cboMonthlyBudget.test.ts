import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchCboMonthlyBudgetContext,
  parseCboMonthlyBudgetReviewHtml
} from "../src/context/cboMonthlyBudget";

const HTML = `
<html><body>
<article>
  <a href="/publication/61984">Monthly Budget Review: August 2026</a>
  <time>September 9, 2026</time>
  <p>The federal budget deficit totaled $2.0 trillion in the first 11 months of fiscal year 2026, the CBO estimates. That amount is $6 billion less than the deficit recorded during the same period last fiscal year.</p>
</article>
</body></html>`;

test("parses CBO monthly budget context", () => {
  const result = parseCboMonthlyBudgetReviewHtml(HTML, "2026-09-17");
  assert.ok(result);
  assert.equal(result.eventDate, "2026-09-09");
  assert.match(result.sourceUrl, /61984/);
});

test("builds noncausal CBO context evidence", async () => {
  const result = await fetchCboMonthlyBudgetContext({
    asOfDate: "2026-09-17",
    retrievedAt: new Date("2026-09-19T08:15:00Z"),
    fetchImpl: async () => new Response(HTML, { status: 200 })
  });
  assert.ok(result);
  assert.equal(result.sourceName, "Congressional Budget Office");
  assert.equal(result.causalClaim, false);
});

test("returns null when no applicable CBO review is found", async () => {
  const result = await fetchCboMonthlyBudgetContext({
    asOfDate: "2026-09-01",
    fetchImpl: async () => new Response(HTML, { status: 200 })
  });
  assert.equal(result, null);
});
