use rusqlite::{Connection, MAIN_DB};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{Manager, State};

const MAX_GENERATIONS: usize = 7;
const BACKUP_INTERVAL_SECS: u64 = 24 * 60 * 60;

/// バックアップが必要かどうかを判定し、必要なら実行する。
/// 前回バックアップから 24h 以上経過していれば SQLite の online backup API で
/// {appDataDir}/backups/episfolio-{date}.db を作成し、
/// 7 世代を超えた古いファイルを削除する。
#[tauri::command]
pub fn backup_if_needed(
    app: tauri::AppHandle,
    db: State<'_, Mutex<Connection>>,
) -> Result<bool, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    let db_path = app_data_dir.join("episfolio.db");
    if !db_path.exists() {
        return Ok(false);
    }

    let backup_dir = app_data_dir.join("backups");
    fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;

    if !should_backup(&backup_dir) {
        return Ok(false);
    }

    let date = current_date_str();
    let conn = db.lock().map_err(|e| e.to_string())?;
    create_backup(&conn, &backup_dir, &date)?;

    rotate_backups(&backup_dir)?;

    Ok(true)
}

/// バックアップファイルの一覧を返す（新しい順）。
#[tauri::command]
pub fn list_backups(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let backup_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("backups");

    if !backup_dir.exists() {
        return Ok(vec![]);
    }

    let mut files = sorted_backup_files(&backup_dir)?;
    files.reverse();
    let names = files
        .into_iter()
        .filter_map(|p| p.file_name()?.to_str().map(str::to_owned))
        .collect();
    Ok(names)
}

/// 指定したバックアップファイルを episfolio.db に上書き復元する。
/// ファイル名は `episfolio-YYYY-MM-DD.db` 形式のみ受け付ける。
#[tauri::command]
pub fn restore_backup(
    app: tauri::AppHandle,
    db: State<'_, Mutex<Connection>>,
    filename: String,
) -> Result<(), String> {
    if !is_backup_filename(&filename) {
        return Err("無効なバックアップファイル名です".to_string());
    }

    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    let src = app_data_dir.join("backups").join(&filename);
    let metadata = fs::symlink_metadata(&src)
        .map_err(|_| format!("バックアップファイルが見つかりません: {filename}"))?;
    if !metadata.file_type().is_file() {
        return Err("無効なバックアップファイルです".to_string());
    }

    let mut conn = db.lock().map_err(|e| e.to_string())?;
    restore_from_backup(&mut conn, &src)?;
    Ok(())
}

fn create_backup(conn: &Connection, backup_dir: &Path, date: &str) -> Result<PathBuf, String> {
    fs::create_dir_all(backup_dir).map_err(|e| e.to_string())?;

    let filename = format!("episfolio-{date}.db");
    let dest = backup_dir.join(&filename);
    let tmp = backup_dir.join(format!("{filename}.tmp"));

    if tmp.exists() {
        fs::remove_file(&tmp).map_err(|e| e.to_string())?;
    }

    conn.backup(MAIN_DB, &tmp, None)
        .map_err(|e| e.to_string())?;

    if dest.exists() {
        fs::remove_file(&dest).map_err(|e| e.to_string())?;
    }
    fs::rename(&tmp, &dest).map_err(|e| {
        let _ = fs::remove_file(&tmp);
        e.to_string()
    })?;

    Ok(dest)
}

fn restore_from_backup(conn: &mut Connection, backup_path: &Path) -> Result<(), String> {
    conn.restore(MAIN_DB, backup_path, None::<fn(rusqlite::backup::Progress)>)
        .map_err(|e| e.to_string())
}

fn is_backup_filename(filename: &str) -> bool {
    const PREFIX: &str = "episfolio-";
    const SUFFIX: &str = ".db";

    if filename.len() != PREFIX.len() + "YYYY-MM-DD".len() + SUFFIX.len()
        || !filename.starts_with(PREFIX)
        || !filename.ends_with(SUFFIX)
    {
        return false;
    }

    let date = &filename[PREFIX.len()..filename.len() - SUFFIX.len()];
    let bytes = date.as_bytes();
    bytes[4] == b'-'
        && bytes[7] == b'-'
        && bytes
            .iter()
            .enumerate()
            .all(|(i, b)| i == 4 || i == 7 || b.is_ascii_digit())
        && date[5..7]
            .parse::<u32>()
            .is_ok_and(|month| (1..=12).contains(&month))
        && date[8..10]
            .parse::<u32>()
            .is_ok_and(|day| (1..=31).contains(&day))
}

fn is_backup_file(path: &Path) -> bool {
    path.file_name()
        .and_then(|s| s.to_str())
        .is_some_and(is_backup_filename)
        && fs::symlink_metadata(path)
            .map(|m| m.file_type().is_file())
            .unwrap_or(false)
}

