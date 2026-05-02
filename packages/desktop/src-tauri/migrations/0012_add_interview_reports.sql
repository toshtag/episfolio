-- 0012: interview_reports テーブルを追加
--
-- v0.4「面接後報告シート」機能の永続化層。
-- JobTarget に紐づく面接段階別の 4 報告を管理する。
-- stage は kernel の InterviewStageSchema に従い CHECK で強制する。

CREATE TABLE IF NOT EXISTS interview_reports (
  id TEXT PRIMARY KEY,
  job_target_id TEXT NOT NULL REFERENCES job_targets(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'first' CHECK (stage IN ('first', 'second', 'final', 'other')),
  interviewer_note TEXT NOT NULL DEFAULT '',
  qa_note TEXT NOT NULL DEFAULT '',
  motivation_change_note TEXT NOT NULL DEFAULT '',
  questions_to_bring_note TEXT NOT NULL DEFAULT '',
  conducted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interview_reports_job_target_id
  ON interview_reports(job_target_id);
