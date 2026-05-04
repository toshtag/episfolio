use std::fs;
use std::path::PathBuf;
use tauri::Manager;

const MAX_GENERATIONS: usize = 7;
const BACKUP_INTERVAL_SECS: u64 = 24 * 60 * 60;

/// バックアップが必要かどうかを判定し、必要なら実行する。
/// 前回バックアップから 24h 以上経過していれば episfolio.db を
/// {appDataDir}/backups/episfolio-{date}.db にコピーし、
/// 7 世代を超えた古いファイルを削除する。
#[tauri::command]
pub fn backup_if_needed(app: tauri::AppHandle) -> Result<bool, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

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
    let dest = backup_dir.join(format!("episfolio-{date}.db"));
    fs::copy(&db_path, &dest).map_err(|e| e.to_string())?;

    rotate_backups(&backup_dir)?;

    Ok(true)
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
        .filter(|p| {
            p.extension().and_then(|s| s.to_str()) == Some("db")
                && p.file_name()
                    .and_then(|s| s.to_str())
                    .map(|s| s.starts_with("episfolio-"))
                    .unwrap_or(false)
        })
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
}
