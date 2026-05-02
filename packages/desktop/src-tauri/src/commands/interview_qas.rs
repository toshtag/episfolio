use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InterviewQARow {
    pub id: String,
    pub job_target_id: String,
    pub category: String,
    pub question_asked: String,
    pub recommended_answer: Option<String>,
    pub answer_to_avoid: Option<String>,
    pub question_intent: Option<String>,
    pub order_index: i64,
    pub source: String,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str = "id, job_target_id, category, question_asked, \
     recommended_answer, answer_to_avoid, question_intent, \
     order_index, source, created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<InterviewQARow> {
    Ok(InterviewQARow {
        id: row.get(0)?,
        job_target_id: row.get(1)?,
        category: row.get(2)?,
        question_asked: row.get(3)?,
        recommended_answer: row.get(4)?,
        answer_to_avoid: row.get(5)?,
        question_intent: row.get(6)?,
        order_index: row.get(7)?,
        source: row.get(8)?,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInterviewQAArgs {
    pub job_target_id: String,
    pub category: Option<String>,
    pub question_asked: String,
    pub recommended_answer: Option<String>,
    pub answer_to_avoid: Option<String>,
    pub question_intent: Option<String>,
    pub order_index: Option<i64>,
    pub source: Option<String>,
}

#[tauri::command]
pub fn create_interview_qa(
    db: State<'_, Mutex<Connection>>,
    args: CreateInterviewQAArgs,
) -> Result<InterviewQARow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();
    let category = args.category.unwrap_or_else(|| "other".to_string());
    let source = args.source.unwrap_or_else(|| "manual".to_string());
    let order_index = args.order_index.unwrap_or(0);

    conn.execute(
        "INSERT INTO interview_qas \
         (id, job_target_id, category, question_asked, recommended_answer, \
          answer_to_avoid, question_intent, order_index, source, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?10)",
        rusqlite::params![
            id,
            args.job_target_id,
            category,
            args.question_asked,
            args.recommended_answer,
            args.answer_to_avoid,
            args.question_intent,
            order_index,
            source,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM interview_qas WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_interview_qas_by_job_target(
    db: State<'_, Mutex<Connection>>,
    job_target_id: String,
    sort_by: Option<String>,
) -> Result<Vec<InterviewQARow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let order = match sort_by.as_deref() {
        Some("createdAt") => "created_at ASC, id ASC",
        _ => "order_index ASC, id ASC",
    };
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM interview_qas WHERE job_target_id = ?1 ORDER BY {order}"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(rusqlite::params![job_target_id], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_interview_qa(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<InterviewQARow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM interview_qas WHERE id = ?1");
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
pub struct UpdateInterviewQAArgs {
    pub category: Option<String>,
    pub question_asked: Option<String>,
    pub recommended_answer: Option<Option<String>>,
    pub answer_to_avoid: Option<Option<String>>,
    pub question_intent: Option<Option<String>>,
    pub order_index: Option<i64>,
    pub source: Option<String>,
}

#[tauri::command]
pub fn update_interview_qa(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateInterviewQAArgs,
) -> Result<InterviewQARow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.category {
        sets.push("category = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.question_asked {
        sets.push("question_asked = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.recommended_answer {
        sets.push("recommended_answer = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.answer_to_avoid {
        sets.push("answer_to_avoid = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.question_intent {
        sets.push("question_intent = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.order_index {
        sets.push("order_index = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.source {
        sets.push("source = ?".to_string());
        params.push(Box::new(v));
    }

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?".to_string());
    params.push(Box::new(now));
    params.push(Box::new(id.clone()));

    let sql = format!(
        "UPDATE interview_qas SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("interview_qa not found: {id}"));
    }

    let select_sql = format!("SELECT {SELECT_COLUMNS} FROM interview_qas WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_interview_qa(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM interview_qas WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("interview_qa not found: {id}"));
    }
    Ok(())
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReorderInterviewQAsArgs {
    pub job_target_id: String,
    pub ids_in_order: Vec<String>,
}

#[tauri::command]
pub fn reorder_interview_qas(
    db: State<'_, Mutex<Connection>>,
    args: ReorderInterviewQAsArgs,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    for (index, qa_id) in args.ids_in_order.iter().enumerate() {
        conn.execute(
            "UPDATE interview_qas SET order_index = ?1 \
             WHERE id = ?2 AND job_target_id = ?3",
            rusqlite::params![index as i64, qa_id, args.job_target_id],
        )
        .map_err(|e| e.to_string())?;
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
