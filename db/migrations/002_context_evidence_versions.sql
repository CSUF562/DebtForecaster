BEGIN;

CREATE TABLE IF NOT EXISTS context_evidence_versions (
  version_id TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL,
  source_key TEXT NOT NULL,
  event_date DATE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_tier TEXT NOT NULL
    CHECK (source_tier IN (
      'primary-government',
      'primary-institutional',
      'reputable-secondary',
      'other'
    )),
  retrieved_at TIMESTAMPTZ NOT NULL,
  confidence TEXT NOT NULL
    CHECK (confidence IN ('high', 'medium', 'low')),
  causal_claim BOOLEAN NOT NULL DEFAULT FALSE
    CHECK (causal_claim = FALSE),
  uncertainty_note TEXT NOT NULL,
  content_hash CHAR(64) NOT NULL,
  revision_of_version_id TEXT
    REFERENCES context_evidence_versions(version_id),
  superseded_by_version_id TEXT
    REFERENCES context_evidence_versions(version_id),
  validation_status TEXT NOT NULL
    CHECK (validation_status IN ('pass', 'warning', 'fail')),
  validation_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (evidence_id, content_hash)
);

CREATE INDEX IF NOT EXISTS context_evidence_source_date_idx
  ON context_evidence_versions (
    source_key,
    event_date DESC,
    retrieved_at DESC
  );

CREATE INDEX IF NOT EXISTS context_evidence_evidence_id_idx
  ON context_evidence_versions (
    evidence_id,
    retrieved_at DESC
  );

COMMIT;
