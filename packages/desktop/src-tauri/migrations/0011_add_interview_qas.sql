-- 0011: interview_qas テーブルを追加
--
-- v0.4「面接の赤本」機能の永続化層。
-- JobTarget に紐づく Q&A を求人単位で管理する。
-- category / source は kernel の InterviewQASchema に従い CHECK で強制する。

CREATE TABLE IF NOT EXISTS interview_qas (
  id TEXT PRIMARY KEY,
  job_target_id TEXT NOT NULL REFERENCES job_targets(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN (
    'self-introduction', 'motivation', 'post-hire', 'other'
  )),
  question_asked TEXT NOT NULL DEFAULT '',
  recommended_answer TEXT,
  answer_to_avoid TEXT,
  question_intent TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('agent-provided', 'manual')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interview_qas_job_target_id
  ON interview_qas(job_target_id);
