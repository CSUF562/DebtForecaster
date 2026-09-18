import { createHash } from "node:crypto";

export const TREASURY_DEBT_TO_PENNY_URL =
  "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny";

export type ValidationStatus = "pass" | "warning" | "fail";

export interface TreasuryDebtRow {
  record_date: string;
  debt_held_public_amt: string;
  intragov_hold_amt: string;
  tot_pub_debt_out_amt: string;
  src_line_nbr?: string;
}

export interface DebtObservation {
  id: string;
  recordDate: string;
  totalPublicDebtOutstanding: string;
  debtHeldByPublic: string;
  intragovernmentalHoldings: string;
  sourceAgency: "U.S. Department of the Treasury";
  sourceDataset: "Debt to the Penny";
  sourceRecordId: string | null;
  retrievedAt: string;
  adapterVersion: string;
  rawPayloadHash: string;
  validationStatus: ValidationStatus;
  validationNotes: string[];
}

export interface TreasuryApiResponse {
  data: TreasuryDebtRow[];
  meta?: unknown;
  links?: unknown;
}

export interface FetchDebtOptions {
  fetchImpl?: typeof fetch;
  pageSize?: number;
  retrievedAt?: Date;
}

const ADAPTER_VERSION = "1.0.0";

function parseCurrencyToCents(value: string): bigint {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    throw new Error(`Invalid non-negative currency value: ${value}`);
  }

  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 100n + BigInt((fraction + "00").slice(0, 2));
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function stablePayloadHash(row: TreasuryDebtRow): string {
  const canonical = JSON.stringify({
    record_date: row.record_date,
    debt_held_public_amt: row.debt_held_public_amt,
    intragov_hold_amt: row.intragov_hold_amt,
    tot_pub_debt_out_amt: row.tot_pub_debt_out_amt,
    src_line_nbr: row.src_line_nbr ?? null
  });

  return createHash("sha256").update(canonical).digest("hex");
}

export function normalizeTreasuryDebtRow(
  row: TreasuryDebtRow,
  retrievedAt: Date = new Date()
): DebtObservation {
  const notes: string[] = [];
  let status: ValidationStatus = "pass";

  if (!isIsoDate(row.record_date)) {
    status = "fail";
    notes.push("record_date is not a valid ISO calendar date");
  }

  let publicCents: bigint | null = null;
  let intragovCents: bigint | null = null;
  let totalCents: bigint | null = null;

  try {
    publicCents = parseCurrencyToCents(row.debt_held_public_amt);
    intragovCents = parseCurrencyToCents(row.intragov_hold_amt);
    totalCents = parseCurrencyToCents(row.tot_pub_debt_out_amt);
  } catch (error) {
    status = "fail";
    notes.push(error instanceof Error ? error.message : "Currency parsing failed");
  }

  if (publicCents !== null && intragovCents !== null && totalCents !== null) {
    const expected = publicCents + intragovCents;
    const delta = totalCents >= expected ? totalCents - expected : expected - totalCents;

    if (delta > 1n) {
      status = "fail";
      notes.push(
        `Accounting identity failed by ${delta.toString()} cent(s): total public debt must equal debt held by the public plus intragovernmental holdings`
      );
    } else if (delta === 1n && status !== "fail") {
      status = "warning";
      notes.push("Accounting identity differs by one cent, within configured source precision tolerance");
    }
  }

  if (notes.length === 0) {
    notes.push("Treasury debt observation passed normalization and accounting identity checks");
  }

  const hash = stablePayloadHash(row);
  const id = `treasury-debt-${row.record_date}-${hash.slice(0, 12)}`;

  return {
    id,
    recordDate: row.record_date,
    totalPublicDebtOutstanding: row.tot_pub_debt_out_amt,
    debtHeldByPublic: row.debt_held_public_amt,
    intragovernmentalHoldings: row.intragov_hold_amt,
    sourceAgency: "U.S. Department of the Treasury",
    sourceDataset: "Debt to the Penny",
    sourceRecordId: row.src_line_nbr ?? null,
    retrievedAt: retrievedAt.toISOString(),
    adapterVersion: ADAPTER_VERSION,
    rawPayloadHash: hash,
    validationStatus: status,
    validationNotes: notes
  };
}

export function reconcileObservations(
  observations: DebtObservation[]
): Map<string, DebtObservation[]> {
  const versions = new Map<string, DebtObservation[]>();

  for (const observation of observations) {
    const existing = versions.get(observation.recordDate) ?? [];

    if (!existing.some(item => item.rawPayloadHash === observation.rawPayloadHash)) {
      existing.push(observation);
      versions.set(observation.recordDate, existing);
    }
  }

  return versions;
}

export function selectLatestPublishableObservation(
  observations: DebtObservation[]
): DebtObservation | null {
  const valid = observations
    .filter(item => item.validationStatus !== "fail")
    .sort((a, b) => b.recordDate.localeCompare(a.recordDate));

  return valid[0] ?? null;
}

export function buildDebtToPennyUrl(pageSize = 30): string {
  const url = new URL(TREASURY_DEBT_TO_PENNY_URL);
  url.searchParams.set(
    "fields",
    "record_date,debt_held_public_amt,intragov_hold_amt,tot_pub_debt_out_amt,src_line_nbr"
  );
  url.searchParams.set("sort", "-record_date");
  url.searchParams.set("page[size]", String(pageSize));
  return url.toString();
}

export async function fetchRecentDebtObservations(
  options: FetchDebtOptions = {}
): Promise<DebtObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date();
  const response = await fetchImpl(buildDebtToPennyUrl(options.pageSize));

  if (!response.ok) {
    throw new Error(
      `Treasury Debt to the Penny request failed: ${response.status} ${response.statusText}`
    );
  }

  const payload = (await response.json()) as TreasuryApiResponse;

  if (!payload || !Array.isArray(payload.data)) {
    throw new Error("Treasury Debt to the Penny response did not contain a data array");
  }

  return payload.data.map(row => normalizeTreasuryDebtRow(row, retrievedAt));
}

export async function getLatestPublishableDebtObservation(
  options: FetchDebtOptions = {}
): Promise<{
  latest: DebtObservation | null;
  history: DebtObservation[];
}> {
  const history = await fetchRecentDebtObservations(options);
  return {
    latest: selectLatestPublishableObservation(history),
    history
  };
}
