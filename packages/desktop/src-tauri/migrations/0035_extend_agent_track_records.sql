-- 多経路発想・エージェント評価用の 9 フィールドを agent_track_records に追加
-- 全列 NULL デフォルトで既存レコードの後方互換を維持

ALTER TABLE agent_track_records ADD COLUMN specialty_industries          TEXT;
ALTER TABLE agent_track_records ADD COLUMN specialty_job_types           TEXT;
ALTER TABLE agent_track_records ADD COLUMN consultant_quality            TEXT CHECK (consultant_quality IN ('excellent','good','fair','poor'));
ALTER TABLE agent_track_records ADD COLUMN has_exclusive_jobs            INTEGER;
ALTER TABLE agent_track_records ADD COLUMN provides_recommendation_letter INTEGER;
ALTER TABLE agent_track_records ADD COLUMN recommendation_letter_received INTEGER;
ALTER TABLE agent_track_records ADD COLUMN number_of_jobs_introduced     INTEGER;
ALTER TABLE agent_track_records ADD COLUMN response_speed_days           REAL;
ALTER TABLE agent_track_records ADD COLUMN overall_rating                REAL;
