use rusqlite::{Connection, Result};
use std::path::PathBuf;

const MIGRATION_001: &str = include_str!("../../migrations/0001_init.sql");
const MIGRATION_002: &str = include_str!("../../migrations/0002_add_skill_evidence_ai_runs.sql");
const MIGRATION_003: &str = include_str!("../../migrations/0003_add_career_documents.sql");
const MIGRATION_004: &str = include_str!("../../migrations/0004_add_skill_evidence_source.sql");
const MIGRATION_005: &str = include_str!("../../migrations/0005_add_life_timeline.sql");
const MIGRATION_006: &str = include_str!("../../migrations/0006_add_document_revision_fields.sql");
const MIGRATION_007: &str = include_str!("../../migrations/0007_enum_check_constraints.sql");

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
    fn migrations_0001_through_0007_apply_to_fresh_db() {
        let conn = db();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM schema_migrations", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 7);
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
}
