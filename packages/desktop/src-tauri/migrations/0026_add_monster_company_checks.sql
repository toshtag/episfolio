CREATE TABLE IF NOT EXISTS monster_company_checks (
  id TEXT PRIMARY KEY,
  job_target_id TEXT NOT NULL REFERENCES job_targets(id) ON DELETE CASCADE,
  mhlw_case_url TEXT,
  violation_law TEXT,
  case_summary TEXT,
  case_publication_date TEXT,
  resignation_entries TEXT NOT NULL DEFAULT '[]',
  hidden_monster_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_monster_company_checks_job_target
  ON monster_company_checks (job_target_id, created_at DESC);
