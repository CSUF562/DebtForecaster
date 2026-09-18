import assert from "node:assert/strict";
import test from "node:test";
import fixture from "./fixtures/debt-to-penny.json" with { type: "json" };
import {
  buildDebtToPennyUrl,
  fetchRecentDebtObservations,
  normalizeTreasuryDebtRow,
  reconcileObservations,
  selectLatestPublishableObservation,
  type TreasuryDebtRow
} from "../src/fiscal/debt.js";

const retrievedAt = new Date("2026-09-18T12:00:00Z");

test("normalizes a valid Treasury row and passes the accounting identity", () => {
  const row = fixture.data[0] as TreasuryDebtRow;
  const result = normalizeTreasuryDebtRow(row, retrievedAt);

  assert.equal(result.recordDate, "2026-09-17");
  assert.equal(result.validationStatus, "pass");
  assert.equal(result.totalPublicDebtOutstanding, "38000000000000.00");
  assert.equal(result.retrievedAt, "2026-09-18T12:00:00.000Z");
  assert.match(result.rawPayloadHash, /^[a-f0-9]{64}$/);
});

test("fails an observation when the accounting identity does not reconcile", () => {
  const result = normalizeTreasuryDebtRow(
    {
      record_date: "2026-09-17",
      debt_held_public_amt: "10.00",
      intragov_hold_amt: "5.00",
      tot_pub_debt_out_amt: "20.00"
    },
    retrievedAt
  );

  assert.equal(result.validationStatus, "fail");
  assert.match(result.validationNotes.join(" "), /Accounting identity failed/);
});

test("fails malformed currency without converting through floating point", () => {
  const result = normalizeTreasuryDebtRow(
    {
      record_date: "2026-09-17",
      debt_held_public_amt: "10.001",
      intragov_hold_amt: "5.00",
      tot_pub_debt_out_amt: "15.00"
    },
    retrievedAt
  );

  assert.equal(result.validationStatus, "fail");
  assert.match(result.validationNotes.join(" "), /Invalid non-negative currency value/);
});

test("keeps source revisions for the same record date while deduplicating identical payloads", () => {
  const original = normalizeTreasuryDebtRow(
    {
      record_date: "2026-09-17",
      debt_held_public_amt: "10.00",
      intragov_hold_amt: "5.00",
      tot_pub_debt_out_amt: "15.00"
    },
    retrievedAt
  );

  const duplicate = normalizeTreasuryDebtRow(
    {
      record_date: "2026-09-17",
      debt_held_public_amt: "10.00",
      intragov_hold_amt: "5.00",
      tot_pub_debt_out_amt: "15.00"
    },
    new Date("2026-09-18T13:00:00Z")
  );

  const revision = normalizeTreasuryDebtRow(
    {
      record_date: "2026-09-17",
      debt_held_public_amt: "11.00",
      intragov_hold_amt: "5.00",
      tot_pub_debt_out_amt: "16.00"
    },
    new Date("2026-09-18T14:00:00Z")
  );

  const grouped = reconcileObservations([original, duplicate, revision]);
  assert.equal(grouped.get("2026-09-17")?.length, 2);
});

test("selects the latest non-failing observation", () => {
  const goodOlder = normalizeTreasuryDebtRow(
    {
      record_date: "2026-09-16",
      debt_held_public_amt: "10.00",
      intragov_hold_amt: "5.00",
      tot_pub_debt_out_amt: "15.00"
    },
    retrievedAt
  );

  const badNewer = normalizeTreasuryDebtRow(
    {
      record_date: "2026-09-17",
      debt_held_public_amt: "10.00",
      intragov_hold_amt: "5.00",
      tot_pub_debt_out_amt: "99.00"
    },
    retrievedAt
  );

  assert.equal(
    selectLatestPublishableObservation([goodOlder, badNewer])?.recordDate,
    "2026-09-16"
  );
});

test("builds the authoritative Treasury API query", () => {
  const url = new URL(buildDebtToPennyUrl(15));

  assert.equal(url.pathname, "/services/api/fiscal_service/v2/accounting/od/debt_to_penny");
  assert.equal(url.searchParams.get("sort"), "-record_date");
  assert.equal(url.searchParams.get("page[size]"), "15");
  assert.match(url.searchParams.get("fields") ?? "", /tot_pub_debt_out_amt/);
});

test("fetches and normalizes recent observations with an injected fetch implementation", async () => {
  const fakeFetch = async () =>
    new Response(JSON.stringify(fixture), {
      status: 200,
      headers: { "content-type": "application/json" }
    });

  const observations = await fetchRecentDebtObservations({
    fetchImpl: fakeFetch as typeof fetch,
    retrievedAt,
    pageSize: 2
  });

  assert.equal(observations.length, 2);
  assert.equal(observations[0].validationStatus, "pass");
  assert.equal(observations[0].recordDate, "2026-09-17");
});
