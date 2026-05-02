-- 0017: boss_references テーブルを追加
--
-- 書籍 A 3-08「上司リファレンス」。上司タイプ分析（8軸スライダー）と
-- 11質問の回答・強みエピソードを管理する。JobTarget 非依存の汎用資料。

CREATE TABLE IF NOT EXISTS boss_references (
  id TEXT PRIMARY KEY,
  boss_name TEXT,
  company_name TEXT NOT NULL DEFAULT '',
  period TEXT NOT NULL DEFAULT '',
  axis_logic_vs_emotion INTEGER NOT NULL DEFAULT 3 CHECK(axis_logic_vs_emotion BETWEEN 1 AND 5),
  axis_result_vs_process INTEGER NOT NULL DEFAULT 3 CHECK(axis_result_vs_process BETWEEN 1 AND 5),
  axis_solo_vs_team INTEGER NOT NULL DEFAULT 3 CHECK(axis_solo_vs_team BETWEEN 1 AND 5),
  axis_future_vs_tradition INTEGER NOT NULL DEFAULT 3 CHECK(axis_future_vs_tradition BETWEEN 1 AND 5),
  axis_shares_private INTEGER NOT NULL DEFAULT 3 CHECK(axis_shares_private BETWEEN 1 AND 5),
  axis_teaching_skill INTEGER NOT NULL DEFAULT 3 CHECK(axis_teaching_skill BETWEEN 1 AND 5),
  axis_listening INTEGER NOT NULL DEFAULT 3 CHECK(axis_listening BETWEEN 1 AND 5),
  axis_busyness INTEGER NOT NULL DEFAULT 3 CHECK(axis_busyness BETWEEN 1 AND 5),
  q1 TEXT,
  q2 TEXT,
  q3 TEXT,
  q4 TEXT,
  q5 TEXT,
  q6 TEXT,
  q7 TEXT,
  q8 TEXT,
  q9 TEXT,
  q10 TEXT,
  q11 TEXT,
  strength_episode TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
