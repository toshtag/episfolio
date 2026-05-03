CREATE TABLE IF NOT EXISTS recruitment_impressions (
  id TEXT PRIMARY KEY,
  job_target_id TEXT NOT NULL REFERENCES job_targets(id) ON DELETE CASCADE,
  selection_process_note TEXT,
  office_atmosphere TEXT,
  sensory_observations TEXT NOT NULL DEFAULT '[]',
  lifestyle_compatibility_note TEXT,
  red_flags_note TEXT,
  overall_impression TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recruitment_impressions_job_target
  ON recruitment_impressions (job_target_id, created_at DESC);
