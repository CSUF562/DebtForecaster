import type { ContextSourceTier } from "./contextEvidence";

export interface ContextSourceDefinition {
  id: string;
  name: string;
  hosts: string[];
  tier: ContextSourceTier;
  categories: Array<
    | "treasury"
    | "budget"
    | "economic"
    | "monetary"
    | "legislative"
    | "market"
  >;
  notes: string;
}

export const CONTEXT_SOURCE_REGISTRY: ContextSourceDefinition[] = [
  {
    id: "us-treasury",
    name: "U.S. Department of the Treasury",
    hosts: ["home.treasury.gov", "fiscaldata.treasury.gov"],
    tier: "primary-government",
    categories: ["treasury", "budget", "market"],
    notes:
      "Primary source for Treasury announcements, fiscal data, debt-management information, and related federal financial records."
  },
  {
    id: "cbo",
    name: "Congressional Budget Office",
    hosts: ["cbo.gov", "www.cbo.gov"],
    tier: "primary-government",
    categories: ["budget", "economic"],
    notes:
      "Primary government source for nonpartisan federal budget and economic projections, estimates, data files, and methodological documentation."
  },
  {
    id: "federal-reserve",
    name: "Board of Governors of the Federal Reserve System",
    hosts: ["federalreserve.gov", "www.federalreserve.gov"],
    tier: "primary-government",
    categories: ["monetary", "economic", "market"],
    notes:
      "Primary source for FOMC statements, monetary-policy releases, economic projections, and Board announcements."
  }
];

export function findRegisteredContextSource(
  url: string
): ContextSourceDefinition | null {
  let hostname: string;

  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }

  return (
    CONTEXT_SOURCE_REGISTRY.find(source =>
      source.hosts.some(host => hostname === host || hostname.endsWith(`.${host}`))
    ) ?? null
  );
}

export function classifyContextSource(
  url: string
): ContextSourceTier {
  return findRegisteredContextSource(url)?.tier ?? "other";
}
