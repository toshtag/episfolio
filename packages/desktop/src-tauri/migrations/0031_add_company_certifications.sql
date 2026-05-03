CREATE TABLE IF NOT EXISTS company_certifications (
  id TEXT PRIMARY KEY,
  job_target_id TEXT NOT NULL REFERENCES job_targets(id) ON DELETE CASCADE,
  has_kurumin INTEGER NOT NULL DEFAULT 0,
  has_platinum_kurumin INTEGER NOT NULL DEFAULT 0,
  has_tomoni INTEGER NOT NULL DEFAULT 0,
  eruboshi_level INTEGER CHECK (eruboshi_level IN (1, 2, 3)),
  has_platinum_eruboshi INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_company_certifications_job_target
  ON company_certifications (job_target_id, created_at DESC);
