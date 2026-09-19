import Link from "next/link";
import { comparePublications } from "../../src/application/publicationComparison";
import { getPostgresDailyPublicationRepository } from "../../src/storage/postgresDailyPublicationRepository";

export const dynamic = "force-dynamic";

interface ComparePageProps {
  searchParams: Promise<{
    left?: string;
    right?: string;
  }>;
}

export default async function ComparePublicationsPage({
  searchParams
}: ComparePageProps) {
  const params = await searchParams;
  const repository = process.env.DATABASE_URL
    ? getPostgresDailyPublicationRepository()
    : null;

  const recent = repository ? await repository.listRecent(100) : [];

  const left = params.left && repository
    ? await repository.getById(params.left)
    : null;
  const right = params.right && repository
    ? await repository.getById(params.right)
    : null;

  const comparison =
    left && right ? comparePublications(left, right) : null;

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">PUBLICATION COMPARISON</p>
        <h1>Inspect what changed between two archived briefs.</h1>
        <p className="method">
          This comparison reports structural differences only. It does not rank
          one publication as better, worse, more correct, or more important.
        </p>
      </section>

      <section className="what-changed">
        <form className="compare-form" action="/compare-publications" method="get">
          <label>
            Left publication
            <select name="left" defaultValue={params.left ?? ""}>
              <option value="">Choose a publication</option>
              {recent.map(record => (
                <option key={record.publicationId} value={record.publicationId}>
                  {record.recordDate} · {record.publicationId}
                </option>
              ))}
            </select>
          </label>

          <label>
            Right publication
            <select name="right" defaultValue={params.right ?? ""}>
              <option value="">Choose a publication</option>
              {recent.map(record => (
                <option key={record.publicationId} value={record.publicationId}>
                  {record.recordDate} · {record.publicationId}
                </option>
              ))}
            </select>
          </label>

          <button type="submit">Compare publications</button>
        </form>
      </section>

      {comparison && left && right ? (
        <section className="what-changed">
          <div className="section-heading">
            <p className="eyebrow">COMPARISON RESULT</p>
            <h2>{comparison.details.length} tracked result{comparison.details.length === 1 ? "" : "s"}</h2>
          </div>

          <div className="comparison-grid">
            <article className="ledger-card">
              <p className="eyebrow">LEFT</p>
              <h3>{left.publicationId}</h3>
              <p>{left.recordDate}</p>
              <code>{left.contentHash}</code>
            </article>

            <article className="ledger-card">
              <p className="eyebrow">RIGHT</p>
              <h3>{right.publicationId}</h3>
              <p>{right.recordDate}</p>
              <code>{right.contentHash}</code>
            </article>
          </div>

          <div className="publication-diff">
            <strong>
              {comparison.sameRecordDate
                ? "Same record date"
                : "Different record dates"}
            </strong>
            <ul>
              {comparison.details.map(detail => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </div>

          <div className="comparison-sections">
            <article className="ledger-card">
              <h3>Accounting narrative</h3>
              <p><strong>Left:</strong> {left.narrative?.accounting ?? "None"}</p>
              <p><strong>Right:</strong> {right.narrative?.accounting ?? "None"}</p>
            </article>

            <article className="ledger-card">
              <h3>Context narrative</h3>
              <p><strong>Left:</strong> {left.narrative?.context ?? "None"}</p>
              <p><strong>Right:</strong> {right.narrative?.context ?? "None"}</p>
            </article>

            <article className="ledger-card">
              <h3>Unresolved narrative</h3>
              <p><strong>Left:</strong> {left.narrative?.unresolved ?? "None"}</p>
              <p><strong>Right:</strong> {right.narrative?.unresolved ?? "None"}</p>
            </article>
          </div>
        </section>
      ) : null}

      <p className="method">
        <Link className="method-link" href="/publications">
          Return to Publication Archive
        </Link>
      </p>
    </main>
  );
}
