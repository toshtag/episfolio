-- 0021: strength_arrows テーブルを追加
--
-- 「三つの矢印（興味・評価・依頼）」。他人から自分に向けられた
-- 質問（興味）・褒め（評価）・頼まれた経験（依頼）を記録し、強みの素材を集める。
-- related_episode_ids は JSON 配列として保存（subordinate_summaries パターン）。

CREATE TABLE IF NOT EXISTS strength_arrows (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('interest', 'evaluation', 'request')),
  description TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  occurred_at TEXT,
  related_episode_ids TEXT NOT NULL DEFAULT '[]',
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
