import assert from "node:assert/strict";
import test from "node:test";
import { forecastDebtPath } from "../src/forecast/freeForecaster.js";

test("builds a transparent flat-deficit debt path", () => {
  const result = forecastDebtPath({
    baselineDebt: 38,
    baselineAnnualDeficit: 2,
    annualDeficitChangePercent: 0,
    years: 5
  });

  assert.equal(result.evidenceClass, "modeled");
  assert.equal(result.points[4].debt, 48);
  assert.equal(result.points[4].annualDeficit, 2);
});

test("applies annual deficit change after each modeled year", () => {
  const result = forecastDebtPath({
    baselineDebt: 38,
    baselineAnnualDeficit: 2,
    annualDeficitChangePercent: 10,
    years: 2
  });

  assert.equal(result.points[0].annualDeficit, 2);
  assert.ok(Math.abs(result.points[1].annualDeficit - 2.2) < 1e-9);
});

test("rejects invalid horizons", () => {
  assert.throws(
    () =>
      forecastDebtPath({
        baselineDebt: 38,
        baselineAnnualDeficit: 2,
        annualDeficitChangePercent: 0,
        years: 0
      }),
    /between 1 and 30/
  );
});
