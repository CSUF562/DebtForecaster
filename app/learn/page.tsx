import Link from "next/link";

const lessons = [
  {
    number: "01",
    title: "Debt is not the same thing as the deficit",
    body:
      "The federal deficit is the gap between what the government spends and what it collects over a period of time, usually a fiscal year. The national debt is the accumulated amount the federal government owes after years of borrowing, adjusted by other financing activity.",
    takeaway: "Deficit is a flow. Debt is a stock."
  },
  {
    number: "02",
    title: "The debt has two major components",
    body:
      "Debt held by the public is Treasury debt held outside federal government accounts, including by investors, institutions, state and local governments, foreign holders, and the Federal Reserve. Intragovernmental holdings are Treasury securities held by federal trust funds and other government accounts.",
    takeaway: "Enclave shows both because together they make up total public debt outstanding."
  },
  {
    number: "03",
    title: "Why can the debt change from one day to the next?",
    body:
      "Treasury financing activity changes as the government receives cash, makes payments, issues securities, redeems securities, and moves balances through federal accounts. A daily accounting change tells us what changed in the reported totals. It does not, by itself, prove why every dollar changed.",
    takeaway: "Accounting establishes movement before causation."
  },
  {
    number: "04",
    title: "Why debt-to-GDP matters",
    body:
      "A dollar amount alone does not tell you how large a debt burden is relative to the economy supporting it. Debt-to-GDP compares debt with annual economic output and is one common way to discuss fiscal scale. It is useful context, not an automatic default trigger or a complete measure of fiscal health.",
    takeaway: "Ratios add context, but no single ratio explains everything."
  },
  {
    number: "05",
    title: "The debt ceiling is not the same as new spending",
    body:
      "The statutory debt limit governs Treasury's authority to borrow to meet federal obligations already created under existing law. Debates over the debt limit are related to fiscal policy, but raising or suspending the limit does not itself create a new spending program.",
    takeaway: "Borrowing authority and spending decisions are connected, but they are not identical."
  },
  {
    number: "06",
    title: "How Enclave wants you to read evidence",
    body:
      "Enclave separates observed accounting facts, derived measures, contextual evidence, modeled projections, hypotheses, and unresolved knowledge. That distinction is deliberate. A nearby economic event may be relevant context without being proven as the cause of a specific daily debt movement.",
    takeaway: "The strongest answer is sometimes: we know this much, and not yet more."
  }
];

const glossary = [
  ["National debt", "The total outstanding federal debt reported by Treasury."],
  ["Deficit", "When federal outlays exceed federal receipts over a period of time."],
  ["Surplus", "When federal receipts exceed federal outlays over a period of time."],
  ["Debt held by the public", "Federal debt held outside federal government accounts."],
  ["Intragovernmental holdings", "Treasury securities held by federal government accounts and trust funds."],
  ["Treasury security", "A federal borrowing instrument such as a bill, note, bond, or other Treasury security."],
  ["Debt-to-GDP", "A ratio comparing debt with the size of the economy."],
  ["Primary source", "The original government or institutional record rather than a secondary interpretation."],
  ["Modeled projection", "A scenario produced from assumptions. It is not an observed fact or guaranteed forecast."],
  ["Unresolved knowledge", "A question for which the available evidence does not yet justify a stronger conclusion."]
];

export default function LearnPage() {
  return (
    <main className="shell">
      <section className="hero learn-hero">
        <p className="eyebrow">LEARN · NATIONAL DEBT 101</p>
        <h1>Understand the numbers before you try to change them.</h1>
        <p className="learn-intro">
          A short course for first-time Enclave users. No economics degree,
          congressional hearing, or ceremonial stack of binders required.
        </p>
        <div className="learn-meta">
          <span>6 short lessons</span>
          <span>Beginner level</span>
          <span>About 10 minutes</span>
        </div>
      </section>

      <section className="what-changed learn-start">
        <div className="section-heading">
          <p className="eyebrow">START HERE</p>
          <h2>How to use Enclave</h2>
        </div>

        <div className="learn-flow">
          <div>
            <strong>1</strong>
            <h3>Read Today</h3>
            <p>Start with the latest Treasury debt figure and recent accounting changes.</p>
          </div>
          <div>
            <strong>2</strong>
            <h3>Separate fact from context</h3>
            <p>Notice what is observed, derived, contextual, modeled, or unresolved.</p>
          </div>
          <div>
            <strong>3</strong>
            <h3>Check the evidence</h3>
            <p>Use the Evidence Ledger when you want the source, revision history, and provenance.</p>
          </div>
          <div>
            <strong>4</strong>
            <h3>Then use the Forecaster</h3>
            <p>Change assumptions only after you understand which parts are historical and which are modeled.</p>
          </div>
        </div>

        <div className="learn-actions">
          <Link className="challenge-link" href="/">Open Today</Link>
          <Link className="challenge-link" href="/evidence">Open Evidence Ledger</Link>
          <Link className="challenge-link" href="/forecaster">Open Forecaster</Link>
        </div>
      </section>

      <section className="what-changed">
        <div className="section-heading">
          <p className="eyebrow">QUICK COURSE</p>
          <h2>National Debt 101</h2>
        </div>

        <div className="lesson-list">
          {lessons.map(lesson => (
            <article className="lesson-card" key={lesson.number}>
              <div className="lesson-number">{lesson.number}</div>
              <div>
                <h3>{lesson.title}</h3>
                <p>{lesson.body}</p>
                <p className="lesson-takeaway">
                  <strong>Remember:</strong> {lesson.takeaway}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="what-changed">
        <div className="section-heading">
          <p className="eyebrow">COMMON MIX-UPS</p>
          <h2>Three things not to confuse</h2>
        </div>

        <div className="misconception-grid">
          <article>
            <strong>Debt ≠ deficit</strong>
            <p>The deficit describes a period. The debt is an accumulated balance.</p>
          </article>
          <article>
            <strong>Context ≠ cause</strong>
            <p>Two things happening at the same time does not establish a causal link.</p>
          </article>
          <article>
            <strong>Scenario ≠ prediction</strong>
            <p>A modeled outcome depends on assumptions. Change the assumptions and the scenario can change.</p>
          </article>
        </div>
      </section>

      <section className="what-changed">
        <div className="section-heading">
          <p className="eyebrow">GLOSSARY</p>
          <h2>Words you will see in Enclave</h2>
        </div>

        <dl className="learn-glossary">
          {glossary.map(([term, definition]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{definition}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="what-changed learn-finish">
        <div className="section-heading">
          <p className="eyebrow">YOU'RE READY</p>
          <h2>Put the course to work</h2>
        </div>
        <p>
          Go back to Today and identify three things: the observed Treasury figure,
          one derived trend, and one statement Enclave deliberately leaves unresolved.
          Then open the Forecaster and remember that its output is modeled rather than observed.
        </p>
        <div className="learn-actions">
          <Link className="challenge-link" href="/">Return to Today</Link>
          <Link className="challenge-link" href="/history">Explore History</Link>
          <Link className="challenge-link" href="/forecaster">Try the Forecaster</Link>
        </div>
      </section>
    </main>
  );
}
