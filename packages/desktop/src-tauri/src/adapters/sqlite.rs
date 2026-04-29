use rusqlite::{Connection, Result};
use std::path::PathBuf;

const MIGRATION_001: &str = include_str!("../../migrations/0001_init.sql");
const MIGRATION_002: &str = include_str!("../../migrations/0002_add_skill_evidence_ai_runs.sql");
const MIGRATION_003: &str = include_str!("../../migrations/0003_add_career_documents.sql");
const MIGRATION_004: &str = include_str!("../../migrations/0004_add_skill_evidence_source.sql");

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
