-- 0015: job_wish_sheets テーブルを追加
--
-- v0.4「転職希望シート」機能の永続化層。
-- A/B/C グループ企業群は JSON 文字列として保存（job_targets.required_skills パターン）。
-- agent_track_record_id は nullable + ON DELETE SET NULL（シートはエージェント削除後も再利用可能）。

CREATE TABLE IF NOT EXISTS job_wish_sheets (
  id TEXT PRIMARY KEY,
  agent_track_record_id TEXT REFERENCES agent_track_records(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  desired_industry TEXT NOT NULL DEFAULT '',
  desired_role TEXT NOT NULL DEFAULT '',
  desired_salary TEXT NOT NULL DEFAULT '',
  desired_location TEXT NOT NULL DEFAULT '',
  desired_work_style TEXT NOT NULL DEFAULT '',
  other_conditions TEXT NOT NULL DEFAULT '',
  group_a_companies TEXT NOT NULL DEFAULT '[]',
  group_b_companies TEXT NOT NULL DEFAULT '[]',
  group_c_companies TEXT NOT NULL DEFAULT '[]',
  memo TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_job_wish_sheets_agent_id
  ON job_wish_sheets(agent_track_record_id);
