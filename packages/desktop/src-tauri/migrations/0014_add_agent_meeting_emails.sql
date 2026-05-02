-- 0014: agent_meeting_emails テーブルを追加
--
-- v0.4「面談メール本文」機能の永続化層。
-- AgentTrackRecord に紐づく面談メール本文を管理するテーブル。
-- agentTrackRecordId は nullable（汎用テンプレ用）。
-- sentAt は nullable（null = 下書き）。

CREATE TABLE IF NOT EXISTS agent_meeting_emails (
  id TEXT PRIMARY KEY,
  agent_track_record_id TEXT REFERENCES agent_track_records(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  sent_at TEXT,
  memo TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_meeting_emails_agent_id
  ON agent_meeting_emails(agent_track_record_id);
