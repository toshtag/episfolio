CREATE TABLE IF NOT EXISTS life_timeline_entries (
  id TEXT PRIMARY KEY,
  age_range_start INTEGER NOT NULL DEFAULT 0,
  age_range_end INTEGER NOT NULL DEFAULT 0,
  year_start INTEGER,
  year_end INTEGER,
  category TEXT NOT NULL DEFAULT 'other',
  summary TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  related_episode_ids TEXT NOT NULL DEFAULT '[]',
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
