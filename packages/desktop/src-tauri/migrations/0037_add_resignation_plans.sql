-- 書籍 B 第 5 章（退職交渉設計・藩士意識）由来 ResignationPlan テーブル
-- jobTargetId で内定先に紐づける（1 JobTarget : N ResignationPlan）

CREATE TABLE resignation_plans (
    id                      TEXT PRIMARY KEY,
    job_target_id           TEXT NOT NULL REFERENCES job_targets(id) ON DELETE CASCADE,
    -- 内定比較表 7 項目
    annual_salary           INTEGER,
    annual_holidays         INTEGER,
    daily_working_hours     REAL,
    commute_minutes         INTEGER,
    position_note           TEXT NOT NULL DEFAULT '',
    recruitment_background  TEXT CHECK (recruitment_background IN ('vacancy','expansion','unknown')),
    risk_memo               TEXT NOT NULL DEFAULT '',
    -- 退職シーケンス 9 マイルストーン日付
    final_interview_at      TEXT,
    offer_notified_at       TEXT,
    offer_accepted_at       TEXT,
    resignation_notified_at TEXT,
    handover_started_at     TEXT,
    last_working_day_at     TEXT,
    paid_leave_start_at     TEXT,
    joined_at               TEXT,
    -- 退職交渉
    available_date_from     TEXT,
    available_date_to       TEXT,
    negotiation_note        TEXT NOT NULL DEFAULT '',
    -- 藩士意識
    samurai_loss_note       TEXT NOT NULL DEFAULT '',
    samurai_gain_note       TEXT NOT NULL DEFAULT '',
    next_exit_plan          TEXT NOT NULL DEFAULT '',
    created_at              TEXT NOT NULL,
    updated_at              TEXT NOT NULL
);

CREATE INDEX idx_resignation_plans_job_target_id ON resignation_plans(job_target_id);
