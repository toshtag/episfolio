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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EpisodePatch {
    pub title: Option<String>,
    pub background: Option<String>,
    pub problem: Option<String>,
    pub action: Option<String>,
    pub ingenuity: Option<String>,
    pub result: Option<String>,
    pub metrics: Option<String>,
    pub before_after: Option<String>,
    pub reproducibility: Option<String>,
    pub related_skills: Option<Vec<String>>,
    pub personal_feeling: Option<String>,
    pub external_feedback: Option<String>,
    pub remote_llm_allowed: Option<bool>,
    pub tags: Option<Vec<String>>,
}

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<EpisodeRow> {
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
        related_skills: serde_json::from_str(&related_skills_json).unwrap_or_default(),
        personal_feeling: row.get(11)?,
        external_feedback: row.get(12)?,
        remote_llm_allowed: remote_llm_allowed != 0,
        tags: serde_json::from_str(&tags_json).unwrap_or_default(),
        created_at: row.get(15)?,
        updated_at: row.get(16)?,
    })
}

const SELECT_COLUMNS: &str = "id, title, background, problem, action, ingenuity, result, metrics, \
     before_after, reproducibility, related_skills, personal_feeling, \
     external_feedback, remote_llm_allowed, tags, created_at, updated_at";

#[tauri::command]
pub fn get_episode(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<EpisodeRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM episodes WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query_map(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())?;
    match rows.next() {
        Some(r) => Ok(Some(r.map_err(|e| e.to_string())?)),
        None => Ok(None),
    }
}

#[tauri::command]
pub fn update_episode(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: EpisodePatch,
) -> Result<EpisodeRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<&str> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    macro_rules! push_str {
        ($field:expr, $col:literal) => {
            if let Some(v) = $field {
                sets.push(concat!($col, " = ?"));
                params.push(Box::new(v));
            }
        };
    }
    push_str!(patch.title, "title");
    push_str!(patch.background, "background");
    push_str!(patch.problem, "problem");
    push_str!(patch.action, "action");
    push_str!(patch.ingenuity, "ingenuity");
    push_str!(patch.result, "result");
    push_str!(patch.metrics, "metrics");
    push_str!(patch.before_after, "before_after");
    push_str!(patch.reproducibility, "reproducibility");
    push_str!(patch.personal_feeling, "personal_feeling");
    push_str!(patch.external_feedback, "external_feedback");

    if let Some(v) = patch.related_skills {
        sets.push("related_skills = ?");
        params.push(Box::new(serde_json::to_string(&v).map_err(|e| e.to_string())?));
    }
    if let Some(v) = patch.tags {
        sets.push("tags = ?");
        params.push(Box::new(serde_json::to_string(&v).map_err(|e| e.to_string())?));
    }
    if let Some(v) = patch.remote_llm_allowed {
        sets.push("remote_llm_allowed = ?");
        params.push(Box::new(if v { 1i64 } else { 0i64 }));
    }

    sets.push("updated_at = ?");
    params.push(Box::new(now.clone()));

    let sql = format!("UPDATE episodes SET {} WHERE id = ?", sets.join(", "));
    params.push(Box::new(id.clone()));

    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("episode not found: {id}"));
    }

    let select_sql = format!("SELECT {SELECT_COLUMNS} FROM episodes WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query_map(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())?;
    match rows.next() {
        Some(r) => r.map_err(|e| e.to_string()),
        None => Err(format!("episode not found after update: {id}")),
    }
}

#[tauri::command]
pub fn delete_episode(db: State<'_, Mutex<Connection>>, id: String) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute("DELETE FROM episodes WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("episode not found: {id}"));
    }
    Ok(())
}

#[tauri::command]
pub fn list_episodes(db: State<'_, Mutex<Connection>>) -> Result<Vec<EpisodeRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM episodes ORDER BY created_at DESC");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], row_from_query).map_err(|e| e.to_string())?;
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
