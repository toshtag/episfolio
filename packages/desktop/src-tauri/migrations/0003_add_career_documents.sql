CREATE TABLE IF NOT EXISTS career_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  job_target TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS document_revisions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES career_documents(id),
  content TEXT NOT NULL DEFAULT '',
  source_evidence_ids TEXT NOT NULL DEFAULT '[]',
  source_ai_run_id TEXT,
  created_by TEXT NOT NULL DEFAULT 'ai',
  created_at TEXT NOT NULL
);
