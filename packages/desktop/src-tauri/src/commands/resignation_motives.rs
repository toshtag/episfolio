use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ResignationMotiveRow {
    pub id: String,
    pub company_dissatisfaction: String,
    pub job_dissatisfaction: String,
    pub compensation_dissatisfaction: String,
    pub relationship_dissatisfaction: String,
    pub resolution_intent: String,
    pub note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str =
    "id, company_dissatisfaction, job_dissatisfaction, compensation_dissatisfaction, \
     relationship_dissatisfaction, resolution_intent, note, created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<ResignationMotiveRow> {
    Ok(ResignationMotiveRow {
        id: row.get(0)?,
        company_dissatisfaction: row.get(1)?,
        job_dissatisfaction: row.get(2)?,
        compensation_dissatisfaction: row.get(3)?,
        relationship_dissatisfaction: row.get(4)?,
        resolution_intent: row.get(5)?,
        note: row.get(6)?,
        created_at: row.get(7)?,
        updated_at: row.get(8)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateResignationMotiveArgs {
    pub company_dissatisfaction: Option<String>,
    pub job_dissatisfaction: Option<String>,
    pub compensation_dissatisfaction: Option<String>,
    pub relationship_dissatisfaction: Option<String>,
    pub resolution_intent: Option<String>,
    pub note: Option<String>,
}

#[tauri::command]
pub fn create_resignation_motive(
    db: State<'_, Mutex<Connection>>,
    args: CreateResignationMotiveArgs,
) -> Result<ResignationMotiveRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();

    conn.execute(
        "INSERT INTO resignation_motives \
         (id, company_dissatisfaction, job_dissatisfaction, compensation_dissatisfaction, \
          relationship_dissatisfaction, resolution_intent, note, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?8)",
        rusqlite::params![
            id,
            args.company_dissatisfaction.unwrap_or_default(),
            args.job_dissatisfaction.unwrap_or_default(),
            args.compensation_dissatisfaction.unwrap_or_default(),
            args.relationship_dissatisfaction.unwrap_or_default(),
            args.resolution_intent.unwrap_or_default(),
            args.note,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM resignation_motives WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_resignation_motives(
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<ResignationMotiveRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM resignation_motives ORDER BY created_at ASC, id ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_resignation_motive(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<ResignationMotiveRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM resignation_motives WHERE id = ?1");
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
pub struct UpdateResignationMotiveArgs {
    pub company_dissatisfaction: Option<String>,
    pub job_dissatisfaction: Option<String>,
    pub compensation_dissatisfaction: Option<String>,
    pub relationship_dissatisfaction: Option<String>,
    pub resolution_intent: Option<String>,
    pub note: Option<Option<String>>,
}

#[tauri::command]
pub fn update_resignation_motive(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateResignationMotiveArgs,
) -> Result<ResignationMotiveRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.company_dissatisfaction {
        sets.push("company_dissatisfaction = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.job_dissatisfaction {
        sets.push("job_dissatisfaction = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.compensation_dissatisfaction {
        sets.push("compensation_dissatisfaction = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.relationship_dissatisfaction {
        sets.push("relationship_dissatisfaction = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.resolution_intent {
        sets.push("resolution_intent = ?".to_string());
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
        "UPDATE resignation_motives SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("resignation_motive not found: {id}"));
    }

    let select_sql = format!("SELECT {SELECT_COLUMNS} FROM resignation_motives WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_resignation_motive(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM resignation_motives WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("resignation_motive not found: {id}"));
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
