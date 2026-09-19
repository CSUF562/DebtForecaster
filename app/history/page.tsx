import { getDebtSnapshot } from "../../src/application/debtSnapshot.js";

export const dynamic = "force-dynamic";

function dollarsTrillions(value: string): string {
  return `$${(Number(value) / 1_000_000_000_000).toFixed(3)}T`;
}

function chartPoints(values: number[], width: number, height: number): string {
  if (values.length === 0) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const step = values.length === 1 ? 0 : width / (values.length - 1);

  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default async function HistoryPage() {
  const snapshot = await getDebtSnapshot({ pageSize: 45 });
  const history = [...snapshot.history]
    .filter(item => item.validationStatus !== "fail")
    .sort((a, b) => a.recordDate.localeCompare(b.recordDate));

  const values = history.map(item =>
    Number(item.totalPublicDebtOutstanding)
  );
  const points = chartPoints(values, 1000, 260);

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">OBSERVED HISTORY</p>
        <h1>Recent debt history</h1>
        <p className="asof">
          Validated Treasury observations only. No modeled values appear on this page.
        </p>
      </section>

      <section className="what-changed">
        <div className="history-chart-wrap">
          {history.length > 1 ? (
            <svg
              className="history-chart"
              viewBox="0 0 1000 300"
              role="img"
              aria-label="Recent validated Treasury total public debt observations"
            >
              <line x1="0" y1="280" x2="1000" y2="280" className="chart-axis" />
              <polyline points={points} className="chart-line" />
            </svg>
          ) : (
            <p className="status warning">Not enough validated history to draw a trend.</p>
          )}
        </div>

        <div className="history-table" role="table" aria-label="Recent debt observations">
          <div className="history-row history-head" role="row">
            <span>Date</span>
            <span>Total debt</span>
            <span>Validation</span>
          </div>
          {[...history].reverse().slice(0, 15).map(item => (
            <div className="history-row" role="row" key={item.id}>
              <span>{item.recordDate}</span>
              <strong>{dollarsTrillions(item.totalPublicDebtOutstanding)}</strong>
              <span>{item.validationStatus}</span>
            </div>
          ))}
        </div>

        <p className="boundary">
          Source: U.S. Department of the Treasury, Debt to the Penny. This view shows observed accounting history, not a projection.
        </p>
      </section>
    </main>
  );
}
