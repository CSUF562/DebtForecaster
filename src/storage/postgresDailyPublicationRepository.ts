import { createHash } from "node:crypto";
import type { QueryResultRow } from "pg";
import type { DailyAccountingBrief } from "../application/dailyBrief";
import { getDatabasePool } from "./postgresDebtRepository";

export interface PersistedDailyPublication {
  publicationId: string;
  recordDate: string;
  publicationStatus: DailyAccountingBrief["publicationStatus"];
  latestObservationId: string | null;
  priorObservationId: string | null;
  contextIds: string[];
  unresolvedIds: string[];
  narrative: DailyAccountingBrief["narrative"];
  governance: DailyAccountingBrief["governance"];
  release: DailyAccountingBrief["release"];
  contentHash: string;
  createdAt: string;
}

interface PublicationRow extends QueryResultRow {
  publication_id: string;
  record_date: string | Date;
  publication_status: DailyAccountingBrief["publicationStatus"];
  latest_observation_id: string | null;
  prior_observation_id: string | null;
  context_ids: string[];
  unresolved_ids: string[];
  narrative: DailyAccountingBrief["narrative"];
  governance: DailyAccountingBrief["governance"];
  release: DailyAccountingBrief["release"];
  content_hash: string;
  created_at: string | Date;
}

function canonicalPayload(brief: DailyAccountingBrief): string {
  return JSON.stringify({
    publicationId: brief.publicationId,
    latestObservationId: brief.latestObservationId,
    priorObservationId: brief.priorObservationId,
    publicationStatus: brief.publicationStatus,
    narrative: brief.narrative,
    contextIds: brief.context.map(item => item.id),
    unresolvedIds: brief.unresolved.map(item => item.id),
    governance: brief.governance,
    release: brief.release
  });
}

export function hashDailyPublication(brief: DailyAccountingBrief): string {
  return createHash("sha256")
    .update(canonicalPayload(brief))
    .digest("hex");
}

function mapRow(row: PublicationRow): PersistedDailyPublication {
  return {
    publicationId: row.publication_id,
    recordDate: new Date(row.record_date).toISOString().slice(0, 10),
    publicationStatus: row.publication_status,
    latestObservationId: row.latest_observation_id,
    priorObservationId: row.prior_observation_id,
    contextIds: row.context_ids ?? [],
    unresolvedIds: row.unresolved_ids ?? [],
    narrative: row.narrative,
    governance: row.governance,
    release: row.release,
    contentHash: row.content_hash,
    createdAt: new Date(row.created_at).toISOString()
  };
}

export class PostgresDailyPublicationRepository {
  async save(
    recordDate: string,
    brief: DailyAccountingBrief
  ): Promise<{
    status: "inserted" | "duplicate" | "skipped";
    record: PersistedDailyPublication | null;
  }> {
    if (
      brief.publicationStatus !== "publishable" ||
      !brief.publicationId
    ) {
      return { status: "skipped", record: null };
    }

    const contentHash = hashDailyPublication(brief);

    const result = await getDatabasePool().query<PublicationRow>(
      `
      INSERT INTO daily_publications (
        publication_id,
        record_date,
        publication_status,
        latest_observation_id,
        prior_observation_id,
        context_ids,
        unresolved_ids,
        narrative,
        governance,
        release,
        content_hash
      )
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11)
      ON CONFLICT (publication_id) DO NOTHING
      RETURNING *
      `,
      [
        brief.publicationId,
        recordDate,
        brief.publicationStatus,
        brief.latestObservationId,
        brief.priorObservationId,
        JSON.stringify(brief.context.map(item => item.id)),
        JSON.stringify(brief.unresolved.map(item => item.id)),
        JSON.stringify(brief.narrative),
        JSON.stringify(brief.governance),
        JSON.stringify(brief.release),
        contentHash
      ]
    );

    if (result.rowCount === 1) {
      return { status: "inserted", record: mapRow(result.rows[0]) };
    }

    const duplicate = await getDatabasePool().query<PublicationRow>(
      `
      SELECT *
      FROM daily_publications
      WHERE publication_id = $1
      LIMIT 1
      `,
      [brief.publicationId]
    );

    return {
      status: "duplicate",
      record: duplicate.rows[0] ? mapRow(duplicate.rows[0]) : null
    };
  }

  async getById(
    publicationId: string
  ): Promise<PersistedDailyPublication | null> {
    const result = await getDatabasePool().query<PublicationRow>(
      `
      SELECT *
      FROM daily_publications
      WHERE publication_id = $1
      LIMIT 1
      `,
      [publicationId]
    );

    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async listByDate(
    recordDate: string
  ): Promise<PersistedDailyPublication[]> {
    const result = await getDatabasePool().query<PublicationRow>(
      `
      SELECT *
      FROM daily_publications
      WHERE record_date = $1
      ORDER BY created_at DESC
      `,
      [recordDate]
    );

    return result.rows.map(mapRow);
  }

  async listRecent(limit = 30): Promise<PersistedDailyPublication[]> {
    const result = await getDatabasePool().query<PublicationRow>(
      `
      SELECT *
      FROM daily_publications
      ORDER BY record_date DESC, created_at DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows.map(mapRow);
  }
}

let sharedRepository: PostgresDailyPublicationRepository | null = null;

export function getPostgresDailyPublicationRepository():
  PostgresDailyPublicationRepository {
  sharedRepository ??= new PostgresDailyPublicationRepository();
  return sharedRepository;
}
