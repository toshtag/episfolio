CREATE TABLE IF NOT EXISTS strength_from_weakness (
  id TEXT PRIMARY KEY,
  weakness_label TEXT NOT NULL DEFAULT '',
  blank_type TEXT,
  background TEXT NOT NULL DEFAULT '',
  reframe TEXT NOT NULL DEFAULT '',
  target_company_profile TEXT NOT NULL DEFAULT '',
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
