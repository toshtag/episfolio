-- 0019: work_asset_summaries テーブルを追加
--
-- 書籍 A 3-10「成果物ポートフォリオ」。仕事資料のメタ情報（種別・期間・役割・
-- 強みエピソード・面接トーキングポイント・機微情報マスク方針）を管理する。
-- 実ファイル添付は v0.6.x で別 Order 化。

CREATE TABLE IF NOT EXISTS work_asset_summaries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  asset_type TEXT NOT NULL DEFAULT 'document'
    CHECK(asset_type IN (
      'proposal','source-code','slide','minutes',
      'weekly-report','comparison-table','document','other'
    )),
  job_context TEXT,
  period TEXT,
  role TEXT,
  summary TEXT,
  strength_episode TEXT,
  talking_points TEXT,
  masking_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
