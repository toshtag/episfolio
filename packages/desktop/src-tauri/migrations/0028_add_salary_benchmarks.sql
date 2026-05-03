CREATE TABLE IF NOT EXISTS salary_benchmarks (
  id TEXT PRIMARY KEY,
  job_target_id TEXT NOT NULL REFERENCES job_targets(id) ON DELETE CASCADE,
  average_salary_at_company INTEGER,
  expected_salary_range_min INTEGER,
  expected_salary_range_max INTEGER,
  personal_salary_benchmark INTEGER,
  is_mismatched_company INTEGER NOT NULL DEFAULT 0,
  data_source TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_salary_benchmarks_job_target
  ON salary_benchmarks (job_target_id, created_at DESC);
