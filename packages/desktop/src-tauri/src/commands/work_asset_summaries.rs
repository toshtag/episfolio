use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkAssetSummaryRow {
    pub id: String,
    pub title: String,
    pub asset_type: String,
    pub job_context: Option<String>,
    pub period: Option<String>,
    pub role: Option<String>,
    pub summary: Option<String>,
    pub strength_episode: Option<String>,
    pub talking_points: Option<String>,
    pub masking_note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str =
    "id, title, asset_type, job_context, period, role, summary, \
     strength_episode, talking_points, masking_note, created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<WorkAssetSummaryRow> {
    Ok(WorkAssetSummaryRow {
        id: row.get(0)?,
        title: row.get(1)?,
        asset_type: row.get(2)?,
        job_context: row.get(3)?,
        period: row.get(4)?,
        role: row.get(5)?,
        summary: row.get(6)?,
        strength_episode: row.get(7)?,
        talking_points: row.get(8)?,
        masking_note: row.get(9)?,
        created_at: row.get(10)?,
        updated_at: row.get(11)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorkAssetSummaryArgs {
    pub title: Option<String>,
    pub asset_type: Option<String>,
    pub job_context: Option<String>,
    pub period: Option<String>,
    pub role: Option<String>,
    pub summary: Option<String>,
    pub strength_episode: Option<String>,
    pub talking_points: Option<String>,
    pub masking_note: Option<String>,
}

#[tauri::command]
pub fn create_work_asset_summary(
    db: State<'_, Mutex<Connection>>,
    args: CreateWorkAssetSummaryArgs,
) -> Result<WorkAssetSummaryRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();

    conn.execute(
        "INSERT INTO work_asset_summaries \
         (id, title, asset_type, job_context, period, role, summary, \
          strength_episode, talking_points, masking_note, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?11)",
        rusqlite::params![
            id,
            args.title.unwrap_or_default(),
            args.asset_type.unwrap_or_else(|| "document".to_string()),
            args.job_context,
            args.period,
            args.role,
            args.summary,
            args.strength_episode,
            args.talking_points,
            args.masking_note,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM work_asset_summaries WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_work_asset_summaries(
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<WorkAssetSummaryRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM work_asset_summaries ORDER BY created_at ASC, id ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_work_asset_summary(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<WorkAssetSummaryRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM work_asset_summaries WHERE id = ?1");
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
pub struct UpdateWorkAssetSummaryArgs {
    pub title: Option<String>,
    pub asset_type: Option<String>,
    pub job_context: Option<Option<String>>,
    pub period: Option<Option<String>>,
    pub role: Option<Option<String>>,
    pub summary: Option<Option<String>>,
    pub strength_episode: Option<Option<String>>,
    pub talking_points: Option<Option<String>>,
    pub masking_note: Option<Option<String>>,
}

#[tauri::command]
pub fn update_work_asset_summary(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateWorkAssetSummaryArgs,
) -> Result<WorkAssetSummaryRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.title {
        sets.push("title = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.asset_type {
        sets.push("asset_type = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.job_context {
        sets.push("job_context = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.period {
        sets.push("period = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.role {
        sets.push("role = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.summary {
        sets.push("summary = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.strength_episode {
        sets.push("strength_episode = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.talking_points {
        sets.push("talking_points = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.masking_note {
        sets.push("masking_note = ?".to_string());
        params.push(Box::new(v));
    }

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?".to_string());
    params.push(Box::new(now));
    params.push(Box::new(id.clone()));

    let sql = format!(
        "UPDATE work_asset_summaries SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("work_asset_summary not found: {id}"));
    }

    let select_sql =
        format!("SELECT {SELECT_COLUMNS} FROM work_asset_summaries WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_work_asset_summary(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM work_asset_summaries WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("work_asset_summary not found: {id}"));
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
