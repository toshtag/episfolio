use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InterviewReportRow {
    pub id: String,
    pub job_target_id: String,
    pub stage: String,
    pub interviewer_note: String,
    pub qa_note: String,
    pub motivation_change_note: String,
    pub questions_to_bring_note: String,
    pub conducted_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str = "id, job_target_id, stage, interviewer_note, qa_note, \
     motivation_change_note, questions_to_bring_note, conducted_at, created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<InterviewReportRow> {
    Ok(InterviewReportRow {
        id: row.get(0)?,
        job_target_id: row.get(1)?,
        stage: row.get(2)?,
        interviewer_note: row.get(3)?,
        qa_note: row.get(4)?,
        motivation_change_note: row.get(5)?,
        questions_to_bring_note: row.get(6)?,
        conducted_at: row.get(7)?,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInterviewReportArgs {
    pub job_target_id: String,
    pub stage: Option<String>,
    pub interviewer_note: Option<String>,
    pub qa_note: Option<String>,
    pub motivation_change_note: Option<String>,
    pub questions_to_bring_note: Option<String>,
    pub conducted_at: Option<String>,
}

#[tauri::command]
pub fn create_interview_report(
    db: State<'_, Mutex<Connection>>,
    args: CreateInterviewReportArgs,
) -> Result<InterviewReportRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();
    let stage = args.stage.unwrap_or_else(|| "first".to_string());

    conn.execute(
        "INSERT INTO interview_reports \
         (id, job_target_id, stage, interviewer_note, qa_note, \
          motivation_change_note, questions_to_bring_note, conducted_at, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?9)",
        rusqlite::params![
            id,
            args.job_target_id,
            stage,
            args.interviewer_note.unwrap_or_default(),
            args.qa_note.unwrap_or_default(),
            args.motivation_change_note.unwrap_or_default(),
            args.questions_to_bring_note.unwrap_or_default(),
            args.conducted_at,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM interview_reports WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_interview_reports_by_job_target(
    db: State<'_, Mutex<Connection>>,
    job_target_id: String,
) -> Result<Vec<InterviewReportRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM interview_reports \
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
pub fn get_interview_report(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<InterviewReportRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM interview_reports WHERE id = ?1");
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
pub struct UpdateInterviewReportArgs {
    pub stage: Option<String>,
    pub interviewer_note: Option<String>,
    pub qa_note: Option<String>,
    pub motivation_change_note: Option<String>,
    pub questions_to_bring_note: Option<String>,
    pub conducted_at: Option<Option<String>>,
}

#[tauri::command]
pub fn update_interview_report(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateInterviewReportArgs,
) -> Result<InterviewReportRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.stage {
        sets.push("stage = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.interviewer_note {
        sets.push("interviewer_note = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.qa_note {
        sets.push("qa_note = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.motivation_change_note {
        sets.push("motivation_change_note = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.questions_to_bring_note {
        sets.push("questions_to_bring_note = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.conducted_at {
        sets.push("conducted_at = ?".to_string());
        params.push(Box::new(v));
    }

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?".to_string());
    params.push(Box::new(now));
    params.push(Box::new(id.clone()));

    let sql = format!(
        "UPDATE interview_reports SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("interview_report not found: {id}"));
    }

    let select_sql = format!("SELECT {SELECT_COLUMNS} FROM interview_reports WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_interview_report(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM interview_reports WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("interview_report not found: {id}"));
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
