use rusqlite::{Connection, Result};
use std::path::PathBuf;

const MIGRATION_001: &str = include_str!("../../migrations/0001_init.sql");
const MIGRATION_002: &str = include_str!("../../migrations/0002_add_skill_evidence_ai_runs.sql");
const MIGRATION_003: &str = include_str!("../../migrations/0003_add_career_documents.sql");
const MIGRATION_004: &str = include_str!("../../migrations/0004_add_skill_evidence_source.sql");
const MIGRATION_005: &str = include_str!("../../migrations/0005_add_life_timeline.sql");
const MIGRATION_006: &str = include_str!("../../migrations/0006_add_document_revision_fields.sql");
const MIGRATION_007: &str = include_str!("../../migrations/0007_enum_check_constraints.sql");
const MIGRATION_008: &str = include_str!("../../migrations/0008_add_job_targets.sql");
const MIGRATION_009: &str =
    include_str!("../../migrations/0009_add_job_requirement_mappings.sql");
const MIGRATION_010: &str =
    include_str!("../../migrations/0010_add_revision_job_target_id.sql");
const MIGRATION_011: &str = include_str!("../../migrations/0011_add_interview_qas.sql");
const MIGRATION_012: &str = include_str!("../../migrations/0012_add_interview_reports.sql");
const MIGRATION_013: &str = include_str!("../../migrations/0013_add_agent_track_records.sql");
const MIGRATION_014: &str = include_str!("../../migrations/0014_add_agent_meeting_emails.sql");
const MIGRATION_015: &str = include_str!("../../migrations/0015_add_job_wish_sheets.sql");

pub fn open(db_path: PathBuf) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    run_migrations(&conn)?;
    Ok(conn)
}

fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
           version TEXT PRIMARY KEY,
           applied_at TEXT NOT NULL
         );",
    )?;

    apply_migration(conn, "0001", MIGRATION_001)?;
    apply_migration(conn, "0002", MIGRATION_002)?;
    apply_migration(conn, "0003", MIGRATION_003)?;
    apply_migration(conn, "0004", MIGRATION_004)?;
    apply_migration(conn, "0005", MIGRATION_005)?;
    apply_migration(conn, "0006", MIGRATION_006)?;
    apply_migration(conn, "0007", MIGRATION_007)?;
    apply_migration(conn, "0008", MIGRATION_008)?;
    apply_migration(conn, "0009", MIGRATION_009)?;
    apply_migration(conn, "0010", MIGRATION_010)?;
    apply_migration(conn, "0011", MIGRATION_011)?;
    apply_migration(conn, "0012", MIGRATION_012)?;
    apply_migration(conn, "0013", MIGRATION_013)?;
    apply_migration(conn, "0014", MIGRATION_014)?;
    apply_migration(conn, "0015", MIGRATION_015)?;

    Ok(())
}

fn apply_migration(conn: &Connection, version: &str, sql: &str) -> Result<()> {
    let applied: bool = conn.query_row(
        "SELECT COUNT(*) FROM schema_migrations WHERE version = ?1",
        rusqlite::params![version],
        |row| row.get::<_, i64>(0),
    )? > 0;

    if !applied {
        conn.execute_batch(sql)?;
        conn.execute(
            "INSERT INTO schema_migrations (version, applied_at) VALUES (?1, datetime('now'))",
            rusqlite::params![version],
        )?;
    }

    Ok(())
}

/// Test 用に in-memory SQLite を開いて全 migration を適用したコネクションを返す。
/// production の `open()` は file path を取り journal_mode=WAL を設定するが、
/// in-memory DB では WAL は意味がないので memory モードのまま使う。
#[cfg(test)]
pub fn open_in_memory_with_migrations() -> Result<Connection> {
    let conn = Connection::open_in_memory()?;
    conn.execute_batch("PRAGMA foreign_keys=ON;")?;
    run_migrations(&conn)?;
    Ok(conn)
}

#[cfg(test)]
mod tests {
    use super::*;

    const TS: &str = "2026-05-01T00:00:00Z";

    fn db() -> Connection {
        open_in_memory_with_migrations().expect("migrations should apply")
    }

    // ──────────────────────────────────────────────
    // migration smoke
    // ──────────────────────────────────────────────

    #[test]
    fn migrations_0001_through_0015_apply_to_fresh_db() {
        let conn = db();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM schema_migrations", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 15);
    }

