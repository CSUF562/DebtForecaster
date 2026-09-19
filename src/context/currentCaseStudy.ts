import type { ContextEvidence } from "./contextEvidence.js";
import { assembleDailyContext } from "./contextAssembler.js";

export interface LiveContextCaseStudy {
  id: string;
  asOfDate: string;
  candidates: ContextEvidence[];
}

export const SEPTEMBER_2026_CONTEXT_CASE: LiveContextCaseStudy = {
  id: "case-2026-09-midmonth",
  asOfDate: "2026-09-18",
  candidates: [
    {
      id: "ctx-cbo-2026-09-09",
      eventDate: "2026-09-09",
      title: "CBO Monthly Budget Review: August 2026",
      summary:
        "CBO estimated a $2.0 trillion federal budget deficit for the first 11 months of fiscal year 2026 and noted that timing shifts affected year-over-year comparisons.",
      sourceName: "Congressional Budget Office",
      sourceUrl: "https://www.cbo.gov/publication/61984",
      sourceTier: "primary-government",
      retrievedAt: "2026-09-19T04:45:00Z",
      confidence: "high",
      revisionOfId: null,
      supersededById: null,
      causalClaim: false,
      uncertaintyNote:
        "This report establishes the broader fiscal position and documented timing effects; it does not by itself explain a specific daily Treasury debt movement."
    },
    {
      id: "ctx-fed-2026-09-16",
      eventDate: "2026-09-16",
      title: "Federal Reserve FOMC statement",
      summary:
        "The FOMC raised the target range for the federal funds rate by 0.25 percentage point to 3.75 to 4.00 percent and described economic activity as expanding at a solid pace while inflation remained elevated.",
      sourceName: "Board of Governors of the Federal Reserve System",
      sourceUrl:
        "https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm",
      sourceTier: "primary-government",
      retrievedAt: "2026-09-19T04:45:00Z",
      confidence: "high",
      revisionOfId: null,
      supersededById: null,
      causalClaim: false,
      uncertaintyNote:
        "The policy decision is relevant monetary and market context, but no direct accounting link to a specific daily debt change is established here."
    },
    {
      id: "ctx-treasury-rates-2026-09-18",
      eventDate: "2026-09-18",
      title: "Treasury daily market rates",
      summary:
        "Treasury published its September 18 daily yield-curve and bill-rate observations, providing same-day financing-market context.",
      sourceName: "U.S. Department of the Treasury",
      sourceUrl:
        "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?field_tdr_date_value_month=202609&type=daily_treasury_yield_curve",
      sourceTier: "primary-government",
      retrievedAt: "2026-09-19T04:45:00Z",
      confidence: "high",
      revisionOfId: null,
      supersededById: null,
      causalClaim: false,
      uncertaintyNote:
        "Market yields are relevant financing context but do not by themselves establish the cause or magnitude of a specific daily debt movement."
    }
  ]
};

export function buildSeptember2026ContextBundle() {
  return assembleDailyContext(
    SEPTEMBER_2026_CONTEXT_CASE.candidates,
    {
      startDate: "2026-09-09",
      endDate: "2026-09-18"
    }
  );
}
