import type { DebtObservation } from "./debt";

export interface DebtChange {
  evidenceClass: "derived";
  currentObservationId: string;
  priorObservationId: string;
  currentRecordDate: string;
  priorRecordDate: string;
  intervalDays: number;
  absoluteChange: string;
  percentChange: string | null;
  formulaVersion: "1.0.0";
}

function cents(value: string): bigint {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    throw new Error(`Invalid currency value: ${value}`);
  }
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 100n + BigInt((fraction + "00").slice(0, 2));
}

function formatCents(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${fraction}`;
}

function daysBetween(a: string, b: string): number {
  const oneDay = 86_400_000;
  const aMs = Date.parse(`${a}T00:00:00Z`);
  const bMs = Date.parse(`${b}T00:00:00Z`);
  return Math.round((aMs - bMs) / oneDay);
}

function percentString(delta: bigint, prior: bigint): string | null {
  if (prior === 0n) return null;

  // Basis points of a percent, i.e. four decimal places.
  const scaled = (delta * 1_000_000n) / prior;
  const negative = scaled < 0n;
  const absolute = negative ? -scaled : scaled;
  const whole = absolute / 10_000n;
  const fraction = (absolute % 10_000n).toString().padStart(4, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${fraction}%`;
}

export function deriveDebtChange(
  current: DebtObservation,
  prior: DebtObservation
): DebtChange {
  if (current.recordDate <= prior.recordDate) {
    throw new Error("Current observation must be later than prior observation");
  }

  if (
    current.validationStatus === "fail" ||
    prior.validationStatus === "fail"
  ) {
    throw new Error("Cannot derive public trend metrics from failed observations");
  }

  const currentCents = cents(current.totalPublicDebtOutstanding);
  const priorCents = cents(prior.totalPublicDebtOutstanding);
  const delta = currentCents - priorCents;

  return {
    evidenceClass: "derived",
    currentObservationId: current.id,
    priorObservationId: prior.id,
    currentRecordDate: current.recordDate,
    priorRecordDate: prior.recordDate,
    intervalDays: daysBetween(current.recordDate, prior.recordDate),
    absoluteChange: formatCents(delta),
    percentChange: percentString(delta, priorCents),
    formulaVersion: "1.0.0"
  };
}

export function findPriorObservationAtOrBefore(
  current: DebtObservation,
  history: DebtObservation[],
  targetDaysBack: number
): DebtObservation | null {
  const target = new Date(`${current.recordDate}T00:00:00Z`);
  target.setUTCDate(target.getUTCDate() - targetDaysBack);
  const targetDate = target.toISOString().slice(0, 10);

  const candidates = history
    .filter(item =>
      item.validationStatus !== "fail" &&
      item.recordDate < current.recordDate &&
      item.recordDate <= targetDate
    )
    .sort((a, b) => b.recordDate.localeCompare(a.recordDate));

  return candidates[0] ?? null;
}

export function buildTrendSummary(
  latest: DebtObservation,
  history: DebtObservation[]
): {
  previous: DebtChange | null;
  sevenDay: DebtChange | null;
  thirtyDay: DebtChange | null;
} {
  const priorValid = history
    .filter(item =>
      item.validationStatus !== "fail" &&
      item.recordDate < latest.recordDate
    )
    .sort((a, b) => b.recordDate.localeCompare(a.recordDate))[0] ?? null;

  const seven = findPriorObservationAtOrBefore(latest, history, 7);
  const thirty = findPriorObservationAtOrBefore(latest, history, 30);

  return {
    previous: priorValid ? deriveDebtChange(latest, priorValid) : null,
    sevenDay: seven ? deriveDebtChange(latest, seven) : null,
    thirtyDay: thirty ? deriveDebtChange(latest, thirty) : null
  };
}
