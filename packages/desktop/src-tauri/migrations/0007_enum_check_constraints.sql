-- 0007: enum カラムに CHECK 制約を追加
--
-- SQLite は ALTER TABLE で既存カラムに CHECK を追加できないため、
-- テーブル再作成パターン (rename → create new → copy → drop old → rename) を使う。
-- INSERT は SELECT * を避けてカラム名を明示する（0004 で追加された source カラムや
-- 0006 で追加された revision_reason / target_memo / previous_revision_id がカラム順で
-- 追加されており、新テーブル定義との位置がズレるため）。
--
-- life_timeline_entries には併せて age_range_start <= age_range_end の CHECK も入れる
-- （kernel `LifeTimelineEntrySchema` の refine と整合）。

PRAGMA foreign_keys = OFF;

-- skill_evidence
CREATE TABLE skill_evidence_new (
  id TEXT PRIMARY KEY,
  strength_label TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_episode_ids TEXT NOT NULL DEFAULT '[]',
  reproducibility TEXT NOT NULL DEFAULT '',
  evaluated_context TEXT NOT NULL DEFAULT '',
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate', 'accepted', 'rejected')),
  source TEXT NOT NULL DEFAULT 'ai-generated' CHECK (source IN ('manual', 'ai-generated')),
  created_by TEXT NOT NULL DEFAULT 'ai' CHECK (created_by IN ('human', 'ai')),
  source_ai_run_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT INTO skill_evidence_new (
  id, strength_label, description, evidence_episode_ids, reproducibility, evaluated_context,
  confidence, status, source, created_by, source_ai_run_id, created_at, updated_at
)
SELECT
  id, strength_label, description, evidence_episode_ids, reproducibility, evaluated_context,
  confidence, status, source, created_by, source_ai_run_id, created_at, updated_at
FROM skill_evidence;
DROP TABLE skill_evidence;
ALTER TABLE skill_evidence_new RENAME TO skill_evidence;

-- career_documents
CREATE TABLE career_documents_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  job_target TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT INTO career_documents_new (id, title, job_target, status, created_at, updated_at)
SELECT id, title, job_target, status, created_at, updated_at
FROM career_documents;
DROP TABLE career_documents;
ALTER TABLE career_documents_new RENAME TO career_documents;

-- document_revisions
CREATE TABLE document_revisions_new (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES career_documents(id),
  content TEXT NOT NULL DEFAULT '',
  source_evidence_ids TEXT NOT NULL DEFAULT '[]',
  source_ai_run_id TEXT,
  created_by TEXT NOT NULL DEFAULT 'ai' CHECK (created_by IN ('human', 'ai')),
  revision_reason TEXT NOT NULL DEFAULT '',
  target_memo TEXT NOT NULL DEFAULT '',
  previous_revision_id TEXT,
  created_at TEXT NOT NULL
);
INSERT INTO document_revisions_new (
  id, document_id, content, source_evidence_ids, source_ai_run_id, created_by,
  revision_reason, target_memo, previous_revision_id, created_at
)
SELECT
  id, document_id, content, source_evidence_ids, source_ai_run_id, created_by,
  revision_reason, target_memo, previous_revision_id, created_at
FROM document_revisions;
DROP TABLE document_revisions;
ALTER TABLE document_revisions_new RENAME TO document_revisions;

-- life_timeline_entries
CREATE TABLE life_timeline_entries_new (
  id TEXT PRIMARY KEY,
  age_range_start INTEGER NOT NULL DEFAULT 0,
  age_range_end INTEGER NOT NULL DEFAULT 0,
  year_start INTEGER,
  year_end INTEGER,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('education', 'work', 'family', 'health', 'hobby', 'other')),
  summary TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  related_episode_ids TEXT NOT NULL DEFAULT '[]',
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (age_range_start <= age_range_end)
);
INSERT INTO life_timeline_entries_new (
  id, age_range_start, age_range_end, year_start, year_end, category,
  summary, detail, related_episode_ids, tags, created_at, updated_at
)
SELECT
  id, age_range_start, age_range_end, year_start, year_end, category,
  summary, detail, related_episode_ids, tags, created_at, updated_at
FROM life_timeline_entries;
DROP TABLE life_timeline_entries;
ALTER TABLE life_timeline_entries_new RENAME TO life_timeline_entries;

PRAGMA foreign_keys = ON;
