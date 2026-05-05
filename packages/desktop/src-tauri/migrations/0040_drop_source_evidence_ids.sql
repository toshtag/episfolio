-- 0040: document_revisions から source_evidence_ids カラムを廃止する
--
-- SkillEvidence entity 削除（後続 migration）への準備。
-- DocumentRevision を SkillEvidence から切り離す（書類は強み発掘ワークから直接書く方針）。
-- テーブル再作成パターンで他カラムは保持しつつ source_evidence_ids のみ drop する。

ALTER TABLE document_revisions RENAME TO document_revisions_old;

CREATE TABLE document_revisions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES career_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source_ai_run_id TEXT,
  created_by TEXT NOT NULL CHECK(created_by IN ('human', 'ai')),
  revision_reason TEXT NOT NULL DEFAULT '',
  target_memo TEXT NOT NULL DEFAULT '',
  job_target_id TEXT,
  previous_revision_id TEXT,
  created_at TEXT NOT NULL
);

INSERT INTO document_revisions (
  id, document_id, content, source_ai_run_id, created_by,
  revision_reason, target_memo, job_target_id, previous_revision_id, created_at
)
SELECT
  id, document_id, content, source_ai_run_id, created_by,
  revision_reason, target_memo, job_target_id, previous_revision_id, created_at
FROM document_revisions_old;

DROP TABLE document_revisions_old;
