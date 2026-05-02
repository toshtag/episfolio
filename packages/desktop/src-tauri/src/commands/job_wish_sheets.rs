use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct JobWishSheetRow {
    pub id: String,
    pub agent_track_record_id: Option<String>,
    pub title: String,
    pub desired_industry: String,
    pub desired_role: String,
    pub desired_salary: String,
    pub desired_location: String,
    pub desired_work_style: String,
    pub other_conditions: String,
    pub group_a_companies: String,
    pub group_b_companies: String,
    pub group_c_companies: String,
    pub memo: String,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str =
    "id, agent_track_record_id, title, desired_industry, desired_role, desired_salary, \
     desired_location, desired_work_style, other_conditions, \
     group_a_companies, group_b_companies, group_c_companies, memo, created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<JobWishSheetRow> {
    Ok(JobWishSheetRow {
        id: row.get(0)?,
        agent_track_record_id: row.get(1)?,
        title: row.get(2)?,
        desired_industry: row.get(3)?,
        desired_role: row.get(4)?,
        desired_salary: row.get(5)?,
        desired_location: row.get(6)?,
        desired_work_style: row.get(7)?,
        other_conditions: row.get(8)?,
        group_a_companies: row.get(9)?,
        group_b_companies: row.get(10)?,
        group_c_companies: row.get(11)?,
        memo: row.get(12)?,
        created_at: row.get(13)?,
        updated_at: row.get(14)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateJobWishSheetArgs {
    pub agent_track_record_id: Option<String>,
    pub title: Option<String>,
    pub desired_industry: Option<String>,
    pub desired_role: Option<String>,
    pub desired_salary: Option<String>,
    pub desired_location: Option<String>,
    pub desired_work_style: Option<String>,
    pub other_conditions: Option<String>,
    pub group_a_companies: Option<String>,
    pub group_b_companies: Option<String>,
    pub group_c_companies: Option<String>,
    pub memo: Option<String>,
}

#[tauri::command]
pub fn create_job_wish_sheet(
    db: State<'_, Mutex<Connection>>,
    args: CreateJobWishSheetArgs,
) -> Result<JobWishSheetRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();

    conn.execute(
        "INSERT INTO job_wish_sheets \
         (id, agent_track_record_id, title, desired_industry, desired_role, desired_salary, \
          desired_location, desired_work_style, other_conditions, \
          group_a_companies, group_b_companies, group_c_companies, memo, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?14)",
        rusqlite::params![
            id,
            args.agent_track_record_id,
            args.title.unwrap_or_default(),
            args.desired_industry.unwrap_or_default(),
            args.desired_role.unwrap_or_default(),
            args.desired_salary.unwrap_or_default(),
            args.desired_location.unwrap_or_default(),
            args.desired_work_style.unwrap_or_default(),
            args.other_conditions.unwrap_or_default(),
            args.group_a_companies.unwrap_or_else(|| "[]".to_string()),
            args.group_b_companies.unwrap_or_else(|| "[]".to_string()),
            args.group_c_companies.unwrap_or_else(|| "[]".to_string()),
            args.memo.unwrap_or_default(),
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM job_wish_sheets WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_job_wish_sheets(
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<JobWishSheetRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM job_wish_sheets ORDER BY created_at ASC, id ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_job_wish_sheet(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<JobWishSheetRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM job_wish_sheets WHERE id = ?1");
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
pub struct UpdateJobWishSheetArgs {
    pub agent_track_record_id: Option<Option<String>>,
    pub title: Option<String>,
    pub desired_industry: Option<String>,
    pub desired_role: Option<String>,
    pub desired_salary: Option<String>,
    pub desired_location: Option<String>,
    pub desired_work_style: Option<String>,
    pub other_conditions: Option<String>,
    pub group_a_companies: Option<String>,
    pub group_b_companies: Option<String>,
    pub group_c_companies: Option<String>,
    pub memo: Option<String>,
}

#[tauri::command]
pub fn update_job_wish_sheet(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateJobWishSheetArgs,
) -> Result<JobWishSheetRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.agent_track_record_id {
        sets.push("agent_track_record_id = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.title {
        sets.push("title = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.desired_industry {
        sets.push("desired_industry = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.desired_role {
        sets.push("desired_role = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.desired_salary {
        sets.push("desired_salary = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.desired_location {
        sets.push("desired_location = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.desired_work_style {
        sets.push("desired_work_style = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.other_conditions {
        sets.push("other_conditions = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.group_a_companies {
        sets.push("group_a_companies = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.group_b_companies {
        sets.push("group_b_companies = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.group_c_companies {
        sets.push("group_c_companies = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.memo {
        sets.push("memo = ?".to_string());
        params.push(Box::new(v));
    }

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?".to_string());
    params.push(Box::new(now));
    params.push(Box::new(id.clone()));

    let sql = format!(
        "UPDATE job_wish_sheets SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("job_wish_sheet not found: {id}"));
    }

    let select_sql = format!("SELECT {SELECT_COLUMNS} FROM job_wish_sheets WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_job_wish_sheet(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM job_wish_sheets WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("job_wish_sheet not found: {id}"));
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