fn should_backup(backup_dir: &PathBuf) -> bool {
    let entries = match sorted_backup_files(backup_dir) {
        Ok(v) => v,
        Err(_) => return true,
    };

    let latest = match entries.last() {
        Some(p) => p.clone(),
        None => return true,
    };

    let modified = match latest.metadata().and_then(|m| m.modified()) {
        Ok(t) => t,
        Err(_) => return true,
    };

    match modified.elapsed() {
        Ok(elapsed) => elapsed.as_secs() >= BACKUP_INTERVAL_SECS,
        Err(_) => false,
    }
}

fn rotate_backups(backup_dir: &PathBuf) -> Result<(), String> {
    let entries = sorted_backup_files(backup_dir)?;
    if entries.len() > MAX_GENERATIONS {
        let to_delete = entries.len() - MAX_GENERATIONS;
        for path in entries.iter().take(to_delete) {
            fs::remove_file(path).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

fn sorted_backup_files(backup_dir: &PathBuf) -> Result<Vec<PathBuf>, String> {
    let mut files: Vec<PathBuf> = fs::read_dir(backup_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| is_backup_file(p))
        .collect();

    files.sort_by(|a, b| {
        let mt_a = a.metadata().and_then(|m| m.modified()).ok();
        let mt_b = b.metadata().and_then(|m| m.modified()).ok();
        mt_a.cmp(&mt_b)
    });

    Ok(files)
}

fn current_date_str() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    // JST = UTC+9
    let secs_jst = secs + 9 * 3600;
    let days = secs_jst / 86400;
    // ユリウス日から年月日へ変換（グレゴリオ暦）
    let (y, m, d) = jdn_to_ymd(days + 2440588);
    format!("{y:04}-{m:02}-{d:02}")
}

fn jdn_to_ymd(jdn: u64) -> (u32, u32, u32) {
    // アルゴリズム: Richards (2013)
    let f = jdn + 1401 + (((4 * jdn + 274277) / 146097) * 3) / 4 - 38;
    let e = 4 * f + 3;
    let g = (e % 1461) / 4;
    let h = 5 * g + 2;
    let day = (h % 153) / 5 + 1;
    let month = (h / 153 + 2) % 12 + 1;
    let year = e / 1461 - 4716 + (14 - month) / 12;
    (year as u32, month as u32, day as u32)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn make_temp_backup_dir(suffix: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("episfolio-backup-test-{suffix}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn make_backup_file(dir: &std::path::Path, name: &str) -> PathBuf {
        let path = dir.join(name);
        fs::write(&path, b"dummy").unwrap();
        path
    }

    fn cleanup(dir: &PathBuf) {
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn test_current_date_str_format() {
        let s = current_date_str();
        assert_eq!(s.len(), 10);
        let parts: Vec<&str> = s.split('-').collect();
        assert_eq!(parts.len(), 3);
        assert_eq!(parts[0].len(), 4);
        assert_eq!(parts[1].len(), 2);
        assert_eq!(parts[2].len(), 2);
    }

    #[test]
    fn test_jdn_to_ymd_known_dates() {
        // 2000-01-01 = JDN 2451545
        assert_eq!(jdn_to_ymd(2451545), (2000, 1, 1));
        // 2026-05-04 = JDN 2461165
        assert_eq!(jdn_to_ymd(2461165), (2026, 5, 4));
    }

    #[test]
    fn test_rotate_backups_removes_oldest_when_over_limit() {
        let backup_dir = make_temp_backup_dir("rotate-over");

        // 8 ファイル作成（limit を 1 超過）
        for i in 1..=8u32 {
            let name = format!("episfolio-2026-01-{i:02}.db");
            make_backup_file(&backup_dir, &name);
            std::thread::sleep(std::time::Duration::from_millis(10));
        }

        rotate_backups(&backup_dir).unwrap();

        let remaining = sorted_backup_files(&backup_dir).unwrap();
        assert_eq!(remaining.len(), MAX_GENERATIONS);
        cleanup(&backup_dir);
    }

    #[test]
    fn test_rotate_backups_keeps_within_limit() {
        let backup_dir = make_temp_backup_dir("rotate-within");

        for i in 1..=5u32 {
            make_backup_file(&backup_dir, &format!("episfolio-2026-01-{i:02}.db"));
        }

        rotate_backups(&backup_dir).unwrap();

        let remaining = sorted_backup_files(&backup_dir).unwrap();
        assert_eq!(remaining.len(), 5);
        cleanup(&backup_dir);
    }

    #[test]
    fn test_sorted_backup_files_ignores_non_backup_files() {
        let backup_dir = make_temp_backup_dir("filter");

        make_backup_file(&backup_dir, "episfolio-2026-01-01.db");
        make_backup_file(&backup_dir, "other.db");
        make_backup_file(&backup_dir, "episfolio-2026-01-01.db.tmp");
        make_backup_file(&backup_dir, "episfolio-2026-1-1.db");
        fs::create_dir(backup_dir.join("episfolio-2026-01-03.db")).unwrap();
        fs::write(backup_dir.join("episfolio-2026-01-02.txt"), b"x").unwrap();

        let files = sorted_backup_files(&backup_dir).unwrap();
        assert_eq!(files.len(), 1);
        assert!(files[0]
            .file_name()
            .unwrap()
            .to_str()
            .unwrap()
            .starts_with("episfolio-"));
        cleanup(&backup_dir);
    }

    #[test]
    fn test_should_backup_returns_true_when_no_backups_exist() {
        let backup_dir = make_temp_backup_dir("should-backup-empty");
        assert!(should_backup(&backup_dir));
        cleanup(&backup_dir);
    }

    #[test]
    fn test_sorted_backup_files_returns_newest_last() {
        let backup_dir = make_temp_backup_dir("sorted-order");

        make_backup_file(&backup_dir, "episfolio-2026-01-01.db");
        std::thread::sleep(std::time::Duration::from_millis(10));
        make_backup_file(&backup_dir, "episfolio-2026-01-03.db");
        std::thread::sleep(std::time::Duration::from_millis(10));
        make_backup_file(&backup_dir, "episfolio-2026-01-02.db");

        let files = sorted_backup_files(&backup_dir).unwrap();
        // mtime 順なので最後に作ったファイルが末尾
        let last_name = files.last().unwrap().file_name().unwrap().to_str().unwrap();
        assert_eq!(last_name, "episfolio-2026-01-02.db");
        cleanup(&backup_dir);
    }

    #[test]
    fn test_restore_backup_rejects_invalid_filename() {
        assert!(is_backup_filename("episfolio-2026-01-01.db"));

        let invalid_cases = [
            "other.db",
            "episfolio-2026-01-01.txt",
            "../etc/passwd",
            "episfolio-2026-01-01.db/../x.db",
            "episfolio-2026-1-1.db",
            "episfolio-2026-01-aa.db",
            "episfolio-../../evil.db",
            "episfolio-2026-00-01.db",
            "episfolio-2026-13-01.db",
            "episfolio-2026-01-00.db",
            "episfolio-2026-01-32.db",
        ];
        for name in invalid_cases {
            assert!(!is_backup_filename(name), "should reject: {name}");
        }
    }

    #[test]
    fn test_create_backup_captures_wal_changes() {
        let root = make_temp_backup_dir("wal-captures");
        let live_path = root.join("live.db");
        let backup_dir = root.join("backups");
        let conn = Connection::open(&live_path).unwrap();
        conn.execute_batch(
            "
            PRAGMA journal_mode=WAL;
            PRAGMA wal_autocheckpoint=0;
            CREATE TABLE items (id INTEGER PRIMARY KEY, value TEXT NOT NULL);
            INSERT INTO items (value) VALUES ('from wal');
            ",
        )
        .unwrap();
        assert!(root.join("live.db-wal").exists());

        let backup_path = create_backup(&conn, &backup_dir, "2026-05-04").unwrap();
        {
            let backup_conn = Connection::open(&backup_path).unwrap();
            let value: String = backup_conn
                .query_row("SELECT value FROM items WHERE id = 1", [], |row| row.get(0))
                .unwrap();
            assert_eq!(value, "from wal");
        }

        drop(conn);
        cleanup(&root);
    }

    #[test]
    fn test_restore_from_backup_replaces_live_connection() {
        let root = make_temp_backup_dir("restore-online");
        let live_path = root.join("live.db");
        let backup_path = root.join("source.db");
        let mut conn = Connection::open(&live_path).unwrap();
        conn.execute_batch(
            "
            PRAGMA journal_mode=WAL;
            CREATE TABLE items (id INTEGER PRIMARY KEY, value TEXT NOT NULL);
            INSERT INTO items (value) VALUES ('before');
            ",
        )
        .unwrap();

        {
            let backup_conn = Connection::open(&backup_path).unwrap();
            backup_conn
                .execute_batch(
                    "
                    CREATE TABLE items (id INTEGER PRIMARY KEY, value TEXT NOT NULL);
                    INSERT INTO items (value) VALUES ('after');
                    ",
                )
                .unwrap();
        }

        restore_from_backup(&mut conn, &backup_path).unwrap();

        let value: String = conn
            .query_row("SELECT value FROM items WHERE id = 1", [], |row| row.get(0))
            .unwrap();
        assert_eq!(value, "after");

        drop(conn);
        cleanup(&root);
    }
}
