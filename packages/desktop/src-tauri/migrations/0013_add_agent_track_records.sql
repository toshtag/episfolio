-- 0013: agent_track_records テーブルを追加
--
-- v0.4「エージェント実績表」機能の永続化層。
-- 転職エージェント会社ごとの担当者情報・連絡履歴を管理するマスタテーブル。
-- status は kernel の AgentTrackRecordStatusSchema に従い CHECK で強制する。

CREATE TABLE IF NOT EXISTS agent_track_records (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  first_contact_date TEXT,
  memo TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
