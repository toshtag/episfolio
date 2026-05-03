CREATE TABLE IF NOT EXISTS microchop_skill (
  id TEXT PRIMARY KEY,
  job_title TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  tasks TEXT NOT NULL DEFAULT '[]',
  transferable_skills TEXT NOT NULL DEFAULT '',
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
