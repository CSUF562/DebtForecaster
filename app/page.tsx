import { getDebtSnapshot } from "../src/application/debtSnapshot.js";

export const dynamic = "force-dynamic";

function formatDollars(value: string): string {
  const [whole, fraction = "00"] = value.split(".");
  const negative = whole.startsWith("-");
  const unsigned = negative ? whole.slice(1) : whole;
  const grouped = unsigned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}$${grouped}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

function changeLabel(value: string | null | undefined): string {
  if (!value) return "Not enough history";
  const formatted = formatDollars(value);
  return value.startsWith("-") ? formatted : `+${formatted}`;
}

export default async function HomePage() {
  try {
    const snapshot = await getDebtSnapshot();

    if (!snapshot.latest) {
      return (
        <main className="shell">
          <section className="hero">
            <p className="eyebrow">PROJECT ENCLAVE</p>
            <h1>U.S. National Debt</h1>
            <p className="status warning">
              No validated Treasury observation is currently available.
            </p>
          </section>
        </main>
      );
    }

    const latest = snapshot.latest;
    const freshness = snapshot.freshness;

    return (
      <main className="shell">
        <section className="hero">
          <div className="topline">
            <p className="eyebrow">PROJECT ENCLAVE</p>
            <span className={`freshness ${freshness?.status ?? "stale"}`}>
              {freshness?.status ?? "unknown"}
            </span>
          </div>

          <h1>U.S. National Debt</h1>
          <p className="debt">{formatDollars(latest.totalPublicDebtOutstanding)}</p>
          <p className="asof">
            Treasury record date: {latest.recordDate}
          </p>

          {!snapshot.publication.canPresentAsCurrent && (
            <p className="status warning">
              {snapshot.publication.reason}
            </p>
          )}
        </section>

        <section className="grid" aria-label="Debt components and recent changes">
          <article className="card">
            <h2>Held by the Public</h2>
            <p>{formatDollars(latest.debtHeldByPublic)}</p>
            <small>Observed Treasury accounting</small>
          </article>

          <article className="card">
            <h2>Intragovernmental Holdings</h2>
            <p>{formatDollars(latest.intragovernmentalHoldings)}</p>
            <small>Observed Treasury accounting</small>
          </article>

          <article className="card">
            <h2>Previous Observation</h2>
            <p>{changeLabel(snapshot.trends.previous?.absoluteChange)}</p>
            <small>Derived from cited observations</small>
          </article>

          <article className="card">
            <h2>7-Day Change</h2>
            <p>{changeLabel(snapshot.trends.sevenDay?.absoluteChange)}</p>
            <small>Derived, not a causal explanation</small>
          </article>

          <article className="card">
            <h2>30-Day Change</h2>
            <p>{changeLabel(snapshot.trends.thirtyDay?.absoluteChange)}</p>
            <small>Derived, not a forecast</small>
          </article>

          <article className="card evidence">
            <h2>Evidence</h2>
            <p>U.S. Department of the Treasury</p>
            <small>
              Debt to the Penny · adapter {latest.adapterVersion} · validation {latest.validationStatus}
            </small>
          </article>
        </section>

        <section className="method">
          <p>
            Enclave distinguishes observed accounting facts from derived measures,
            contextual evidence, modeled projections, and hypotheses.
          </p>
          <p>
            Daily debt movement alone does not establish why the debt changed.
          </p>
        </section>
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown source error";

    return (
      <main className="shell">
        <section className="hero">
          <p className="eyebrow">PROJECT ENCLAVE</p>
          <h1>U.S. National Debt</h1>
          <p className="status warning">
            Treasury data could not be validated right now. Enclave will not substitute an unverified headline value.
          </p>
          <p className="technical">{message}</p>
        </section>
      </main>
    );
  }
}
