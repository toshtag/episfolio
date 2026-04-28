use rusqlite::{Connection, Result};
use std::path::PathBuf;

const MIGRATION_001: &str = include_str!("../../migrations/0001_init.sql");

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

    let applied: bool = conn.query_row(
        "SELECT COUNT(*) FROM schema_migrations WHERE version = '0001'",
        [],
        |row| row.get::<_, i64>(0),
    )? > 0;

    if !applied {
        conn.execute_batch(MIGRATION_001)?;
        conn.execute(
            "INSERT INTO schema_migrations (version, applied_at) VALUES ('0001', datetime('now'))",
            [],
        )?;
    }

    Ok(())
}
