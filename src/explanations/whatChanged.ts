import type { DebtObservation } from "../fiscal/debt";
import { deriveDebtChange, type DebtChange } from "../fiscal/trends";

export type ExplanationEvidenceClass =
  | "observed"
  | "derived"
  | "contextual"
  | "hypothesis";

export interface ExplanationClaim {
  id: string;
  evidenceClass: ExplanationEvidenceClass;
  text: string;
  sourceObservationIds: string[];
  confidence: "high" | "medium" | "low";
  causal: boolean;
}

export interface WhatChangedExplanation {
  version: "1.0.0";
  currentObservationId: string;
  priorObservationId: string;
  recordDate: string;
  priorRecordDate: string;
  totalDebtChange: DebtChange;
  publicDebtChange: string;
  intragovernmentalChange: string;
  claims: ExplanationClaim[];
  evidenceBoundary: string;
}

function cents(value: string): bigint {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    throw new Error(`Invalid currency value: ${value}`);
  }

  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 100n + BigInt((fraction + "00").slice(0, 2));
}

function formatSignedCurrency(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${negative ? "-" : "+"}$${grouped}.${fraction}`;
}

function directionWord(value: bigint): "increased" | "decreased" | "was unchanged" {
  if (value > 0n) return "increased";
  if (value < 0n) return "decreased";
  return "was unchanged";
}

function magnitudeText(value: bigint): string {
  if (value === 0n) return "$0.00";
  return formatSignedCurrency(value).replace(/^\+/, "");
}

export function explainAccountingChange(
  current: DebtObservation,
  prior: DebtObservation
): WhatChangedExplanation {
  if (
    current.validationStatus === "fail" ||
    prior.validationStatus === "fail"
  ) {
    throw new Error("Cannot explain changes from failed observations");
  }

  if (current.recordDate <= prior.recordDate) {
    throw new Error("Current observation must be later than prior observation");
  }

  const totalDebtChange = deriveDebtChange(current, prior);

  const publicDelta =
    cents(current.debtHeldByPublic) - cents(prior.debtHeldByPublic);
  const intragovDelta =
    cents(current.intragovernmentalHoldings) -
    cents(prior.intragovernmentalHoldings);

  const totalDelta =
    cents(current.totalPublicDebtOutstanding) -
    cents(prior.totalPublicDebtOutstanding);

  const sumOfComponents = publicDelta + intragovDelta;

  if (sumOfComponents !== totalDelta) {
    throw new Error(
      "Component changes do not reconcile to the total debt change"
    );
  }

  const sourceObservationIds = [prior.id, current.id];

  const claims: ExplanationClaim[] = [
    {
      id: "total-change",
      evidenceClass: "observed",
      text:
        totalDelta === 0n
          ? `Total public debt was unchanged between ${prior.recordDate} and ${current.recordDate}.`
          : `Total public debt ${directionWord(totalDelta)} by ${magnitudeText(
              totalDelta
            )} between ${prior.recordDate} and ${current.recordDate}.`,
      sourceObservationIds,
      confidence: "high",
      causal: false
    },
    {
      id: "public-component",
      evidenceClass: "observed",
      text:
        publicDelta === 0n
          ? "Debt held by the public was unchanged."
          : `Debt held by the public ${directionWord(
              publicDelta
            )} by ${magnitudeText(publicDelta)}.`,
      sourceObservationIds,
      confidence: "high",
      causal: false
    },
    {
      id: "intragov-component",
      evidenceClass: "observed",
      text:
        intragovDelta === 0n
          ? "Intragovernmental holdings were unchanged."
          : `Intragovernmental holdings ${directionWord(
              intragovDelta
            )} by ${magnitudeText(intragovDelta)}.`,
      sourceObservationIds,
      confidence: "high",
      causal: false
    },
    {
      id: "reconciliation",
      evidenceClass: "derived",
      text:
        "The component changes reconcile exactly to the reported change in total public debt.",
      sourceObservationIds,
      confidence: "high",
      causal: false
    }
  ];

  return {
    version: "1.0.0",
    currentObservationId: current.id,
    priorObservationId: prior.id,
    recordDate: current.recordDate,
    priorRecordDate: prior.recordDate,
    totalDebtChange,
    publicDebtChange: formatSignedCurrency(publicDelta),
    intragovernmentalChange: formatSignedCurrency(intragovDelta),
    claims,
    evidenceBoundary:
      "Treasury accounting establishes what changed in the reported debt components. These observations do not, by themselves, establish why the changes occurred or which outside events caused them."
  };
}
