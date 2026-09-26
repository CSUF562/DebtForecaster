import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchTreasuryCapitalFlowsContext,
  parseTicRelease,
  parseTicReleaseListing
} from "../src/context/treasuryCapitalFlows";

const LISTING = `
  <div class="release"><time>September 16, 2026</time>
    <a href="/news/press-releases/sb0631">Treasury International Capital Data for July 2026</a>
  </div>
  <div class="release"><time>August 17, 2026</time>
    <a href="/news/press-releases/sb0601">Treasury International Capital Data for June 2026</a>
  </div>`;

const RELEASE = `
  <main>
    <p>The sum total in July was a net TIC inflow of $83.7 billion. Of this,
    net foreign private inflows were $73.5 billion, and net foreign official inflows were $10.2 billion.</p>
    <p>After including adjustments, overall net foreign sales of long-term securities
    are estimated to have been $27.9 billion in July.</p>
    <p>Foreign residents increased their holdings of U.S. Treasury bills by $38.8 billion.</p>
  </main>`;

test("selects the latest TIC release on or before the debt date", () => {
  const release = parseTicReleaseListing(LISTING, "2026-09-20");

  assert.ok(release);
  assert.equal(release.eventDate, "2026-09-16");
  assert.equal(release.sourceUrl, "https://home.treasury.gov/news/press-releases/sb0631");
});

test("separates maturity and investor-class flows", () => {
  const flow = parseTicRelease(RELEASE);

  assert.equal(flow.totalFlow, "+$83.7 billion");
  assert.equal(flow.privateFlow, "+$73.5 billion");
  assert.equal(flow.officialFlow, "+$10.2 billion");
  assert.equal(flow.longTermFlow, "-$27.9 billion");
  assert.equal(flow.treasuryBillFlow, "+$38.8 billion");
});

test("publishes TIC only as contextual, non-causal evidence", async () => {
  const context = await fetchTreasuryCapitalFlowsContext({
    asOfDate: "2026-09-20",
    retrievedAt: new Date("2026-09-21T12:00:00Z"),
    fetchImpl: async input => {
      const url = String(input);
      return new Response(url.includes("press-releases/sb0631") ? RELEASE : LISTING, {
        status: 200,
        headers: { "Content-Type": "text/html" }
      });
    }
  });

  assert.ok(context);
  assert.equal(context.causalClaim, false);
  assert.match(context.summary, /Treasury-bill holdings change \+\$38\.8 billion/);
  assert.match(context.summary, /private flow \+\$73\.5 billion/);
  assert.match(context.summary, /official flow \+\$10\.2 billion/);
  assert.match(context.uncertaintyNote, /does not establish/);
});

test("returns null when no TIC release is applicable", async () => {
  const context = await fetchTreasuryCapitalFlowsContext({
    asOfDate: "2026-08-01",
    fetchImpl: async () => new Response(LISTING, { status: 200 })
  });

  assert.equal(context, null);
});
