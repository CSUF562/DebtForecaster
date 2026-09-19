import { getDebtSnapshot } from "../../src/application/debtSnapshot";
import { FreeForecaster } from "./FreeForecaster";

export const dynamic = "force-dynamic";

function toTrillions(value: string): number {
  return Number(value) / 1_000_000_000_000;
}

export default async function ForecasterPage() {
  const snapshot = await getDebtSnapshot();

  if (!snapshot.latest) {
    return (
      <main className="shell">
        <section className="hero">
          <p className="eyebrow">FREE FORECASTER</p>
          <h1>Scenario modeling unavailable</h1>
          <p className="status warning">
            A validated Treasury baseline is required before Enclave can build a scenario.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">FREE FORECASTER</p>
        <h1>Explore a debt path</h1>
        <p className="asof">
          Start from the latest validated Treasury debt observation, then change one simple assumption at a time.
        </p>
      </section>

      <section className="what-changed">
        <FreeForecaster
          baselineDebt={toTrillions(snapshot.latest.totalPublicDebtOutstanding)}
        />
      </section>
    </main>
  );
}
