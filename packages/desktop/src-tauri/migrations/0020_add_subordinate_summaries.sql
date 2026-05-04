-- 0020: subordinate_summaries テーブルを追加
--
-- 「部下まとめシート」。マネジメント能力の再現性を「部下視点」で
-- 証明する書類。シート 1 件に複数の部下行を持つ構造。
-- 部下行は JSON 配列として subordinates カラムに保存（job_wish_sheets パターン）。

CREATE TABLE IF NOT EXISTS subordinate_summaries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  subordinates TEXT NOT NULL DEFAULT '[]',
  memo TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
