export type FiscalComponentKey =
  | "socialSecurity"
  | "healthPrograms"
  | "defense"
  | "nonDefenseDiscretionary"
  | "otherMandatory"
  | "netInterest"
  | "revenue";

export interface FiscalComponent {
  key: FiscalComponentKey;
  label: string;
  baselineAmount: number;
  annualGrowthPercent: number;
  policyChangePercent: number;
  kind: "outlay" | "revenue";
}

export interface ComponentScenarioInput {
  baselineDebt: number;
  years: 1 | 5 | 10;
  components: FiscalComponent[];
}

export interface ComponentScenarioPoint {
  year: number;
  outlays: number;
  revenue: number;
  annualDeficit: number;
  debt: number;
}

export interface ComponentScenarioResult {
  evidenceClass: "modeled";
  modelVersion: "0.2.0";
  points: ComponentScenarioPoint[];
  assumptions: string[];
}

function validate(input: ComponentScenarioInput): void {
  if (input.baselineDebt < 0) {
    throw new Error("Baseline debt must be non-negative.");
  }

  if (![1, 5, 10].includes(input.years)) {
    throw new Error("Scenario horizon must be 1, 5, or 10 years.");
  }

  if (input.components.length === 0) {
    throw new Error("At least one fiscal component is required.");
  }

  if (!input.components.some(component => component.kind === "revenue")) {
    throw new Error("At least one revenue component is required.");
  }

  for (const component of input.components) {
    if (component.baselineAmount < 0) {
      throw new Error(`${component.label} baseline must be non-negative.`);
    }
  }
}

export function simulateComponents(
  input: ComponentScenarioInput
): ComponentScenarioResult {
  validate(input);

  let debt = input.baselineDebt;
  const points: ComponentScenarioPoint[] = [];

  for (let year = 1; year <= input.years; year += 1) {
    let outlays = 0;
    let revenue = 0;

    for (const component of input.components) {
      const policyMultiplier = 1 + component.policyChangePercent / 100;
      const growthMultiplier = Math.pow(
        1 + component.annualGrowthPercent / 100,
        year - 1
      );
      const amount = component.baselineAmount * policyMultiplier * growthMultiplier;

      if (component.kind === "outlay") {
        outlays += amount;
      } else {
        revenue += amount;
      }
    }

    const annualDeficit = outlays - revenue;
    debt += annualDeficit;
    points.push({ year, outlays, revenue, annualDeficit, debt });
  }

  return {
    evidenceClass: "modeled",
    modelVersion: "0.2.0",
    points,
    assumptions: [
      "Component baselines are editable scenario assumptions, not observed Treasury line items.",
      "Policy changes apply immediately and remain in place for the full scenario.",
      "Each component then compounds at its stated annual growth rate.",
      "Annual deficit equals modeled outlays minus modeled revenue and is added to debt once per year.",
      "Macroeconomic feedback, inflation, behavioral responses, intrayear financing, and interactions among policies are not yet modeled."
    ]
  };
}

export const defaultFiscalComponents: FiscalComponent[] = [
  { key: "socialSecurity", label: "Social Security", baselineAmount: 1.55, annualGrowthPercent: 5, policyChangePercent: 0, kind: "outlay" },
  { key: "healthPrograms", label: "Medicare & health", baselineAmount: 1.8, annualGrowthPercent: 6, policyChangePercent: 0, kind: "outlay" },
  { key: "defense", label: "Defense", baselineAmount: 0.95, annualGrowthPercent: 3, policyChangePercent: 0, kind: "outlay" },
  { key: "nonDefenseDiscretionary", label: "Nondefense discretionary", baselineAmount: 0.95, annualGrowthPercent: 3, policyChangePercent: 0, kind: "outlay" },
  { key: "otherMandatory", label: "Other mandatory", baselineAmount: 0.9, annualGrowthPercent: 3, policyChangePercent: 0, kind: "outlay" },
  { key: "netInterest", label: "Net interest", baselineAmount: 0.95, annualGrowthPercent: 6, policyChangePercent: 0, kind: "outlay" },
  { key: "revenue", label: "Federal revenue", baselineAmount: 5.1, annualGrowthPercent: 4, policyChangePercent: 0, kind: "revenue" }
];
