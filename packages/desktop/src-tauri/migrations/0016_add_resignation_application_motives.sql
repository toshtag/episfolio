-- 0016: resignation_motives / application_motives テーブルを追加
--
-- 書籍 A 3-02「本音の転職理由」と「建前の志望動機」の分離構造（ADR-0011）。
-- resignation_motives は求人非依存（1 レコードで管理）。
-- application_motives は job_targets への FK CASCADE（求人ごとに 1 つ）。

CREATE TABLE IF NOT EXISTS resignation_motives (
  id TEXT PRIMARY KEY,
  company_dissatisfaction TEXT NOT NULL DEFAULT '',
  job_dissatisfaction TEXT NOT NULL DEFAULT '',
  compensation_dissatisfaction TEXT NOT NULL DEFAULT '',
  relationship_dissatisfaction TEXT NOT NULL DEFAULT '',
  resolution_intent TEXT NOT NULL DEFAULT '',
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS application_motives (
  id TEXT PRIMARY KEY,
  job_target_id TEXT NOT NULL REFERENCES job_targets(id) ON DELETE CASCADE,
  company_future TEXT NOT NULL DEFAULT '',
  contribution_action TEXT NOT NULL DEFAULT '',
  leveraged_experience TEXT NOT NULL DEFAULT '',
  formatted_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_application_motives_job_target_id
  ON application_motives(job_target_id);
