CREATE TABLE IF NOT EXISTS ai_runs (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  purpose TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  model_params TEXT,
  input_snapshot_mode TEXT NOT NULL,
  input_snapshot TEXT,
  input_references TEXT,
  output_raw TEXT NOT NULL,
  output_parsed TEXT,
  parse_error TEXT,
  token_usage TEXT,
  cost_estimate_usd REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS skill_evidence (
  id TEXT PRIMARY KEY,
  strength_label TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_episode_ids TEXT NOT NULL DEFAULT '[]',
  reproducibility TEXT NOT NULL DEFAULT '',
  evaluated_context TEXT NOT NULL DEFAULT '',
  confidence TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'candidate',
  created_by TEXT NOT NULL DEFAULT 'ai',
  source_ai_run_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
