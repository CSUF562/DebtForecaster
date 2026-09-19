import type { ContextEvidence } from "./contextEvidence";

export interface CboMonthlyBudgetContextOptions {
  asOfDate: string;
  retrievedAt?: Date;
  fetchImpl?: typeof fetch;
}

const CBO_REPORTS_URL = "https://www.cbo.gov/publication/most-recent/reports";

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://www.cbo.gov${value.startsWith("/") ? value : `/${value}`}`;
}

function parseDate(text: string): string | null {
  const match = text.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})\b/
  );
  if (!match) return null;

  const months: Record<string, string> = {
    January:"01",February:"02",March:"03",April:"04",May:"05",June:"06",
    July:"07",August:"08",September:"09",October:"10",November:"11",December:"12"
  };

  return `${match[3]}-${months[match[1]]}-${match[2].padStart(2,"0")}`;
}

export function parseCboMonthlyBudgetReviewHtml(
  html: string,
  asOfDate: string
): { eventDate: string; title: string; summary: string; sourceUrl: string } | null {
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];

  for (const anchor of anchors) {
    const title = stripHtml(anchor[2]);
    if (!/^Monthly Budget Review:/i.test(title)) continue;

    const start = Math.max(0, (anchor.index ?? 0) - 600);
    const end = Math.min(html.length, (anchor.index ?? 0) + 1800);
    const block = stripHtml(html.slice(start, end));
    const eventDate = parseDate(block);

    if (!eventDate || eventDate > asOfDate) continue;

    const summaryMatch = block.match(
      /(The federal budget deficit totaled[^.]*\.(?:\s+[^.]*\.)?)/i
    );

    return {
      eventDate,
      title,
      summary:
        summaryMatch?.[1]?.trim() ??
        "CBO published its latest Monthly Budget Review, providing fiscal-year-to-date context on federal receipts, outlays, and the deficit.",
      sourceUrl: normalizeUrl(anchor[1])
    };
  }

  return null;
}

export async function fetchCboMonthlyBudgetContext(
  options: CboMonthlyBudgetContextOptions
): Promise<ContextEvidence | null> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(CBO_REPORTS_URL, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Project-Enclave/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`CBO reports page returned HTTP ${response.status}.`);
  }

  const parsed = parseCboMonthlyBudgetReviewHtml(
    await response.text(),
    options.asOfDate
  );

  if (!parsed) return null;

  return {
    id: `ctx-cbo-monthly-budget-review-${parsed.eventDate}`,
    eventDate: parsed.eventDate,
    title: parsed.title,
    summary: parsed.summary,
    sourceName: "Congressional Budget Office",
    sourceUrl: parsed.sourceUrl,
    sourceTier: "primary-government",
    retrievedAt: (options.retrievedAt ?? new Date()).toISOString(),
    confidence: "high",
    revisionOfId: null,
    supersededById: null,
    causalClaim: false,
    uncertaintyNote:
      "CBO's Monthly Budget Review provides broader federal fiscal context. It does not by itself establish the cause of a particular daily change in Treasury debt."
  };
}
