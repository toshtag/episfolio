CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  background TEXT NOT NULL DEFAULT '',
  problem TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT '',
  ingenuity TEXT NOT NULL DEFAULT '',
  result TEXT NOT NULL DEFAULT '',
  metrics TEXT NOT NULL DEFAULT '',
  before_after TEXT NOT NULL DEFAULT '',
  reproducibility TEXT NOT NULL DEFAULT '',
  related_skills TEXT NOT NULL DEFAULT '[]',
  personal_feeling TEXT NOT NULL DEFAULT '',
  external_feedback TEXT NOT NULL DEFAULT '',
  remote_llm_allowed INTEGER NOT NULL DEFAULT 0,
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS episodes_fts USING fts5(
  title, background, problem, action, ingenuity, result,
  content='episodes', content_rowid='rowid'
);
