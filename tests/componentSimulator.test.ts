import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultFiscalComponents,
  simulateComponents
} from "../src/forecast/componentSimulator.js";

test("builds a component-level debt path", () => {
  const result = simulateComponents({
    baselineDebt: 38,
    years: 1,
    components: defaultFiscalComponents
  });

  assert.equal(result.evidenceClass, "modeled");
  assert.ok(Math.abs(result.points[0].outlays - 7.1) < 1e-9);
  assert.ok(Math.abs(result.points[0].revenue - 5.1) < 1e-9);
  assert.ok(Math.abs(result.points[0].debt - 40) < 1e-9);
});

test("applies a policy change to only the selected component", () => {
  const components = defaultFiscalComponents.map(component =>
    component.key === "defense"
      ? { ...component, policyChangePercent: -10 }
      : component
  );

  const result = simulateComponents({ baselineDebt: 38, years: 1, components });

  assert.ok(Math.abs(result.points[0].outlays - 7.005) < 1e-9);
  assert.ok(Math.abs(result.points[0].annualDeficit - 1.905) < 1e-9);
});

test("keeps model limitations visible in the result", () => {
  const result = simulateComponents({
    baselineDebt: 38,
    years: 5,
    components: defaultFiscalComponents
  });

  assert.ok(result.assumptions.some(item => item.includes("not observed")));
  assert.ok(result.assumptions.some(item => item.includes("not yet modeled")));
});
