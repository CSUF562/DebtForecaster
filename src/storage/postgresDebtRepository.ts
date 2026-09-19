import { Pool, type PoolClient, type QueryResultRow } from "pg";
import type {
  DebtObservation,
  ValidationStatus
} from "../fiscal/debt.js";
import type { DebtObservationRepository } from "./debtRepository.js";

interface DebtObservationRow extends QueryResultRow {
  id: string;
  record_date: string;
  total_public_debt_outstanding: string;
  debt_held_by_public: string;
  intragovernmental_holdings: string;
  source_agency: string;
  source_dataset: string;
  source_record_id: string | null;
  retrieved_at: string;
  adapter_version: string;
  raw_payload_hash: string;
  validation_status: ValidationStatus;
  validation_notes: string[];
}

function mapRow(row: DebtObservationRow): DebtObservation {
  return {
    id: row.id,
    recordDate: row.record_date.slice(0, 10),
    totalPublicDebtOutstanding: row.total_public_debt_outstanding,
    debtHeldByPublic: row.debt_held_by_public,
    intragovernmentalHoldings: row.intragovernmental_holdings,
    sourceAgency: row.source_agency as "U.S. Department of the Treasury",
    sourceDataset: row.source_dataset as "Debt to the Penny",
    sourceRecordId: row.source_record_id,
    retrievedAt: new Date(row.retrieved_at).toISOString(),
    adapterVersion: row.adapter_version,
    rawPayloadHash: row.raw_payload_hash,
    validationStatus: row.validation_status,
    validationNotes: row.validation_notes ?? []
  };
}

export class PostgresDebtObservationRepository
  implements DebtObservationRepository
{
  constructor(private readonly pool: Pool) {}

  async save(observation: DebtObservation): Promise<"inserted" | "duplicate"> {
    const result = await this.pool.query(
      `
      INSERT INTO debt_observations (
        id,
        record_date,
        total_public_debt_outstanding,
        debt_held_by_public,
        intragovernmental_holdings,
        source_agency,
        source_dataset,
        source_record_id,
        retrieved_at,
        adapter_version,
        raw_payload_hash,
        validation_status,
        validation_notes
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb
      )
      ON CONFLICT (record_date, raw_payload_hash) DO NOTHING
      RETURNING id
      `,
      [
        observation.id,
        observation.recordDate,
        observation.totalPublicDebtOutstanding,
        observation.debtHeldByPublic,
        observation.intragovernmentalHoldings,
        observation.sourceAgency,
        observation.sourceDataset,
        observation.sourceRecordId,
        observation.retrievedAt,
        observation.adapterVersion,
        observation.rawPayloadHash,
        observation.validationStatus,
        JSON.stringify(observation.validationNotes)
      ]
    );

    return result.rowCount === 1 ? "inserted" : "duplicate";
  }

  async listByRecordDate(recordDate: string): Promise<DebtObservation[]> {
    const result = await this.pool.query<DebtObservationRow>(
      `
      SELECT *
      FROM debt_observations
      WHERE record_date = $1
      ORDER BY retrieved_at ASC
      `,
      [recordDate]
    );

    return result.rows.map(mapRow);
  }

  async listRecent(limit: number): Promise<DebtObservation[]> {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("Recent observation limit must be a positive integer");
    }

    const result = await this.pool.query<DebtObservationRow>(
      `
      SELECT *
      FROM debt_observations
      ORDER BY record_date DESC, retrieved_at DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows.map(mapRow);
  }
}

let sharedPool: Pool | null = null;

export function getDatabasePool(): Pool {
  if (!sharedPool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is required for PostgreSQL persistence.");
    }

    sharedPool = new Pool({
      connectionString,
      ssl:
        process.env.DATABASE_SSL === "disable"
          ? false
          : { rejectUnauthorized: false }
    });
  }

  return sharedPool;
}

export function getPostgresDebtRepository(): PostgresDebtObservationRepository {
  return new PostgresDebtObservationRepository(getDatabasePool());
}

export async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getDatabasePool().connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}


export interface IngestionRunSummary {
  sourceDataset: string;
  startedAt: string;
  completedAt: string;
  status: "success" | "partial" | "failed";
  recordsReceived: number;
  recordsInserted: number;
  recordsRejected: number;
  errorMessage: string | null;
  adapterVersion: string;
}

export async function recordIngestionRun(
  summary: IngestionRunSummary
): Promise<void> {
  const pool = getDatabasePool();

  await pool.query(
    `
    INSERT INTO ingestion_runs (
      source_dataset,
      started_at,
      completed_at,
      status,
      records_received,
      records_inserted,
      records_rejected,
      error_message,
      adapter_version
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `,
    [
      summary.sourceDataset,
      summary.startedAt,
      summary.completedAt,
      summary.status,
      summary.recordsReceived,
      summary.recordsInserted,
      summary.recordsRejected,
      summary.errorMessage,
      summary.adapterVersion
    ]
  );
}
