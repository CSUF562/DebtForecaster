BEGIN;

CREATE TABLE IF NOT EXISTS daily_publications (
  publication_id TEXT PRIMARY KEY,
  record_date DATE NOT NULL,
  publication_status TEXT NOT NULL
    CHECK (publication_status IN ('publishable','blocked','insufficient-history')),
  latest_observation_id TEXT,
  prior_observation_id TEXT,
  context_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  unresolved_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  narrative JSONB,
  governance JSONB,
  release JSONB NOT NULL,
  content_hash CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS daily_publications_record_hash_uidx
  ON daily_publications (record_date, content_hash);

CREATE INDEX IF NOT EXISTS daily_publications_record_date_idx
  ON daily_publications (record_date DESC, created_at DESC);

COMMIT;
