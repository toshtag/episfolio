use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StrengthArrowRow {
    pub id: String,
    #[serde(rename = "type")]
    pub arrow_type: String,
    pub description: String,
    pub source: String,
    pub occurred_at: Option<String>,
    pub related_episode_ids: String,
    pub note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str =
    "id, type, description, source, occurred_at, related_episode_ids, note, created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<StrengthArrowRow> {
    Ok(StrengthArrowRow {
        id: row.get(0)?,
        arrow_type: row.get(1)?,
        description: row.get(2)?,
        source: row.get(3)?,
        occurred_at: row.get(4)?,
        related_episode_ids: row.get(5)?,
        note: row.get(6)?,
        created_at: row.get(7)?,
        updated_at: row.get(8)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateStrengthArrowArgs {
    #[serde(rename = "type")]
    pub arrow_type: String,
    pub description: Option<String>,
    pub source: Option<String>,
    pub occurred_at: Option<String>,
    pub related_episode_ids: Option<String>,
    pub note: Option<String>,
}

#[tauri::command]
pub fn create_strength_arrow(
    db: State<'_, Mutex<Connection>>,
    args: CreateStrengthArrowArgs,
) -> Result<StrengthArrowRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();

    conn.execute(
        "INSERT INTO strength_arrows \
         (id, type, description, source, occurred_at, related_episode_ids, note, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?8)",
        rusqlite::params![
            id,
            args.arrow_type,
            args.description.unwrap_or_default(),
            args.source.unwrap_or_default(),
            args.occurred_at,
            args.related_episode_ids.unwrap_or_else(|| "[]".to_string()),
            args.note,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM strength_arrows WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_strength_arrows(
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<StrengthArrowRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM strength_arrows ORDER BY created_at ASC, id ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_strength_arrows_by_type(
    db: State<'_, Mutex<Connection>>,
    arrow_type: String,
) -> Result<Vec<StrengthArrowRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM strength_arrows WHERE type = ?1 ORDER BY created_at ASC, id ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(rusqlite::params![arrow_type], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_strength_arrow(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<StrengthArrowRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM strength_arrows WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query_map(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())?;
    match rows.next() {
        Some(r) => Ok(Some(r.map_err(|e| e.to_string())?)),
        None => Ok(None),
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStrengthArrowArgs {
    #[serde(rename = "type")]
    pub arrow_type: Option<String>,
    pub description: Option<String>,
    pub source: Option<String>,
    pub occurred_at: Option<Option<String>>,
    pub related_episode_ids: Option<String>,
    pub note: Option<Option<String>>,
}

#[tauri::command]
pub fn update_strength_arrow(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateStrengthArrowArgs,
) -> Result<StrengthArrowRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.arrow_type {
        sets.push("type = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.description {
        sets.push("description = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.source {
        sets.push("source = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.occurred_at {
        sets.push("occurred_at = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.related_episode_ids {
        sets.push("related_episode_ids = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.note {
        sets.push("note = ?".to_string());
        params.push(Box::new(v));
    }

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?".to_string());
    params.push(Box::new(now));
    params.push(Box::new(id.clone()));

    let sql = format!(
        "UPDATE strength_arrows SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("strength_arrow not found: {id}"));
    }

    let select_sql = format!("SELECT {SELECT_COLUMNS} FROM strength_arrows WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_strength_arrow(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM strength_arrows WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("strength_arrow not found: {id}"));
    }
    Ok(())
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

    let months = [
        31u64,
        if is_leap(year) { 29 } else { 28 },
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ];
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
