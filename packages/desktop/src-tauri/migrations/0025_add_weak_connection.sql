CREATE TABLE IF NOT EXISTS weak_connection (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'student_days',
  relation TEXT NOT NULL DEFAULT '',
  contact_status TEXT NOT NULL DEFAULT 'not_contacted',
  prospect_note TEXT NOT NULL DEFAULT '',
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
