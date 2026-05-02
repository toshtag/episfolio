use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationMotiveRow {
    pub id: String,
    pub job_target_id: String,
    pub company_future: String,
    pub contribution_action: String,
    pub leveraged_experience: String,
    pub formatted_text: String,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str =
    "id, job_target_id, company_future, contribution_action, leveraged_experience, \
     formatted_text, created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<ApplicationMotiveRow> {
    Ok(ApplicationMotiveRow {
        id: row.get(0)?,
        job_target_id: row.get(1)?,
        company_future: row.get(2)?,
        contribution_action: row.get(3)?,
        leveraged_experience: row.get(4)?,
        formatted_text: row.get(5)?,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateApplicationMotiveArgs {
    pub job_target_id: String,
    pub company_future: Option<String>,
    pub contribution_action: Option<String>,
    pub leveraged_experience: Option<String>,
    pub formatted_text: Option<String>,
}

#[tauri::command]
pub fn create_application_motive(
    db: State<'_, Mutex<Connection>>,
    args: CreateApplicationMotiveArgs,
) -> Result<ApplicationMotiveRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();

    conn.execute(
        "INSERT INTO application_motives \
         (id, job_target_id, company_future, contribution_action, leveraged_experience, \
          formatted_text, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?7)",
        rusqlite::params![
            id,
            args.job_target_id,
            args.company_future.unwrap_or_default(),
            args.contribution_action.unwrap_or_default(),
            args.leveraged_experience.unwrap_or_default(),
            args.formatted_text.unwrap_or_default(),
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM application_motives WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_application_motives(
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<ApplicationMotiveRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM application_motives ORDER BY created_at ASC, id ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_application_motives_by_job_target(
    db: State<'_, Mutex<Connection>>,
    job_target_id: String,
) -> Result<Vec<ApplicationMotiveRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM application_motives \
         WHERE job_target_id = ?1 ORDER BY created_at ASC, id ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(rusqlite::params![job_target_id], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_application_motive(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<ApplicationMotiveRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM application_motives WHERE id = ?1");
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
pub struct UpdateApplicationMotiveArgs {
    pub company_future: Option<String>,
    pub contribution_action: Option<String>,
    pub leveraged_experience: Option<String>,
    pub formatted_text: Option<String>,
}

#[tauri::command]
pub fn update_application_motive(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateApplicationMotiveArgs,
) -> Result<ApplicationMotiveRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.company_future {
        sets.push("company_future = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.contribution_action {
        sets.push("contribution_action = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.leveraged_experience {
        sets.push("leveraged_experience = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.formatted_text {
        sets.push("formatted_text = ?".to_string());
        params.push(Box::new(v));
    }

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?".to_string());
    params.push(Box::new(now));
    params.push(Box::new(id.clone()));

    let sql = format!(
        "UPDATE application_motives SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("application_motive not found: {id}"));
    }

    let select_sql = format!("SELECT {SELECT_COLUMNS} FROM application_motives WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_application_motive(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM application_motives WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("application_motive not found: {id}"));
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