    // ──────────────────────────────────────────────
    // skill_evidence CHECK 制約
    // ──────────────────────────────────────────────

    fn insert_skill_evidence(
        conn: &Connection,
        id: &str,
        confidence: &str,
        status: &str,
        source: &str,
        created_by: &str,
    ) -> rusqlite::Result<usize> {
        conn.execute(
            "INSERT INTO skill_evidence \
             (id, strength_label, description, evidence_episode_ids, reproducibility, evaluated_context, \
              confidence, status, source, created_by, source_ai_run_id, created_at, updated_at) \
             VALUES (?1, 'lbl', 'desc', '[]', '', '', ?2, ?3, ?4, ?5, NULL, ?6, ?6)",
            rusqlite::params![id, confidence, status, source, created_by, TS],
        )
    }

    #[test]
    fn skill_evidence_accepts_valid_enums() {
        let conn = db();
        insert_skill_evidence(&conn, "ev_ok", "high", "accepted", "manual", "human")
            .expect("valid enums should pass");
    }

    #[test]
    fn skill_evidence_confidence_check_rejects_invalid() {
        let conn = db();
        let result = insert_skill_evidence(&conn, "ev1", "unknown", "candidate", "manual", "human");
        assert!(result.is_err(), "confidence='unknown' must be rejected");
    }

    #[test]
    fn skill_evidence_status_check_rejects_invalid() {
        let conn = db();
        let result = insert_skill_evidence(&conn, "ev2", "medium", "draft", "manual", "human");
        assert!(result.is_err(), "status='draft' must be rejected");
    }

    #[test]
    fn skill_evidence_source_check_rejects_invalid() {
        let conn = db();
        let result =
            insert_skill_evidence(&conn, "ev3", "medium", "candidate", "imported", "human");
        assert!(result.is_err(), "source='imported' must be rejected");
    }

    #[test]
    fn skill_evidence_created_by_check_rejects_invalid() {
        let conn = db();
        let result = insert_skill_evidence(&conn, "ev4", "medium", "candidate", "manual", "robot");
        assert!(result.is_err(), "created_by='robot' must be rejected");
    }

    // ──────────────────────────────────────────────
    // career_documents / document_revisions
    // ──────────────────────────────────────────────

    fn insert_document(conn: &Connection, id: &str, status: &str) -> rusqlite::Result<usize> {
        conn.execute(
            "INSERT INTO career_documents (id, title, job_target, status, created_at, updated_at) \
             VALUES (?1, 'doc', '', ?2, ?3, ?3)",
            rusqlite::params![id, status, TS],
        )
    }

    #[test]
    fn career_documents_status_check_accepts_known() {
        let conn = db();
        insert_document(&conn, "doc1", "draft").unwrap();
        insert_document(&conn, "doc2", "finalized").unwrap();
    }

    #[test]
    fn career_documents_status_check_rejects_invalid() {
        let conn = db();
        let result = insert_document(&conn, "doc_bad", "archived");
        assert!(result.is_err(), "status='archived' must be rejected");
    }

    #[test]
    fn document_revisions_created_by_check_rejects_invalid() {
        let conn = db();
        insert_document(&conn, "doc1", "draft").unwrap();
        let result = conn.execute(
            "INSERT INTO document_revisions \
             (id, document_id, content, source_evidence_ids, source_ai_run_id, created_by, \
              revision_reason, target_memo, previous_revision_id, created_at) \
             VALUES (?1, ?2, '', '[]', NULL, ?3, '', '', NULL, ?4)",
            rusqlite::params!["rev_bad", "doc1", "system", TS],
        );
        assert!(result.is_err(), "created_by='system' must be rejected");
    }

    #[test]
    fn document_revisions_chain_links_previous_id() {
        let conn = db();
        insert_document(&conn, "doc1", "draft").unwrap();
        // 初版
        conn.execute(
            "INSERT INTO document_revisions \
             (id, document_id, content, source_evidence_ids, source_ai_run_id, created_by, \
              revision_reason, target_memo, previous_revision_id, created_at) \
             VALUES ('rev1', 'doc1', 'v1', '[]', NULL, 'human', '初版', '', NULL, ?1)",
            rusqlite::params![TS],
        )
        .unwrap();
        // 改訂 2
        conn.execute(
            "INSERT INTO document_revisions \
             (id, document_id, content, source_evidence_ids, source_ai_run_id, created_by, \
              revision_reason, target_memo, previous_revision_id, created_at) \
             VALUES ('rev2', 'doc1', 'v2', '[]', NULL, 'human', '改訂', '', 'rev1', ?1)",
            rusqlite::params![TS],
        )
        .unwrap();

        let prev: Option<String> = conn
            .query_row(
                "SELECT previous_revision_id FROM document_revisions WHERE id = ?1",
                rusqlite::params!["rev2"],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(prev, Some("rev1".to_string()));

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM document_revisions WHERE document_id = ?1",
                rusqlite::params!["doc1"],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 2, "rev1 + rev2 が同じ document_id にぶら下がる");
    }

