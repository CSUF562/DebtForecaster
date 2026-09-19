export type ForecastMode = "debt-path" | "deficit-path";

export interface ForecastPoint {
  year: number;
  debt: number;
  annualDeficit: number;
}

export interface ForecastInput {
  baselineDebt: number;
  baselineAnnualDeficit: number;
  annualDeficitChangePercent: number;
  years: number;
}

export interface ForecastResult {
  evidenceClass: "modeled";
  modelVersion: "0.1.0";
  assumptions: string[];
  points: ForecastPoint[];
}

export function forecastDebtPath(input: ForecastInput): ForecastResult {
  if (input.baselineDebt < 0 || input.baselineAnnualDeficit < 0) {
    throw new Error("Baseline debt and deficit must be non-negative.");
  }

  if (!Number.isInteger(input.years) || input.years < 1 || input.years > 30) {
    throw new Error("Forecast years must be an integer between 1 and 30.");
  }

  const rate = input.annualDeficitChangePercent / 100;
  const points: ForecastPoint[] = [];
  let debt = input.baselineDebt;
  let deficit = input.baselineAnnualDeficit;

  for (let year = 1; year <= input.years; year += 1) {
    debt += deficit;
    points.push({
      year,
      debt,
      annualDeficit: deficit
    });
    deficit *= 1 + rate;
  }

  return {
    evidenceClass: "modeled",
    modelVersion: "0.1.0",
    assumptions: [
      "This is an arithmetic scenario, not an economic forecast.",
      "Annual deficit is added to debt once per modeled year.",
      `Annual deficit changes by ${input.annualDeficitChangePercent.toFixed(1)}% per year.`,
      "Interest, growth, inflation, policy feedback, and intrayear financing dynamics are not independently modeled in v0.1."
    ],
    points
  };
}
