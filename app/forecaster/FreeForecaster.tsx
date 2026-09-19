"use client";

import { useMemo, useState } from "react";
import { forecastDebtPath } from "../../src/forecast/freeForecaster";

function trillions(value: number): string {
  return `$${value.toFixed(2)}T`;
}

export function FreeForecaster({
  baselineDebt
}: {
  baselineDebt: number;
}) {
  const [annualDeficit, setAnnualDeficit] = useState(2);
  const [annualChange, setAnnualChange] = useState(0);
  const [years, setYears] = useState(5);

  const result = useMemo(
    () =>
      forecastDebtPath({
        baselineDebt,
        baselineAnnualDeficit: annualDeficit,
        annualDeficitChangePercent: annualChange,
        years
      }),
    [baselineDebt, annualDeficit, annualChange, years]
  );

  const final = result.points[result.points.length - 1];

  return (
    <div className="forecaster-layout">
      <section className="control-panel">
        <div className="control">
          <label htmlFor="deficit">Starting annual deficit</label>
          <strong>{trillions(annualDeficit)}</strong>
          <input
            id="deficit"
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={annualDeficit}
            onChange={event => setAnnualDeficit(Number(event.target.value))}
          />
        </div>

        <div className="control">
          <label htmlFor="change">Annual deficit change</label>
          <strong>{annualChange.toFixed(1)}%</strong>
          <input
            id="change"
            type="range"
            min="-10"
            max="15"
            step="0.5"
            value={annualChange}
            onChange={event => setAnnualChange(Number(event.target.value))}
          />
        </div>

        <div className="horizon-control">
          <span>Horizon</span>
          {[1, 5, 10].map(value => (
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
      </section>

      <section className="forecast-output">
        <span className="claim-label modeled">modeled</span>
        <p className="forecast-number">{trillions(final.debt)}</p>
        <p className="asof">Modeled debt after {years} year{years === 1 ? "" : "s"}</p>

        <div className="forecast-bars" aria-label="Modeled debt path">
          {result.points.map(point => {
            const width = Math.max(
              5,
              (point.debt / final.debt) * 100
            );

            return (
              <div className="forecast-row" key={point.year}>
                <span>Year {point.year}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${width}%` }} />
                </div>
                <strong>{trillions(point.debt)}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className="assumptions-card">
        <p className="eyebrow">MODEL BOUNDARY</p>
        <h2>What this does not know</h2>
        <ul>
          {result.assumptions.map(assumption => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
