import type { DebtObservation } from "./debt.js";

export type FreshnessStatus = "current" | "delayed" | "stale";

export interface FreshnessAssessment {
  evidenceClass: "derived";
  status: FreshnessStatus;
  businessDaysOld: number;
  asOfRecordDate: string;
  assessedAt: string;
  policyVersion: "1.0.0";
  note: string;
}

function isoDateUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function businessDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Freshness dates must be valid ISO dates");
  }

  if (end < start) return 0;

  let count = 0;
  const cursor = new Date(start);
  cursor.setUTCDate(cursor.getUTCDate() + 1);

  while (cursor <= end) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return count;
}

export function assessDebtFreshness(
  observation: DebtObservation,
  now: Date = new Date()
): FreshnessAssessment {
  const today = isoDateUtc(now);
  const businessDaysOld = businessDaysBetween(observation.recordDate, today);

  let status: FreshnessStatus;
  let note: string;

  if (businessDaysOld <= 1) {
    status = "current";
    note = "Latest validated Treasury observation is within one business day.";
  } else if (businessDaysOld === 2) {
    status = "delayed";
    note = "Latest validated Treasury observation is two business days old; display with a freshness notice.";
  } else {
    status = "stale";
    note = "Latest validated Treasury observation is more than two business days old; do not present it as current without a stale-data warning.";
  }

  return {
    evidenceClass: "derived",
    status,
    businessDaysOld,
    asOfRecordDate: observation.recordDate,
    assessedAt: now.toISOString(),
    policyVersion: "1.0.0",
    note
  };
}
