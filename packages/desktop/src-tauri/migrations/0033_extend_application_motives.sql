-- 0033: application_motives に motive_style + standard 系 4 列 + iron 系 7 列を追加
--
-- 既存行は motive_style = 'standard' (DEFAULT) で後方互換。
-- iron 系列は全て NULL 許容（未記入を許容）。

ALTER TABLE application_motives
  ADD COLUMN motive_style TEXT NOT NULL DEFAULT 'standard'
    CHECK (motive_style IN ('standard', 'iron'));

-- standard 系追加フィールド（志望動機方程式・作成編）
ALTER TABLE application_motives ADD COLUMN info_source_type TEXT
  CHECK (info_source_type IN ('recruit_info','mid_term_plan','president_message','member_profile','other'));
ALTER TABLE application_motives ADD COLUMN info_source_url TEXT NOT NULL DEFAULT '';
ALTER TABLE application_motives ADD COLUMN target_department TEXT NOT NULL DEFAULT '';
ALTER TABLE application_motives ADD COLUMN department_challenge TEXT NOT NULL DEFAULT '';

-- iron 系追加フィールド（鋼の志望動機）
ALTER TABLE application_motives ADD COLUMN positive_influence TEXT NOT NULL DEFAULT '';
ALTER TABLE application_motives ADD COLUMN before_after_fact TEXT NOT NULL DEFAULT '';
ALTER TABLE application_motives ADD COLUMN self_identification TEXT
  CHECK (self_identification IN ('fan','provider','transitioning'));
ALTER TABLE application_motives ADD COLUMN provider_switch_moment TEXT NOT NULL DEFAULT '';
ALTER TABLE application_motives ADD COLUMN value_analysis_type TEXT
  CHECK (value_analysis_type IN ('productOut','marketIn'));
ALTER TABLE application_motives ADD COLUMN value_analysis_detail TEXT NOT NULL DEFAULT '';
ALTER TABLE application_motives ADD COLUMN post_join_action_plan TEXT NOT NULL DEFAULT '';
