import { getPostgresContextEvidenceRepository } from "../../src/storage/postgresContextRepository";

export const dynamic = "force-dynamic";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(new Date(value));
}

export default async function EvidencePage() {
  const records = process.env.DATABASE_URL
    ? await getPostgresContextEvidenceRepository().listLedger(200)
    : [];

  const current = records.filter(record => !record.supersededByVersionId);
  const superseded = records.filter(record => Boolean(record.supersededByVersionId));

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">EVIDENCE LEDGER</p>
        <h1>What Enclave knew, when it knew it.</h1>
        <p className="method">
          This ledger exposes persisted contextual evidence, retrieval times,
          validation state, content hashes, and revision lineage. A later source
          revision does not erase the earlier version.
        </p>
      </section>

      <section className="what-changed">
        <div className="section-heading">
          <p className="eyebrow">CURRENT VERSIONS</p>
          <h2>{current.length} active evidence records</h2>
        </div>

        <div className="ledger-list">
          {current.map(record => (
            <article className="ledger-card" key={record.versionId}>
              <div className="context-meta">
                <span className="claim-label contextual">{record.sourceKey}</span>
                <span className="materiality-label">
                  {record.validationStatus}
                </span>
              </div>

              <h3>{record.title}</h3>
              <p>{record.summary}</p>

              <dl className="ledger-meta">
                <div><dt>Event date</dt><dd>{formatDate(record.eventDate)}</dd></div>
                <div><dt>Retrieved</dt><dd>{formatDateTime(record.retrievedAt)}</dd></div>
                <div><dt>Source</dt><dd>{record.sourceName}</dd></div>
                <div><dt>Confidence</dt><dd>{record.confidence}</dd></div>
                <div><dt>Version</dt><dd><code>{record.versionId}</code></dd></div>
                <div><dt>Hash</dt><dd><code>{record.contentHash}</code></dd></div>
              </dl>

              <p className="context-boundary">{record.uncertaintyNote}</p>

              <a
                className="challenge-link"
                href={record.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Inspect primary source
              </a>
            </article>
          ))}

          {current.length === 0 ? (
            <p className="technical">
              No persisted contextual evidence is available yet.
            </p>
          ) : null}
        </div>
      </section>

      <section className="what-changed">
        <div className="section-heading">
          <p className="eyebrow">REVISION HISTORY</p>
          <h2>{superseded.length} superseded versions retained</h2>
        </div>

        <div className="ledger-list">
          {superseded.map(record => (
            <article className="ledger-card ledger-card-superseded" key={record.versionId}>
              <div className="context-meta">
                <span className="claim-label unresolved">superseded</span>
                <span className="materiality-label">{record.sourceKey}</span>
              </div>

              <h3>{record.title}</h3>
              <p>{record.summary}</p>

              <dl className="ledger-meta">
                <div><dt>Version</dt><dd><code>{record.versionId}</code></dd></div>
                <div><dt>Superseded by</dt><dd><code>{record.supersededByVersionId}</code></dd></div>
                <div><dt>Retrieved</dt><dd>{formatDateTime(record.retrievedAt)}</dd></div>
                <div><dt>Hash</dt><dd><code>{record.contentHash}</code></dd></div>
              </dl>
            </article>
          ))}

          {superseded.length === 0 ? (
            <p className="technical">
              No source revisions have been recorded yet.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
