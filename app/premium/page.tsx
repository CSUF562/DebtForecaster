import { getDebtSnapshot } from "../../src/application/debtSnapshot";
import { ComponentSimulator } from "./ComponentSimulator";

export const dynamic = "force-dynamic";

function toTrillions(value: string): number {
  return Number(value) / 1_000_000_000_000;
}

export default async function PremiumPage() {
  const snapshot = await getDebtSnapshot();

  if (!snapshot.latest) {
    return (
      <main className="shell">
        <section className="hero">
          <p className="eyebrow">ENCLAVE PREMIUM · DEVELOPMENT PREVIEW</p>
          <h1>Component simulator unavailable</h1>
          <p className="status warning">A validated Treasury debt baseline is required before this scenario can run.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="hero premium-hero">
        <div>
          <p className="eyebrow">ENCLAVE PREMIUM · DEVELOPMENT PREVIEW</p>
          <h1>Build a fiscal scenario</h1>
          <p className="asof">
            Change federal spending and revenue components independently, then inspect the modeled 1-, 5-, or 10-year debt path.
          </p>
        </div>
        <span className="premium-badge">PREMIUM MODEL</span>
      </section>

      <section className="what-changed">
        <ComponentSimulator baselineDebt={toTrillions(snapshot.latest.totalPublicDebtOutstanding)} />
      </section>
    </main>
  );
}
