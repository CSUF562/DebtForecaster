import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchTreasuryYieldCurveContext,
  parseTreasuryYieldCurveXml
} from "../src/context/treasuryYieldCurve";

const XML = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices">
  <entry>
    <content>
      <m:properties xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata">
        <d:NEW_DATE m:type="Edm.DateTime">2026-09-16T00:00:00</d:NEW_DATE>
        <d:BC_2YEAR m:type="Edm.Double">3.72</d:BC_2YEAR>
        <d:BC_10YEAR m:type="Edm.Double">4.18</d:BC_10YEAR>
        <d:BC_30YEAR m:type="Edm.Double">4.79</d:BC_30YEAR>
      </m:properties>
    </content>
  </entry>
  <entry>
    <content>
      <m:properties xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata">
        <d:NEW_DATE m:type="Edm.DateTime">2026-09-17T00:00:00</d:NEW_DATE>
        <d:BC_2YEAR m:type="Edm.Double">3.75</d:BC_2YEAR>
        <d:BC_10YEAR m:type="Edm.Double">4.21</d:BC_10YEAR>
        <d:BC_30YEAR m:type="Edm.Double">4.82</d:BC_30YEAR>
      </m:properties>
    </content>
  </entry>
</feed>`;

test("parses Treasury yield-curve XML into dated observations", () => {
  const rows = parseTreasuryYieldCurveXml(XML);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].eventDate, "2026-09-17");
  assert.equal(rows[0].tenYear, "4.21");
});

test("selects the latest Treasury context record on or before the debt date", async () => {
  const context = await fetchTreasuryYieldCurveContext({
    asOfDate: "2026-09-17",
    retrievedAt: new Date("2026-09-19T08:00:00Z"),
    fetchImpl: async () =>
      new Response(XML, {
        status: 200,
        headers: { "Content-Type": "application/xml" }
      })
  });

  assert.ok(context);
  assert.equal(context.eventDate, "2026-09-17");
  assert.equal(context.causalClaim, false);
  assert.match(context.summary, /10-year 4\.21%/);
  assert.match(context.sourceUrl, /field_tdr_date_value_month=202609/);
});

test("returns null when the feed has no record on or before the debt date", async () => {
  const context = await fetchTreasuryYieldCurveContext({
    asOfDate: "2026-09-15",
    fetchImpl: async () => new Response(XML, { status: 200 })
  });

  assert.equal(context, null);
});

test("throws on a failed Treasury feed response", async () => {
  await assert.rejects(
    () =>
      fetchTreasuryYieldCurveContext({
        asOfDate: "2026-09-17",
        fetchImpl: async () => new Response("unavailable", { status: 503 })
      }),
    /HTTP 503/
  );
});
