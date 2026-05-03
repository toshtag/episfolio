CREATE TABLE IF NOT EXISTS growth_cycle_notes (
  id TEXT PRIMARY KEY,
  job_target_id TEXT NOT NULL REFERENCES job_targets(id) ON DELETE CASCADE,
  growth_stage TEXT CHECK (growth_stage IN ('startup', 'growth', 'stable_expansion')),
  stage_note TEXT,
  is_long_term_suitable INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_growth_cycle_notes_job_target
  ON growth_cycle_notes (job_target_id, created_at DESC);
