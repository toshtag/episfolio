-- 0009: job_requirement_mappings テーブルを追加
--
-- v0.3 のコア成果物「職務経歴ダイジェスト」のため、
-- JobTarget の必須要件 (`SkillItem.id`) と Episode の紐付けを永続化する。
--
-- - job_target_id は job_targets(id) を参照し、JobTarget 削除時には
--   ON DELETE CASCADE でマッピングも自動削除する（1 求人 = 1 ダイジェスト前提）。
-- - requirement_skill_id は JobTarget.required_skills の JSON 配列内の
--   `SkillItem.id` を指す。JSON 内のため FK は張らない。
--   要件削除との競合は kernel exporter の安全無視ポリシーで吸収する。
-- - episode_ids は Episode の id 配列を JSON 文字列で保存する。

CREATE TABLE IF NOT EXISTS job_requirement_mappings (
  id TEXT PRIMARY KEY,
  job_target_id TEXT NOT NULL REFERENCES job_targets(id) ON DELETE CASCADE,
  requirement_skill_id TEXT NOT NULL,
  episode_ids TEXT NOT NULL DEFAULT '[]',
  user_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_job_req_mapping_job_target
  ON job_requirement_mappings(job_target_id);
