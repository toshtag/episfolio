CREATE TABLE IF NOT EXISTS business_unit_type_matches (
  id TEXT PRIMARY KEY,
  job_target_id TEXT NOT NULL REFERENCES job_targets(id) ON DELETE CASCADE,
  company_unit_type TEXT CHECK (company_unit_type IN ('star', 'support', 'challenge', 'turnaround')),
  self_type TEXT CHECK (self_type IN ('star', 'support', 'challenge', 'turnaround')),
  is_match_confirmed INTEGER NOT NULL DEFAULT 0,
  match_note TEXT,
  motivation_draft TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_business_unit_type_matches_job_target
  ON business_unit_type_matches (job_target_id, created_at DESC);
