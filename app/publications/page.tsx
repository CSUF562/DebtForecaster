import {
  getPostgresDailyPublicationRepository,
  type PersistedDailyPublication
} from "../../src/storage/postgresDailyPublicationRepository";

export const dynamic = "force-dynamic";

function fmtDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(value));
}

function fmtDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(new Date(value));
}

function describeChange(
  newer: PersistedDailyPublication,
  older: PersistedDailyPublication
): string[] {
  const changes: string[] = [];

  if (newer.contentHash !== older.contentHash) changes.push("content hash changed");
  if (newer.release.commitSha !== older.release.commitSha) changes.push("software release changed");
  if (JSON.stringify(newer.contextIds) !== JSON.stringify(older.contextIds)) {
    changes.push("context evidence set changed");
  }
  if (
    newer.narrative?.accounting !== older.narrative?.accounting ||
    newer.narrative?.context !== older.narrative?.context ||
    newer.narrative?.unresolved !== older.narrative?.unresolved
  ) {
    changes.push("published narrative changed");
  }
  if (newer.publicationStatus !== older.publicationStatus) {
    changes.push("publication status changed");
  }

  return changes;
}

export default async function PublicationsPage() {
  const records = process.env.DATABASE_URL
    ? await getPostgresDailyPublicationRepository().listRecent(100)
    : [];

  const byDate = new Map<string, PersistedDailyPublication[]>();

  for (const record of records) {
    const list = byDate.get(record.recordDate) ?? [];
    list.push(record);
    byDate.set(record.recordDate, list);
  }

  const dates = [...byDate.entries()].sort(([a], [b]) => b.localeCompare(a));

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">PUBLICATION ARCHIVE</p>
        <h1>What Enclave published, preserved by version.</h1>
        <p className="method">
          Each publication is immutable. If evidence or software changes later,
          a new publication can coexist with the earlier one rather than silently
          replacing it.
        </p>
      </section>

      <section className="what-changed">
        <div className="section-heading">
          <p className="eyebrow">ARCHIVED DAILY BRIEFS</p>
          <h2>{records.length} stored publications</h2>
        </div>

        <div className="publication-archive">
          {dates.map(([recordDate, versions]) => (
            <section className="publication-day" key={recordDate}>
              <div className="publication-day-header">
                <div>
                  <p className="eyebrow">RECORD DATE</p>
                  <h3>{fmtDate(recordDate)}</h3>
                </div>
                <span>{versions.length} version{versions.length === 1 ? "" : "s"}</span>
              </div>

              {versions.map((record, index) => {
                const older = versions[index + 1];
                const changes = older ? describeChange(record, older) : [];

                return (
                  <article className="ledger-card publication-card" key={record.publicationId}>
                    <div className="context-meta">
                      <span className="claim-label observed">{record.publicationStatus}</span>
                      <span className="materiality-label">
                        {index === 0 ? "latest archived version" : "prior version"}
                      </span>
                    </div>

                    <h3>{record.publicationId}</h3>

                    {record.narrative ? (
                      <div className="publication-narrative">
                        <h4>What Treasury shows</h4>
                        <p>{record.narrative.accounting}</p>

                        <h4>Relevant context</h4>
                        <p>{record.narrative.context ?? "No contextual narrative was published."}</p>

                        <h4>What remained unresolved</h4>
                        <p>{record.narrative.unresolved}</p>
                      </div>
                    ) : null}

                    <dl className="ledger-meta">
                      <div><dt>Published</dt><dd>{fmtDateTime(record.createdAt)}</dd></div>
                      <div><dt>Commit</dt><dd><code>{record.release.commitSha ?? "unavailable"}</code></dd></div>
                      <div><dt>Deployment</dt><dd><code>{record.release.deploymentId ?? "unavailable"}</code></dd></div>
                      <div><dt>Context records</dt><dd>{record.contextIds.length}</dd></div>
                      <div><dt>Content hash</dt><dd><code>{record.contentHash}</code></dd></div>
                      <div><dt>ERC13 protocol</dt><dd>{record.release.erc13ProtocolVersion}</dd></div>
                    </dl>

                    {older ? (
                      <div className="publication-diff">
                        <strong>Changed from previous archived version</strong>
                        {changes.length > 0 ? (
                          <ul>
                            {changes.map(change => <li key={change}>{change}</li>)}
                          </ul>
                        ) : (
                          <p>No material archived-field differences detected.</p>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </section>
          ))}

          {records.length === 0 ? (
            <p className="technical">
              No daily publications have been archived yet. The first publishable
              snapshot request will create the initial immutable record.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
