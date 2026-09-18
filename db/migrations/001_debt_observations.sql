BEGIN;

CREATE TABLE IF NOT EXISTS debt_observations (
  id TEXT PRIMARY KEY,
  record_date DATE NOT NULL,
  total_public_debt_outstanding NUMERIC(30,2) NOT NULL,
  debt_held_by_public NUMERIC(30,2) NOT NULL,
  intragovernmental_holdings NUMERIC(30,2) NOT NULL,
  source_agency TEXT NOT NULL,
  source_dataset TEXT NOT NULL,
  source_record_id TEXT,
  retrieved_at TIMESTAMPTZ NOT NULL,
  adapter_version TEXT NOT NULL,
  raw_payload_hash CHAR(64) NOT NULL,
  validation_status TEXT NOT NULL
    CHECK (validation_status IN ('pass', 'warning', 'fail')),
  validation_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (record_date, raw_payload_hash)
);

CREATE INDEX IF NOT EXISTS debt_observations_record_date_idx
  ON debt_observations (record_date DESC, retrieved_at DESC);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id BIGSERIAL PRIMARY KEY,
  source_dataset TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL
    CHECK (status IN ('running', 'success', 'partial', 'failed')),
  records_received INTEGER,
  records_inserted INTEGER,
  records_rejected INTEGER,
  error_message TEXT,
  adapter_version TEXT NOT NULL
);

COMMIT;
