-- 0008: job_targets テーブルを追加
--
-- v0.3 のコア機能「求人別 Revision」「必須要件 × Episode マッピング」
-- 「職務経歴ダイジェスト」の起点となる JobTarget を永続化する。
--
-- required_skills / preferred_skills は SkillItem[] (id + text) を JSON 文字列で保存する。
-- kernel の `JobTargetSchema` に従い、status は 6 enum を CHECK で強制する。

CREATE TABLE IF NOT EXISTS job_targets (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT '',
  job_title TEXT NOT NULL DEFAULT '',
  job_description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'researching' CHECK (status IN (
    'researching', 'applying', 'interviewing', 'offered', 'rejected', 'withdrawn'
  )),
  required_skills TEXT NOT NULL DEFAULT '[]',
  preferred_skills TEXT NOT NULL DEFAULT '[]',
  concerns TEXT NOT NULL DEFAULT '',
  appeal_points TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