    // ──────────────────────────────────────────────
    // life_timeline_entries
    // ──────────────────────────────────────────────

    fn insert_life_timeline(
        conn: &Connection,
        id: &str,
        start: i64,
        end: i64,
        category: &str,
    ) -> rusqlite::Result<usize> {
        conn.execute(
            "INSERT INTO life_timeline_entries \
             (id, age_range_start, age_range_end, year_start, year_end, category, \
              summary, detail, related_episode_ids, tags, created_at, updated_at) \
             VALUES (?1, ?2, ?3, NULL, NULL, ?4, 'sum', '', '[]', '[]', ?5, ?5)",
            rusqlite::params![id, start, end, category, TS],
        )
    }

    #[test]
    fn life_timeline_category_check_rejects_invalid() {
        let conn = db();
        let result = insert_life_timeline(&conn, "lt_bad", 20, 25, "career");
        assert!(result.is_err(), "category='career' must be rejected");
    }

    #[test]
    fn life_timeline_age_range_check_rejects_inverted() {
        let conn = db();
        let result = insert_life_timeline(&conn, "lt_inv", 30, 25, "work");
        assert!(
            result.is_err(),
            "age_range_start=30 > age_range_end=25 must be rejected"
        );
    }

    #[test]
    fn life_timeline_age_range_equal_is_allowed() {
        let conn = db();
        insert_life_timeline(&conn, "lt_eq", 30, 30, "work")
            .expect("age_range_start == age_range_end should pass");
    }

    // ──────────────────────────────────────────────
    // 各テーブル INSERT/SELECT スモーク
    // ──────────────────────────────────────────────

    #[test]
    fn episodes_insert_and_select_smoke() {
        let conn = db();
        conn.execute(
            "INSERT INTO episodes \
             (id, title, background, problem, action, ingenuity, result, metrics, before_after, \
              reproducibility, related_skills, personal_feeling, external_feedback, \
              remote_llm_allowed, tags, created_at, updated_at) \
             VALUES ('ep1', 't', '', '', '', '', '', '', '', '', '[]', '', '', 0, '[]', ?1, ?1)",
            rusqlite::params![TS],
        )
        .unwrap();
        let title: String = conn
            .query_row("SELECT title FROM episodes WHERE id = 'ep1'", [], |r| r.get(0))
            .unwrap();
        assert_eq!(title, "t");
    }

    #[test]
    fn document_revisions_foreign_key_rejects_orphan_document_id() {
        let conn = db();
        // career_documents に存在しない document_id を参照する revision は FK エラー
        let result = conn.execute(
            "INSERT INTO document_revisions \
             (id, document_id, content, source_evidence_ids, source_ai_run_id, created_by, \
              revision_reason, target_memo, previous_revision_id, created_at) \
             VALUES ('rev_orphan', 'doc_missing', '', '[]', NULL, 'human', '', '', NULL, ?1)",
            rusqlite::params![TS],
        );
        assert!(result.is_err(), "存在しない document_id を参照する revision は FK で拒否される");
    }

    // ──────────────────────────────────────────────
    // job_targets (migration 0008)
    // ──────────────────────────────────────────────

    fn insert_job_target(
        conn: &Connection,
        id: &str,
        company: &str,
        status: &str,
    ) -> rusqlite::Result<usize> {
        conn.execute(
            "INSERT INTO job_targets \
             (id, company_name, job_title, job_description, status, \
              required_skills, preferred_skills, concerns, appeal_points, created_at, updated_at) \
             VALUES (?1, ?2, 'engineer', '', ?3, '[]', '[]', '', '', ?4, ?4)",
            rusqlite::params![id, company, status, TS],
        )
    }

