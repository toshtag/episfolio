-- 0041: skill_evidence / ai_runs テーブルを廃止し、document_revisions から AI 関連カラムを削除する
--
-- 書籍非由来の SkillEvidence entity と AI 実行ログ AIRun を削除する。
-- 加えて document_revisions から source_ai_run_id カラムと created_by の 'ai' 制約を除去する。
-- v0.13 で AI 機能を復活する際は kernel から再構築する。

DROP TABLE IF EXISTS skill_evidence;
DROP TABLE IF EXISTS ai_runs;

ALTER TABLE document_revisions RENAME TO document_revisions_old;

CREATE TABLE document_revisions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES career_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'human' CHECK(created_by = 'human'),
  revision_reason TEXT NOT NULL DEFAULT '',
  target_memo TEXT NOT NULL DEFAULT '',
  job_target_id TEXT,
  previous_revision_id TEXT,
  created_at TEXT NOT NULL
);

INSERT INTO document_revisions (
  id, document_id, content, created_by,
  revision_reason, target_memo, job_target_id, previous_revision_id, created_at
)
SELECT
  id, document_id, content,
  CASE WHEN created_by = 'human' THEN 'human' ELSE 'human' END,
  revision_reason, target_memo, job_target_id, previous_revision_id, created_at
FROM document_revisions_old;

DROP TABLE document_revisions_old;
