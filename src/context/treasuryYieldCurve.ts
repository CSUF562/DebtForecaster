import type { ContextEvidence } from "./contextEvidence";

export interface TreasuryYieldCurveContextOptions {
  asOfDate: string;
  retrievedAt?: Date;
  fetchImpl?: typeof fetch;
}

interface YieldCurveRow {
  eventDate: string;
  twoYear: string | null;
  tenYear: string | null;
  thirtyYear: string | null;
}

function toIsoDate(value: string): string | null {
  const trimmed = value.trim();

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!usMatch) return null;

  return [
    usMatch[3],
    usMatch[1].padStart(2, "0"),
    usMatch[2].padStart(2, "0")
  ].join("-");
}

function readXmlField(entry: string, field: string): string | null {
  const expression = new RegExp(
    `<d:${field}(?:\\s[^>]*)?>([^<]*)<\\/d:${field}>`,
    "i"
  );
  const match = entry.match(expression);
  return match?.[1]?.trim() || null;
}

export function parseTreasuryYieldCurveXml(xml: string): YieldCurveRow[] {
  const entries = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  const rows: YieldCurveRow[] = [];

  for (const entry of entries) {
    const rawDate =
      readXmlField(entry, "NEW_DATE") ??
      readXmlField(entry, "Record_Date");

    if (!rawDate) continue;

    const eventDate = toIsoDate(rawDate);
    if (!eventDate) continue;

    rows.push({
      eventDate,
      twoYear: readXmlField(entry, "BC_2YEAR"),
      tenYear: readXmlField(entry, "BC_10YEAR"),
      thirtyYear: readXmlField(entry, "BC_30YEAR")
    });
  }

  return rows.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
}

function buildFeedUrl(asOfDate: string): string {
  const month = asOfDate.slice(0, 7).replace("-", "");

  return (
    "https://home.treasury.gov/resource-center/data-chart-center/" +
    "interest-rates/pages/xml?data=daily_treasury_yield_curve&" +
    `field_tdr_date_value_month=${month}`
  );
}

function rateSummary(row: YieldCurveRow): string {
  const selected = [
    row.twoYear ? `2-year ${row.twoYear}%` : null,
    row.tenYear ? `10-year ${row.tenYear}%` : null,
    row.thirtyYear ? `30-year ${row.thirtyYear}%` : null
  ].filter((value): value is string => Boolean(value));

  const suffix =
    selected.length > 0
      ? ` Selected par yields included ${selected.join(", ")}.`
      : "";

  return (
    `Treasury published daily par yield-curve rates for ${row.eventDate}.` +
    suffix
  );
}

export async function fetchTreasuryYieldCurveContext(
  options: TreasuryYieldCurveContextOptions
): Promise<ContextEvidence | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.asOfDate)) {
    throw new Error("Treasury yield-curve context requires an ISO asOfDate.");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = buildFeedUrl(options.asOfDate);
  const response = await fetchImpl(sourceUrl, {
    headers: {
      Accept: "application/xml,text/xml;q=0.9,*/*;q=0.1",
      "User-Agent": "Project-Enclave/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(
      `Treasury yield-curve feed returned HTTP ${response.status}.`
    );
  }

  const xml = await response.text();
  const rows = parseTreasuryYieldCurveXml(xml);
  const row = rows.find(item => item.eventDate <= options.asOfDate);

  if (!row) return null;

  const retrievedAt = options.retrievedAt ?? new Date();

  return {
    id: `ctx-treasury-yield-curve-${row.eventDate}`,
    eventDate: row.eventDate,
    title: "Treasury daily par yield curve",
    summary: rateSummary(row),
    sourceName: "U.S. Department of the Treasury",
    sourceUrl,
    sourceTier: "primary-government",
    retrievedAt: retrievedAt.toISOString(),
    confidence: "high",
    revisionOfId: null,
    supersededById: null,
    causalClaim: false,
    uncertaintyNote:
      "Treasury yield-curve observations provide financing-market context. They do not, by themselves, establish the cause or magnitude of a specific daily federal debt movement."
  };
}