    #[test]
    fn job_targets_status_check_accepts_known() {
        let conn = db();
        insert_job_target(&conn, "jt1", "Acme", "researching").unwrap();
        insert_job_target(&conn, "jt2", "Acme", "applying").unwrap();
        insert_job_target(&conn, "jt3", "Acme", "interviewing").unwrap();
        insert_job_target(&conn, "jt4", "Acme", "offered").unwrap();
        insert_job_target(&conn, "jt5", "Acme", "rejected").unwrap();
        insert_job_target(&conn, "jt6", "Acme", "withdrawn").unwrap();
    }

    #[test]
    fn job_targets_status_check_rejects_invalid() {
        let conn = db();
        let result = insert_job_target(&conn, "jt_bad", "Acme", "archived");
        assert!(result.is_err(), "status='archived' must be rejected");
    }

    #[test]
    fn job_targets_skills_json_round_trips() {
        let conn = db();
        let required = r#"[{"id":"s1","text":"Rust"},{"id":"s2","text":"TypeScript"}]"#;
        let preferred = r#"[{"id":"s3","text":"Tauri"}]"#;
        conn.execute(
            "INSERT INTO job_targets \
             (id, company_name, job_title, job_description, status, \
              required_skills, preferred_skills, concerns, appeal_points, created_at, updated_at) \
             VALUES ('jt_skills', 'Acme', 'eng', 'desc', 'researching', ?1, ?2, '', '', ?3, ?3)",
            rusqlite::params![required, preferred, TS],
        )
        .unwrap();

        let (req_out, pref_out): (String, String) = conn
            .query_row(
                "SELECT required_skills, preferred_skills FROM job_targets WHERE id = 'jt_skills'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap();
        assert_eq!(req_out, required);
        assert_eq!(pref_out, preferred);
    }

    // ──────────────────────────────────────────────
    // document_revisions.job_target_id (migration 0010)
    // ──────────────────────────────────────────────

    #[test]
    fn document_revisions_job_target_id_column_exists_after_0010() {
        let conn = db();
        // PRAGMA table_info で job_target_id 列が存在することを確認
        let mut stmt = conn
            .prepare("PRAGMA table_info(document_revisions)")
            .unwrap();
        let cols: Vec<String> = stmt
            .query_map([], |r| r.get::<_, String>(1))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();
        assert!(
            cols.iter().any(|c| c == "job_target_id"),
            "document_revisions に job_target_id 列があるべき: {cols:?}"
        );
    }

    #[test]
    fn document_revisions_job_target_id_accepts_null_and_ulid() {
        let conn = db();
        insert_document(&conn, "doc1", "draft").unwrap();

        // NULL を受理（既存 row 互換）
        conn.execute(
            "INSERT INTO document_revisions \
             (id, document_id, content, source_evidence_ids, source_ai_run_id, created_by, \
              revision_reason, target_memo, job_target_id, previous_revision_id, created_at) \
             VALUES ('rev_null', 'doc1', '', '[]', NULL, 'human', 'r', '', NULL, NULL, ?1)",
            rusqlite::params![TS],
        )
        .unwrap();

        // ULID を受理
        conn.execute(
            "INSERT INTO document_revisions \
             (id, document_id, content, source_evidence_ids, source_ai_run_id, created_by, \
              revision_reason, target_memo, job_target_id, previous_revision_id, created_at) \
             VALUES ('rev_jt', 'doc1', '', '[]', NULL, 'human', 'r', '', '01HJOB1', NULL, ?1)",
            rusqlite::params![TS],
        )
        .unwrap();

        let jt: Option<String> = conn
            .query_row(
                "SELECT job_target_id FROM document_revisions WHERE id = 'rev_jt'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(jt, Some("01HJOB1".to_string()));

        let null_jt: Option<String> = conn
            .query_row(
                "SELECT job_target_id FROM document_revisions WHERE id = 'rev_null'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(null_jt, None);
    }

    // ──────────────────────────────────────────────
    // job_requirement_mappings (migration 0009)
    // ──────────────────────────────────────────────

    fn insert_job_requirement_mapping(
        conn: &Connection,
        id: &str,
        job_target_id: &str,
        requirement_skill_id: &str,
        episode_ids_json: &str,
    ) -> rusqlite::Result<usize> {
        conn.execute(
            "INSERT INTO job_requirement_mappings \
             (id, job_target_id, requirement_skill_id, episode_ids, user_note, created_at, updated_at) \
             VALUES (?1, ?2, ?3, ?4, '', ?5, ?5)",
            rusqlite::params![id, job_target_id, requirement_skill_id, episode_ids_json, TS],
        )
    }

    #[test]
    fn job_requirement_mappings_smoke_insert_and_select() {
        let conn = db();
        insert_job_target(&conn, "jt1", "Acme", "researching").unwrap();
        insert_job_requirement_mapping(
            &conn,
            "jrm1",
            "jt1",
            "skill_1",
            r#"["ep1","ep2"]"#,
        )
        .unwrap();

        let (req_skill, eps_json): (String, String) = conn
            .query_row(
                "SELECT requirement_skill_id, episode_ids FROM job_requirement_mappings WHERE id = 'jrm1'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap();
        assert_eq!(req_skill, "skill_1");
        assert_eq!(eps_json, r#"["ep1","ep2"]"#);
    }

    #[test]
    fn job_requirement_mappings_cascade_on_job_target_delete() {
        let conn = db();
        insert_job_target(&conn, "jt_cascade", "Acme", "researching").unwrap();
        insert_job_requirement_mapping(&conn, "jrm_a", "jt_cascade", "skill_a", "[]").unwrap();
        insert_job_requirement_mapping(&conn, "jrm_b", "jt_cascade", "skill_b", "[]").unwrap();

        conn.execute(
            "DELETE FROM job_targets WHERE id = ?1",
            rusqlite::params!["jt_cascade"],
        )
        .unwrap();

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM job_requirement_mappings WHERE job_target_id = 'jt_cascade'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 0, "JobTarget 削除でマッピングが CASCADE 削除される");
    }

    #[test]
    fn job_requirement_mappings_foreign_key_rejects_orphan_job_target_id() {
        let conn = db();
        let result = insert_job_requirement_mapping(
            &conn,
            "jrm_orphan",
            "jt_missing",
            "skill_1",
            "[]",
        );
        assert!(
            result.is_err(),
            "存在しない job_target_id を参照するマッピングは FK で拒否される"
        );
    }

    #[test]
    fn ai_runs_insert_and_select_smoke() {
        let conn = db();
        conn.execute(
            "INSERT INTO ai_runs \
             (id, provider, model, purpose, prompt_id, prompt_version, prompt_hash, \
              model_params, input_snapshot_mode, input_snapshot, input_references, \
              output_raw, output_parsed, parse_error, token_usage, cost_estimate_usd, created_at) \
             VALUES ('run1', 'openai', 'gpt-4', 'extract', 'p1', '1.0', 'abc', NULL, \
                     'references_only', NULL, '{}', '{}', NULL, NULL, '{}', NULL, ?1)",
            rusqlite::params![TS],
        )
        .unwrap();
        let provider: String = conn
            .query_row("SELECT provider FROM ai_runs WHERE id = 'run1'", [], |r| {
                r.get(0)
            })
            .unwrap();
        assert_eq!(provider, "openai");
    }

    // ──────────────────────────────────────────────
    // agent_track_records (migration 0013)
    // ──────────────────────────────────────────────

    fn insert_agent_track_record(
        conn: &Connection,
        id: &str,
        company_name: &str,
        status: &str,
    ) -> rusqlite::Result<usize> {
        conn.execute(
            "INSERT INTO agent_track_records \
             (id, company_name, contact_name, contact_email, contact_phone, \
              first_contact_date, memo, status, created_at, updated_at) \
             VALUES (?1, ?2, '', '', '', NULL, '', ?3, ?4, ?4)",
            rusqlite::params![id, company_name, status, TS],
        )
    }

    #[test]
    fn agent_track_records_status_check_accepts_known() {
        let conn = db();
        insert_agent_track_record(&conn, "atr1", "リクルート", "active").unwrap();
        insert_agent_track_record(&conn, "atr2", "パーソル", "archived").unwrap();
    }

    #[test]
    fn agent_track_records_status_check_rejects_invalid() {
        let conn = db();
        let result = insert_agent_track_record(&conn, "atr_bad", "リクルート", "inactive");
        assert!(result.is_err(), "status='inactive' must be rejected");
    }

    #[test]
    fn agent_track_records_company_name_required() {
        let conn = db();
        let result = conn.execute(
            "INSERT INTO agent_track_records \
             (id, company_name, status, created_at, updated_at) \
             VALUES ('atr_null', NULL, 'active', ?1, ?1)",
            rusqlite::params![TS],
        );
        assert!(result.is_err(), "company_name NOT NULL must be enforced");
    }

    #[test]
    fn agent_track_records_first_contact_date_nullable() {
        let conn = db();
        insert_agent_track_record(&conn, "atr3", "マイナビ", "active").unwrap();
        let val: Option<String> = conn
            .query_row(
                "SELECT first_contact_date FROM agent_track_records WHERE id = 'atr3'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert!(val.is_none(), "first_contact_date should be NULL by default");
    }

    // ──────────────────────────────────────────────
    // agent_meeting_emails (migration 0014)
    // ──────────────────────────────────────────────

    fn insert_agent_meeting_email(
        conn: &Connection,
        id: &str,
        agent_track_record_id: Option<&str>,
    ) -> rusqlite::Result<usize> {
        conn.execute(
            "INSERT INTO agent_meeting_emails \
             (id, agent_track_record_id, subject, body, sent_at, memo, created_at, updated_at) \
             VALUES (?1, ?2, '', '', NULL, '', ?3, ?3)",
            rusqlite::params![id, agent_track_record_id, TS],
        )
    }

    #[test]
    fn agent_meeting_emails_smoke_insert_and_select() {
        let conn = db();
        insert_agent_meeting_email(&conn, "ame1", None).unwrap();
        let subject: String = conn
            .query_row(
                "SELECT subject FROM agent_meeting_emails WHERE id = 'ame1'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(subject, "");
    }

    #[test]
    fn agent_meeting_emails_cascade_on_agent_track_record_delete() {
        let conn = db();
        insert_agent_track_record(&conn, "atr_cas", "テスト社", "active").unwrap();
        insert_agent_meeting_email(&conn, "ame_a", Some("atr_cas")).unwrap();
        insert_agent_meeting_email(&conn, "ame_b", Some("atr_cas")).unwrap();

        conn.execute(
            "DELETE FROM agent_track_records WHERE id = ?1",
            rusqlite::params!["atr_cas"],
        )
        .unwrap();

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM agent_meeting_emails WHERE agent_track_record_id = 'atr_cas'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(
            count,
            0,
            "AgentTrackRecord 削除で関連 email が CASCADE 削除される"
        );
    }

    // ──────────────────────────────────────────────
    // job_wish_sheets (migration 0015)
    // ──────────────────────────────────────────────

    fn insert_job_wish_sheet(
        conn: &Connection,
        id: &str,
        agent_track_record_id: Option<&str>,
    ) -> rusqlite::Result<usize> {
        conn.execute(
            "INSERT INTO job_wish_sheets \
             (id, agent_track_record_id, title, desired_industry, desired_role, desired_salary, \
              desired_location, desired_work_style, other_conditions, \
              group_a_companies, group_b_companies, group_c_companies, memo, created_at, updated_at) \
             VALUES (?1, ?2, '', '', '', '', '', '', '', '[]', '[]', '[]', '', ?3, ?3)",
            rusqlite::params![id, agent_track_record_id, TS],
        )
    }

    #[test]
    fn job_wish_sheets_smoke_insert_and_select() {
        let conn = db();
        insert_job_wish_sheet(&conn, "jws1", None).unwrap();
        let title: String = conn
            .query_row(
                "SELECT title FROM job_wish_sheets WHERE id = 'jws1'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(title, "");
    }

    #[test]
    fn job_wish_sheets_set_null_on_agent_track_record_delete() {
        let conn = db();
        insert_agent_track_record(&conn, "atr_jws", "テスト社", "active").unwrap();
        insert_job_wish_sheet(&conn, "jws_a", Some("atr_jws")).unwrap();
        insert_job_wish_sheet(&conn, "jws_b", Some("atr_jws")).unwrap();

        conn.execute(
            "DELETE FROM agent_track_records WHERE id = ?1",
            rusqlite::params!["atr_jws"],
        )
        .unwrap();

        let agent_id_a: Option<String> = conn
            .query_row(
                "SELECT agent_track_record_id FROM job_wish_sheets WHERE id = 'jws_a'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert!(
            agent_id_a.is_none(),
            "AgentTrackRecord 削除で job_wish_sheets.agent_track_record_id が NULL になる"
        );

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM job_wish_sheets",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 2, "シートは削除されず残る（SET NULL）");
    }
}
