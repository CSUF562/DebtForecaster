import type { ContextEvidence } from "./contextEvidence";

export interface FedFomcContextOptions {
  asOfDate: string;
  retrievedAt?: Date;
  fetchImpl?: typeof fetch;
}

const FOMC_INDEX_URL =
  "https://www.federalreserve.gov/newsevents/pressreleases/2026-press-fomc.htm";

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

function normalizeFedUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://www.federalreserve.gov${value.startsWith("/") ? value : `/${value}`}`;
}

function dateFromUrl(url: string): string | null {
  const match = url.match(/monetary(\d{4})(\d{2})(\d{2})a\.htm/i);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

function findLatestStatementLink(
  html: string,
  asOfDate: string
): { eventDate: string; sourceUrl: string } | null {
  const links = [
    ...html.matchAll(
      /<a\b[^>]*href=["']([^"']*monetary\d{8}a\.htm)["'][^>]*>([\s\S]*?)<\/a>/gi
    )
  ];

  const candidates = links
    .map(match => {
      const sourceUrl = normalizeFedUrl(match[1]);
      const eventDate = dateFromUrl(sourceUrl);
      const label = stripHtml(match[2]);

      return eventDate && /FOMC statement/i.test(label)
        ? { eventDate, sourceUrl }
        : null;
    })
    .filter(
      (
        value
      ): value is { eventDate: string; sourceUrl: string } =>
        Boolean(value && value.eventDate <= asOfDate)
    )
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  return candidates[0] ?? null;
}

function summarizeStatement(html: string, eventDate: string): string {
  const text = stripHtml(html);

  const rangeMatch = text.match(
    /target range for the federal funds rate by [^.]*? to ([\d-]+\/?\d*\s*to\s*[\d-]+\/?\d* percent|[\d.]+\s*to\s*[\d.]+ percent)/i
  );

  const normalizedRange =
    rangeMatch?.[1]
      ?.replace(/3-3\/4/g, "3.75")
      .replace(/4 percent/g, "4.00 percent") ?? null;

  const activity = /economic activity is expanding at a solid pace/i.test(text);
  const inflation = /inflation remains elevated/i.test(text);

  const parts = [
    `The Federal Open Market Committee issued its monetary-policy statement on ${eventDate}.`,
    normalizedRange
      ? `The statement set the federal funds target range at ${normalizedRange}.`
      : null,
    activity ? "The statement described economic activity as expanding at a solid pace." : null,
    inflation ? "It said inflation remained elevated." : null
  ].filter((value): value is string => Boolean(value));

  return parts.join(" ");
}

export async function fetchFedFomcContext(
  options: FedFomcContextOptions
): Promise<ContextEvidence | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.asOfDate)) {
    throw new Error("FOMC context requires an ISO asOfDate.");
  }

  const fetchImpl = options.fetchImpl ?? fetch;

  const indexResponse = await fetchImpl(FOMC_INDEX_URL, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Project-Enclave/1.0"
    }
  });

  if (!indexResponse.ok) {
    throw new Error(
      `Federal Reserve FOMC index returned HTTP ${indexResponse.status}.`
    );
  }

  const selected = findLatestStatementLink(
    await indexResponse.text(),
    options.asOfDate
  );

  if (!selected) return null;

  const statementResponse = await fetchImpl(selected.sourceUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Project-Enclave/1.0"
    }
  });

  if (!statementResponse.ok) {
    throw new Error(
      `Federal Reserve FOMC statement returned HTTP ${statementResponse.status}.`
    );
  }

  const statementHtml = await statementResponse.text();

  return {
    id: `ctx-fed-fomc-${selected.eventDate}`,
    eventDate: selected.eventDate,
    title: "Federal Reserve FOMC statement",
    summary: summarizeStatement(statementHtml, selected.eventDate),
    sourceName: "Board of Governors of the Federal Reserve System",
    sourceUrl: selected.sourceUrl,
    sourceTier: "primary-government",
    retrievedAt: (options.retrievedAt ?? new Date()).toISOString(),
    confidence: "high",
    revisionOfId: null,
    supersededById: null,
    causalClaim: false,
    uncertaintyNote:
      "The FOMC statement provides monetary-policy and financing-context information. It does not by itself establish the cause of a specific daily change in federal debt."
  };
}
