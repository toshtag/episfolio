use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AgentTrackRecordRow {
    pub id: String,
    pub company_name: String,
    pub contact_name: String,
    pub contact_email: String,
    pub contact_phone: String,
    pub first_contact_date: Option<String>,
    pub memo: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str =
    "id, company_name, contact_name, contact_email, contact_phone, \
     first_contact_date, memo, status, created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<AgentTrackRecordRow> {
    Ok(AgentTrackRecordRow {
        id: row.get(0)?,
        company_name: row.get(1)?,
        contact_name: row.get(2)?,
        contact_email: row.get(3)?,
        contact_phone: row.get(4)?,
        first_contact_date: row.get(5)?,
        memo: row.get(6)?,
        status: row.get(7)?,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAgentTrackRecordArgs {
    pub company_name: String,
    pub contact_name: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub first_contact_date: Option<String>,
    pub memo: Option<String>,
    pub status: Option<String>,
}

#[tauri::command]
pub fn create_agent_track_record(
    db: State<'_, Mutex<Connection>>,
    args: CreateAgentTrackRecordArgs,
) -> Result<AgentTrackRecordRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();
    let status = args.status.unwrap_or_else(|| "active".to_string());

    conn.execute(
        "INSERT INTO agent_track_records \
         (id, company_name, contact_name, contact_email, contact_phone, \
          first_contact_date, memo, status, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?9)",
        rusqlite::params![
            id,
            args.company_name,
            args.contact_name.unwrap_or_default(),
            args.contact_email.unwrap_or_default(),
            args.contact_phone.unwrap_or_default(),
            args.first_contact_date,
            args.memo.unwrap_or_default(),
            status,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM agent_track_records WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_agent_track_records(
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<AgentTrackRecordRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM agent_track_records ORDER BY created_at ASC, id ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_agent_track_record(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<AgentTrackRecordRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM agent_track_records WHERE id = ?1");
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
pub struct UpdateAgentTrackRecordArgs {
    pub company_name: Option<String>,
    pub contact_name: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub first_contact_date: Option<Option<String>>,
    pub memo: Option<String>,
    pub status: Option<String>,
}

#[tauri::command]
pub fn update_agent_track_record(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateAgentTrackRecordArgs,
) -> Result<AgentTrackRecordRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.company_name {
        sets.push("company_name = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.contact_name {
        sets.push("contact_name = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.contact_email {
        sets.push("contact_email = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.contact_phone {
        sets.push("contact_phone = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.first_contact_date {
        sets.push("first_contact_date = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.memo {
        sets.push("memo = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.status {
        sets.push("status = ?".to_string());
        params.push(Box::new(v));
    }

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?".to_string());
    params.push(Box::new(now));
    params.push(Box::new(id.clone()));

    let sql = format!(
        "UPDATE agent_track_records SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("agent_track_record not found: {id}"));
    }

    let select_sql = format!("SELECT {SELECT_COLUMNS} FROM agent_track_records WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_agent_track_record(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM agent_track_records WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("agent_track_record not found: {id}"));
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
