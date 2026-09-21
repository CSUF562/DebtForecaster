"use client";

import { useMemo, useState } from "react";
import {
  defaultFiscalComponents,
  simulateComponents,
  type FiscalComponent
} from "../../src/forecast/componentSimulator";

function trillions(value: number): string {
  return `${value < 0 ? "−" : ""}$${Math.abs(value).toFixed(2)}T`;
}

export function ComponentSimulator({ baselineDebt }: { baselineDebt: number }) {
  const [components, setComponents] = useState<FiscalComponent[]>(
    defaultFiscalComponents.map(component => ({ ...component }))
  );
  const [years, setYears] = useState<1 | 5 | 10>(5);

  const result = useMemo(
    () => simulateComponents({ baselineDebt, years, components }),
    [baselineDebt, years, components]
  );
  const final = result.points.at(-1)!;
  const first = result.points[0];

  function changePolicy(key: FiscalComponent["key"], value: number) {
    setComponents(current =>
      current.map(component =>
        component.key === key
          ? { ...component, policyChangePercent: value }
          : component
      )
    );
  }

  function reset() {
    setComponents(defaultFiscalComponents.map(component => ({ ...component })));
    setYears(5);
  }

  return (
    <div className="premium-layout">
      <section className="premium-controls" aria-label="Fiscal component controls">
        <div className="premium-toolbar">
          <div className="horizon-control">
            <span>Horizon</span>
            {([1, 5, 10] as const).map(value => (
              <button
                key={value}
                type="button"
                className={years === value ? "active" : ""}
                onClick={() => setYears(value)}
              >
                {value} year{value === 1 ? "" : "s"}
              </button>
            ))}
          </div>
          <button className="reset-button" type="button" onClick={reset}>Reset assumptions</button>
        </div>

        <p className="model-notice">
          These starting amounts are transparent assumptions in trillions of dollars. They are not presented as current enacted-policy estimates.
        </p>

        <div className="component-list">
          {components.map(component => (
            <div className="component-control" key={component.key}>
              <div>
                <label htmlFor={component.key}>{component.label}</label>
                <small>
                  {trillions(component.baselineAmount)} baseline · {component.annualGrowthPercent}% annual growth
                </small>
              </div>
              <strong className={component.policyChangePercent === 0 ? "" : "changed-value"}>
                {component.policyChangePercent > 0 ? "+" : ""}{component.policyChangePercent}%
              </strong>
              <input
                id={component.key}
                type="range"
                min="-25"
                max="25"
                step="1"
                value={component.policyChangePercent}
                onChange={event => changePolicy(component.key, Number(event.target.value))}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="premium-results" aria-live="polite">
        <div className="result-header">
          <span className="claim-label modeled">modeled</span>
          <span>Model v{result.modelVersion}</span>
        </div>
        <p className="forecast-number">{trillions(final.debt)}</p>
        <p className="asof">Modeled debt after {years} year{years === 1 ? "" : "s"}</p>

        <div className="scenario-metrics">
          <div><span>Year 1 outlays</span><strong>{trillions(first.outlays)}</strong></div>
          <div><span>Year 1 revenue</span><strong>{trillions(first.revenue)}</strong></div>
          <div><span>Year 1 deficit</span><strong>{trillions(first.annualDeficit)}</strong></div>
        </div>

        <div className="forecast-bars" aria-label="Component scenario debt path">
          {result.points.map(point => (
            <div className="forecast-row" key={point.year}>
              <span>Year {point.year}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${Math.max(5, (point.debt / final.debt) * 100)}%` }}
                />
              </div>
              <strong>{trillions(point.debt)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="assumptions-card premium-boundary">
        <p className="eyebrow">MODEL BOUNDARY</p>
        <h2>What this version does—and does not—claim</h2>
        <ul>
          {result.assumptions.map(assumption => <li key={assumption}>{assumption}</li>)}
        </ul>
      </section>
    </div>
  );
}
