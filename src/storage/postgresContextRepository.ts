import { createHash } from "node:crypto";
import type { PoolClient, QueryResultRow } from "pg";
import type {
  ContextEvidence,
  ContextSourceTier,
  ContextConfidence
} from "../context/contextEvidence";
import { validateContextEvidence } from "../context/contextEvidence";
import { getDatabasePool, withTransaction } from "./postgresDebtRepository";

export type ContextSourceKey =
  | "treasury-yield-curve"
  | "cbo-monthly-budget-review"
  | "fed-fomc-statement";

export interface PersistedContextEvidence extends ContextEvidence {
  versionId: string;
  sourceKey: ContextSourceKey;
  contentHash: string;
  validationStatus: "pass" | "warning" | "fail";
  validationNotes: string[];
  revisionOfVersionId: string | null;
  supersededByVersionId: string | null;
}

interface ContextRow extends QueryResultRow {
  version_id: string;
  evidence_id: string;
  source_key: ContextSourceKey;
  event_date: string | Date;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  source_tier: ContextSourceTier;
  retrieved_at: string | Date;
  confidence: ContextConfidence;
  causal_claim: boolean;
  uncertainty_note: string;
  content_hash: string;
  revision_of_version_id: string | null;
  superseded_by_version_id: string | null;
  validation_status: "pass" | "warning" | "fail";
  validation_notes: string[];
}

function canonicalPayload(evidence: ContextEvidence): string {
  return JSON.stringify({
    id: evidence.id,
    eventDate: evidence.eventDate,
    title: evidence.title,
    summary: evidence.summary,
    sourceName: evidence.sourceName,
    sourceUrl: evidence.sourceUrl,
    sourceTier: evidence.sourceTier,
    confidence: evidence.confidence,
    causalClaim: evidence.causalClaim,
    uncertaintyNote: evidence.uncertaintyNote
  });
}

export function hashContextEvidence(evidence: ContextEvidence): string {
  return createHash("sha256")
    .update(canonicalPayload(evidence))
    .digest("hex");
}

function mapRow(row: ContextRow): PersistedContextEvidence {
  return {
    versionId: row.version_id,
    sourceKey: row.source_key,
    contentHash: row.content_hash,
    id: row.evidence_id,
    eventDate: new Date(row.event_date).toISOString().slice(0, 10),
    title: row.title,
    summary: row.summary,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    sourceTier: row.source_tier,
    retrievedAt: new Date(row.retrieved_at).toISOString(),
    confidence: row.confidence,
    revisionOfId: null,
    supersededById: null,
    causalClaim: row.causal_claim,
    uncertaintyNote: row.uncertainty_note,
    validationStatus: row.validation_status,
    validationNotes: row.validation_notes ?? [],
    revisionOfVersionId: row.revision_of_version_id,
    supersededByVersionId: row.superseded_by_version_id
  };
}

async function latestVersionForEvidence(
  client: PoolClient,
  evidenceId: string
): Promise<ContextRow | null> {
  const result = await client.query<ContextRow>(
    `
    SELECT *
    FROM context_evidence_versions
    WHERE evidence_id = $1
    ORDER BY retrieved_at DESC
    LIMIT 1
    `,
    [evidenceId]
  );

  return result.rows[0] ?? null;
}

export class PostgresContextEvidenceRepository {
  async save(
    sourceKey: ContextSourceKey,
    evidence: ContextEvidence
  ): Promise<{
    status: "inserted" | "duplicate" | "revised" | "rejected";
    record: PersistedContextEvidence | null;
  }> {
    const validationNotes = validateContextEvidence(evidence);
    const validationStatus =
      validationNotes.length === 0 ? "pass" : "fail";

    if (validationStatus === "fail") {
      return { status: "rejected", record: null };
    }

    const contentHash = hashContextEvidence(evidence);
    const versionId = `${evidence.id}-${contentHash.slice(0, 12)}`;

    return withTransaction(async client => {
      const existing = await latestVersionForEvidence(client, evidence.id);

      if (existing?.content_hash === contentHash) {
        return {
          status: "duplicate" as const,
          record: mapRow(existing)
        };
      }

      const revisionOfVersionId = existing?.version_id ?? null;

      const inserted = await client.query<ContextRow>(
        `
        INSERT INTO context_evidence_versions (
          version_id, evidence_id, source_key, event_date, title, summary,
          source_name, source_url, source_tier, retrieved_at, confidence,
          causal_claim, uncertainty_note, content_hash, revision_of_version_id,
          superseded_by_version_id, validation_status, validation_notes
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NULL,$16,$17::jsonb
        )
        ON CONFLICT (evidence_id, content_hash) DO NOTHING
        RETURNING *
        `,
        [
          versionId,
          evidence.id,
          sourceKey,
          evidence.eventDate,
          evidence.title,
          evidence.summary,
          evidence.sourceName,
          evidence.sourceUrl,
          evidence.sourceTier,
          evidence.retrievedAt,
          evidence.confidence,
          evidence.causalClaim,
          evidence.uncertaintyNote,
          contentHash,
          revisionOfVersionId,
          validationStatus,
          JSON.stringify(validationNotes)
        ]
      );

      if (inserted.rowCount !== 1) {
        const duplicate = await client.query<ContextRow>(
          `
          SELECT *
          FROM context_evidence_versions
          WHERE evidence_id = $1 AND content_hash = $2
          LIMIT 1
          `,
          [evidence.id, contentHash]
        );

        return {
          status: "duplicate" as const,
          record: duplicate.rows[0] ? mapRow(duplicate.rows[0]) : null
        };
      }

      if (revisionOfVersionId) {
        await client.query(
          `
          UPDATE context_evidence_versions
          SET superseded_by_version_id = $1
          WHERE version_id = $2
          `,
          [versionId, revisionOfVersionId]
        );
      }

      return {
        status: revisionOfVersionId ? "revised" as const : "inserted" as const,
        record: mapRow(inserted.rows[0])
      };
    });
  }

  async listLatestApplicable(
    asOfDate: string
  ): Promise<PersistedContextEvidence[]> {
    const result = await getDatabasePool().query<ContextRow>(
      `
      SELECT DISTINCT ON (source_key) *
      FROM context_evidence_versions
      WHERE event_date <= $1
        AND validation_status <> 'fail'
        AND superseded_by_version_id IS NULL
      ORDER BY source_key, event_date DESC, retrieved_at DESC
      `,
      [asOfDate]
    );

    return result.rows.map(mapRow);
  }

  async listLedger(limit = 100): Promise<PersistedContextEvidence[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      throw new Error("Evidence ledger limit must be between 1 and 500.");
    }

    const result = await getDatabasePool().query<ContextRow>(
      `
      SELECT *
      FROM context_evidence_versions
      ORDER BY event_date DESC, retrieved_at DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows.map(mapRow);
  }
}

let sharedRepository: PostgresContextEvidenceRepository | null = null;

export function getPostgresContextEvidenceRepository():
  PostgresContextEvidenceRepository {
  sharedRepository ??= new PostgresContextEvidenceRepository();
  return sharedRepository;
}
