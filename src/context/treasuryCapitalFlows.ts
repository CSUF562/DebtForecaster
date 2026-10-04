import type { ContextEvidence } from "./contextEvidence";

export interface TreasuryCapitalFlowsOptions {
  asOfDate: string;
  retrievedAt?: Date;
  fetchImpl?: typeof fetch;
}

export interface TicReleaseLink {
  eventDate: string;
  title: string;
  sourceUrl: string;
}

export interface TicFlowObservation {
  totalFlow: string | null;
  privateFlow: string | null;
  officialFlow: string | null;
  longTermFlow: string | null;
  treasuryBillFlow: string | null;
}

const TIC_RELEASES_URL =
  "https://home.treasury.gov/data/treasury-international-capital-tic-system/press-releases";

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://home.treasury.gov${value.startsWith("/") ? value : `/${value}`}`;
}

function parseDate(value: string): string | null {
  const match = value.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})\b/i
  );
  if (!match) return null;

  const months: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12"
  };

  return `${match[3]}-${months[match[1].toLowerCase()]}-${match[2].padStart(2, "0")}`;
}

// Keep date lookup inside a complete listing item, including nested title markup.
function releaseBlocks(html: string): { start: number; end: number }[] {
  const stack: { tag: string; start: number }[] = [];
  const blocks: { start: number; end: number }[] = [];
  const markup = html.replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
    value => " ".repeat(value.length));
  for (const match of markup.matchAll(/<(\/?)(div|p|li|tr|article|section)\b[^>]*>/gi)) {
    const tag = match[2].toLowerCase();
    if (!match[1]) {
      stack.push({ tag, start: match.index! });
      continue;
    }
    let index = stack.length - 1;
    while (index >= 0 && stack[index].tag !== tag) index--;
    if (index < 0) continue;
    const [opening] = stack.splice(index);
    blocks.push({ start: opening.start, end: match.index! + match[0].length });
  }
  return blocks.sort((a, b) => (a.end - a.start) - (b.end - b.start));
}

export function parseTicReleaseListing(
  html: string,
  asOfDate: string
): TicReleaseLink | null {
  const anchors = [...html.matchAll(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  )];

  const releases: TicReleaseLink[] = [];
  const blocks = releaseBlocks(html);

  for (const anchor of anchors) {
    const title = stripHtml(anchor[2]);
    if (!/Treasury International Capital Data for/i.test(title)) continue;

    const index = anchor.index ?? 0;
    // Never cross into a sibling release: only a block containing this one
    // TIC link may provide its publication date. Undated items stay unavailable.
    const block = blocks.find(candidate =>
      candidate.start <= index && candidate.end >= index + anchor[0].length &&
      anchors.filter(link =>
        link.index! >= candidate.start && link.index! < candidate.end &&
        /Treasury International Capital Data for/i.test(stripHtml(link[2]))
      ).length === 1 &&
      parseDate(stripHtml(html.slice(candidate.start, candidate.end))) !== null
    );
    const eventDate = block
      ? parseDate(stripHtml(html.slice(block.start, block.end)))
      : null;
    if (!eventDate || eventDate > asOfDate) continue;

    releases.push({
      eventDate,
      title,
      sourceUrl: normalizeUrl(anchor[1])
    });
  }

  return releases.sort((a, b) => b.eventDate.localeCompare(a.eventDate))[0] ?? null;
}

function signedFlow(text: string, expression: RegExp): string | null {
  const match = text.match(expression);
  if (!match) return null;

  const direction = match[1]?.toLowerCase();
  const amount = match[2];
  if (!amount) return null;

  const negative = direction?.startsWith("outflow") ||
    direction === "sales" || direction === "decreased";
  return `${negative ? "-" : "+"}$${amount} billion`;
}

export function parseTicRelease(html: string): TicFlowObservation {
  const text = stripHtml(html);

  return {
    totalFlow: signedFlow(
      text,
      /net TIC (inflow|outflow) of \$([\d,.]+) billion/i
    ),
    privateFlow: signedFlow(
      text,
      /net foreign private (inflows?|outflows?) were \$([\d,.]+) billion/i
    ),
    officialFlow: signedFlow(
      text,
      /net foreign official (inflows?|outflows?) were \$([\d,.]+) billion/i
    ),
    longTermFlow: signedFlow(
      text,
      /overall net foreign (purchases|sales) of long-term securities (?:are estimated to have been|were) \$([\d,.]+) billion/i
    ),
    treasuryBillFlow: signedFlow(
      text,
      /(increased|decreased) (?:their )?holdings of U\.S\. Treasury bills by \$([\d,.]+) billion/i
    )
  };
}

function flowSummary(flow: TicFlowObservation): string {
  const parts = [
    flow.totalFlow ? `total net TIC flow ${flow.totalFlow}` : null,
    flow.longTermFlow ? `adjusted long-term securities flow ${flow.longTermFlow}` : null,
    flow.treasuryBillFlow ? `Treasury-bill holdings change ${flow.treasuryBillFlow}` : null,
    flow.privateFlow ? `private flow ${flow.privateFlow}` : null,
    flow.officialFlow ? `official flow ${flow.officialFlow}` : null
  ].filter((value): value is string => Boolean(value));

  return parts.length > 0
    ? `Treasury's monthly cross-border report showed ${parts.join("; ")}.`
    : "Treasury published its latest monthly report on cross-border securities and banking flows.";
}

export async function fetchTreasuryCapitalFlowsContext(
  options: TreasuryCapitalFlowsOptions
): Promise<ContextEvidence | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.asOfDate)) {
    throw new Error("Treasury capital-flow context requires an ISO asOfDate.");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const listingResponse = await fetchImpl(TIC_RELEASES_URL, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Project-Enclave/1.0"
    }
  });

  if (!listingResponse.ok) {
    throw new Error(`Treasury TIC release index returned HTTP ${listingResponse.status}.`);
  }

  const release = parseTicReleaseListing(
    await listingResponse.text(),
    options.asOfDate
  );
  if (!release) return null;

  const releaseResponse = await fetchImpl(release.sourceUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Project-Enclave/1.0"
    }
  });

  if (!releaseResponse.ok) {
    throw new Error(`Treasury TIC release returned HTTP ${releaseResponse.status}.`);
  }

  const flow = parseTicRelease(await releaseResponse.text());

  return {
    id: `ctx-treasury-capital-flows-${release.eventDate}`,
    eventDate: release.eventDate,
    title: "Treasury International Capital monthly flow context",
    summary: flowSummary(flow),
    sourceName: "U.S. Department of the Treasury",
    sourceUrl: release.sourceUrl,
    sourceTier: "primary-government",
    retrievedAt: (options.retrievedAt ?? new Date()).toISOString(),
    confidence: "high",
    revisionOfId: null,
    supersededById: null,
    causalClaim: false,
    uncertaintyNote:
      "TIC data describe reported cross-border transactions and custody-based holdings. A single month does not establish a durable change in demand, identify every ultimate owner, or prove that fiscal policy caused the observed flows."
  };
}
