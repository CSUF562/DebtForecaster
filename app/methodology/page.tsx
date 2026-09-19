export const metadata = {
  title: "Enclave Methodology & Challenge Process"
};

export default function MethodologyPage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">PROJECT ENCLAVE</p>
        <h1>Methodology & Contestability</h1>
        <p className="asof">
          Enclave is designed so a published explanation can be inspected, challenged, and revised.
        </p>
      </section>

      <section className="what-changed">
        <div className="section-heading">
          <p className="eyebrow">HOW TO READ AN ENCLAVE BRIEF</p>
          <h2>Evidence before narrative</h2>
        </div>
        <div className="claims">
          <article className="claim"><span className="claim-label observed">observed</span><p>Direct source records, such as Treasury accounting observations.</p></article>
          <article className="claim"><span className="claim-label derived">derived</span><p>Deterministic calculations whose inputs remain inspectable.</p></article>
          <article className="claim"><span className="claim-label contextual">contextual</span><p>Documented events that may be relevant but do not establish causation by themselves.</p></article>
          <article className="claim"><span className="claim-label hypothesis">hypothesis</span><p>Candidate explanations that remain subject to competing explanations and counterevidence.</p></article>
          <article className="claim"><span className="claim-label unresolved">unresolved</span><p>Questions for which the evidence does not yet justify a stronger conclusion.</p></article>
        </div>
      </section>

      <section className="what-changed">
        <div className="section-heading">
          <p className="eyebrow">REVISION POLICY</p>
          <h2>What changes the record?</h2>
        </div>
        <p className="boundary">
          Source revisions, new primary evidence, material counterevidence, model-version changes,
          and changes in assessed materiality require reassessment. Earlier versions should be preserved
          rather than silently overwritten.
        </p>
      </section>

      <section className="what-changed" id="challenge">
        <div className="section-heading">
          <p className="eyebrow">CHALLENGE PATH</p>
          <h2>Contest an explanation</h2>
        </div>
        <p className="boundary">
          A challenge should identify the claim being contested, the evidence or assumption at issue,
          and any source that could change the assessment. Challenges are review inputs, not automatic
          corrections; they must pass the same provenance and evidence rules as the original brief.
        </p>
        <a className="challenge-link" href="https://github.com/CSUF562/DebtForecaster/issues/new" target="_blank" rel="noreferrer">
          Open a public evidence challenge
        </a>
      </section>
    </main>
  );
}
