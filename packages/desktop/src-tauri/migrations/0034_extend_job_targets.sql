-- 求人票分析・応募経路管理用の 16 フィールドを job_targets に追加
-- 全列 NULL デフォルトで既存レコードの後方互換を維持

ALTER TABLE job_targets ADD COLUMN annual_holidays        INTEGER;
ALTER TABLE job_targets ADD COLUMN working_hours_per_day  REAL;
ALTER TABLE job_targets ADD COLUMN commute_time_minutes   INTEGER;
ALTER TABLE job_targets ADD COLUMN employment_type        TEXT CHECK (employment_type IN ('regular','contract','dispatch','other'));
ALTER TABLE job_targets ADD COLUMN flex_time_available    INTEGER;
ALTER TABLE job_targets ADD COLUMN remote_work_available  INTEGER;
ALTER TABLE job_targets ADD COLUMN average_paid_leave_taken REAL;
ALTER TABLE job_targets ADD COLUMN vacancy_reason         TEXT;
ALTER TABLE job_targets ADD COLUMN current_team_size      INTEGER;
ALTER TABLE job_targets ADD COLUMN application_route      TEXT CHECK (application_route IN ('direct','site','agent'));
ALTER TABLE job_targets ADD COLUMN wage_type              TEXT CHECK (wage_type IN ('monthly','annual','commission','other'));
ALTER TABLE job_targets ADD COLUMN basic_salary           INTEGER;
ALTER TABLE job_targets ADD COLUMN fixed_overtime_hours   REAL;
ALTER TABLE job_targets ADD COLUMN bonus_base_months      REAL;
ALTER TABLE job_targets ADD COLUMN has_future_raise_promise        INTEGER;
ALTER TABLE job_targets ADD COLUMN future_raise_promise_in_contract INTEGER;
