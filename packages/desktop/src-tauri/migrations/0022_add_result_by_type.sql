-- 0022: result_by_type テーブルを追加
--
-- 書籍 A 1-09「3 タイプの実績（利益＝売上－コスト）」。
-- 売上アップ / コスト削減 / 両方に影響の 3 タイプと、
-- 成果スキル / 原因スキルの 2 軸でエントリを記録する。
-- エントリは JSON 配列として entries カラムに保存（subordinate_summaries パターン）。

CREATE TABLE IF NOT EXISTS result_by_type (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  entries TEXT NOT NULL DEFAULT '[]',
  memo TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
