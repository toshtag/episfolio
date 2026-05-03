CREATE TABLE IF NOT EXISTS hidden_gem_notes (
  id TEXT PRIMARY KEY,
  job_target_id TEXT NOT NULL REFERENCES job_targets(id) ON DELETE CASCADE,
  is_gnt_listed INTEGER NOT NULL DEFAULT 0,
  niche_keywords TEXT,
  has_anti_monster_mechanism INTEGER NOT NULL DEFAULT 0,
  mechanism_note TEXT,
  is_hiring_on_job_sites INTEGER NOT NULL DEFAULT 0,
  direct_contact_note TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hidden_gem_notes_job_target
  ON hidden_gem_notes (job_target_id, created_at DESC);
