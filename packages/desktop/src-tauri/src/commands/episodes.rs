use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EpisodeRow {
    pub id: String,
    pub title: String,
    pub background: String,
    pub problem: String,
    pub action: String,
    pub ingenuity: String,
    pub result: String,
    pub metrics: String,
    pub before_after: String,
    pub reproducibility: String,
    pub related_skills: Vec<String>,
    pub personal_feeling: String,
    pub external_feedback: String,
    pub remote_llm_allowed: bool,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub fn create_episode(
    db: State<'_, Mutex<Connection>>,
    title: String,
) -> Result<EpisodeRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();

    conn.execute(
        "INSERT INTO episodes (id, title, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![id, title, now, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(EpisodeRow {
        id,
        title,
        background: String::new(),
        problem: String::new(),
        action: String::new(),
        ingenuity: String::new(),
        result: String::new(),
        metrics: String::new(),
        before_after: String::new(),
        reproducibility: String::new(),
        related_skills: vec![],
        personal_feeling: String::new(),
        external_feedback: String::new(),
        remote_llm_allowed: false,
        tags: vec![],
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn list_episodes(db: State<'_, Mutex<Connection>>) -> Result<Vec<EpisodeRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, title, background, problem, action, ingenuity, result, metrics,
                    before_after, reproducibility, related_skills, personal_feeling,
                    external_feedback, remote_llm_allowed, tags, created_at, updated_at
             FROM episodes ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let related_skills_json: String = row.get(10)?;
            let tags_json: String = row.get(14)?;
            let remote_llm_allowed: i64 = row.get(13)?;
            Ok(EpisodeRow {
                id: row.get(0)?,
                title: row.get(1)?,
                background: row.get(2)?,
                problem: row.get(3)?,
                action: row.get(4)?,
                ingenuity: row.get(5)?,
                result: row.get(6)?,
                metrics: row.get(7)?,
                before_after: row.get(8)?,
                reproducibility: row.get(9)?,
                related_skills: serde_json::from_str(&related_skills_json)
                    .unwrap_or_default(),
                personal_feeling: row.get(11)?,
                external_feedback: row.get(12)?,
                remote_llm_allowed: remote_llm_allowed != 0,
                tags: serde_json::from_str(&tags_json).unwrap_or_default(),
                created_at: row.get(15)?,
                updated_at: row.get(16)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let (y, mo, d, h, mi, s) = epoch_to_parts(secs);
    format!("{y:04}-{mo:02}-{d:02}T{h:02}:{mi:02}:{s:02}Z")
}

fn epoch_to_parts(secs: u64) -> (u64, u64, u64, u64, u64, u64) {
    let s = secs % 60;
    let mins = secs / 60;
    let mi = mins % 60;
    let hours = mins / 60;
    let h = hours % 24;
    let days = hours / 24;

    let mut year = 1970u64;
    let mut remaining = days;
    loop {
        let days_in_year = if is_leap(year) { 366 } else { 365 };
        if remaining < days_in_year {
            break;
        }
        remaining -= days_in_year;
        year += 1;
    }

    let months = [31u64, if is_leap(year) { 29 } else { 28 }, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let mut month = 1u64;
    for &days_in_month in &months {
        if remaining < days_in_month {
            break;
        }
        remaining -= days_in_month;
        month += 1;
    }
    (year, month, remaining + 1, h, mi, s)
}

fn is_leap(y: u64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
}
