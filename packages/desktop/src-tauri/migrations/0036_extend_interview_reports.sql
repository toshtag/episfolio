-- 余白設計・面接ログ用の 8 フィールドを interview_reports に追加
-- 全列 NULL デフォルトで既存レコードの後方互換を維持

ALTER TABLE interview_reports ADD COLUMN interviewer_role          TEXT;
ALTER TABLE interview_reports ADD COLUMN interviewer_style         TEXT CHECK (interviewer_style IN ('numeric','process','unknown'));
ALTER TABLE interview_reports ADD COLUMN talk_ratio_self           REAL;
ALTER TABLE interview_reports ADD COLUMN questions_asked_note      TEXT;
ALTER TABLE interview_reports ADD COLUMN response_impression       TEXT CHECK (response_impression IN ('good','neutral','poor'));
ALTER TABLE interview_reports ADD COLUMN blank_areas_note          TEXT;
ALTER TABLE interview_reports ADD COLUMN improvement_note          TEXT;
ALTER TABLE interview_reports ADD COLUMN passed                    INTEGER;
