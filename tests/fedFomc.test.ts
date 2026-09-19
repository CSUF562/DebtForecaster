import assert from "node:assert/strict";
import test from "node:test";
import { fetchFedFomcContext } from "../src/context/fedFomc";

const INDEX = `
<html><body>
<a href="/newsevents/pressreleases/monetary20260729a.htm">Federal Reserve issues FOMC statement</a>
<a href="/newsevents/pressreleases/monetary20260916a.htm">Federal Reserve issues FOMC statement</a>
</body></html>`;

const STATEMENT = `
<html><body>
<h3>Federal Reserve issues FOMC statement</h3>
<p>September 16, 2026</p>
<p>The Committee decided to raise the target range for the federal funds rate by 1/4 percentage point to 3-3/4 to 4 percent.</p>
<p>Economic activity is expanding at a solid pace.</p>
<p>Inflation remains elevated.</p>
</body></html>`;

test("selects latest FOMC statement on or before debt date", async () => {
  const calls: string[] = [];
  const context = await fetchFedFomcContext({
    asOfDate: "2026-09-17",
    retrievedAt: new Date("2026-09-19T08:30:00Z"),
    fetchImpl: async input => {
      const url = String(input);
      calls.push(url);
      return url.includes("2026-press-fomc")
        ? new Response(INDEX, { status: 200 })
        : new Response(STATEMENT, { status: 200 });
    }
  });

  assert.ok(context);
  assert.equal(context.eventDate, "2026-09-16");
  assert.equal(context.causalClaim, false);
  assert.match(context.sourceUrl, /monetary20260916a\.htm/);
  assert.equal(calls.length, 2);
});

test("does not use a future FOMC statement", async () => {
  const context = await fetchFedFomcContext({
    asOfDate: "2026-08-01",
    fetchImpl: async input =>
      String(input).includes("2026-press-fomc")
        ? new Response(INDEX, { status: 200 })
        : new Response(STATEMENT, { status: 200 })
  });

  assert.ok(context);
  assert.equal(context.eventDate, "2026-07-29");
});

test("returns null when no applicable statement exists", async () => {
  const context = await fetchFedFomcContext({
    asOfDate: "2026-01-01",
    fetchImpl: async () => new Response(INDEX, { status: 200 })
  });

  assert.equal(context, null);
});
