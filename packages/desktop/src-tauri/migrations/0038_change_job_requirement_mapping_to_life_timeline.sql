-- 0038: job_requirement_mappings の素材参照を Episode から LifeTimelineEntry に切り替える
--
-- 書籍 3-11 職務経歴ダイジェストの素材を、書籍非由来の Episode から
-- 書籍 1-02 + 3-12 由来の LifeTimelineEntry に切り替える。
-- 既存の episode_ids カラムを廃止し、life_timeline_entry_ids カラムを新設する。
-- Episode と LifeTimelineEntry は別 entity のため、既存の紐付けは引き継がない
-- （life_timeline_entry_ids は '[]' で初期化される。ユーザーは再紐付けが必要）。
--
-- テーブル再作成パターン（migration 0007 と同様）で:
--   1. 旧テーブルをリネーム
--   2. 新スキーマで再作成
--   3. episode_ids 以外をコピー、life_timeline_entry_ids は '[]' で初期化
--   4. 旧テーブルを drop
--   5. インデックス再作成

ALTER TABLE job_requirement_mappings RENAME TO job_requirement_mappings_old;

CREATE TABLE job_requirement_mappings (
  id TEXT PRIMARY KEY,
  job_target_id TEXT NOT NULL REFERENCES job_targets(id) ON DELETE CASCADE,
  requirement_skill_id TEXT NOT NULL,
  life_timeline_entry_ids TEXT NOT NULL DEFAULT '[]',
  user_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO job_requirement_mappings (
  id, job_target_id, requirement_skill_id, life_timeline_entry_ids, user_note, created_at, updated_at
)
SELECT
  id, job_target_id, requirement_skill_id, '[]', user_note, created_at, updated_at
FROM job_requirement_mappings_old;

DROP TABLE job_requirement_mappings_old;

CREATE INDEX IF NOT EXISTS idx_job_req_mapping_job_target
  ON job_requirement_mappings(job_target_id);
