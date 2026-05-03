use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SalaryBenchmarkRow {
    pub id: String,
    pub job_target_id: String,
    pub average_salary_at_company: Option<i64>,
    pub expected_salary_range_min: Option<i64>,
    pub expected_salary_range_max: Option<i64>,
    pub personal_salary_benchmark: Option<i64>,
    pub is_mismatched_company: bool,
    pub data_source: Option<String>,
    pub note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str = "id, job_target_id, average_salary_at_company, \
    expected_salary_range_min, expected_salary_range_max, personal_salary_benchmark, \
    is_mismatched_company, data_source, note, created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<SalaryBenchmarkRow> {
    Ok(SalaryBenchmarkRow {
        id: row.get(0)?,
        job_target_id: row.get(1)?,
        average_salary_at_company: row.get(2)?,
        expected_salary_range_min: row.get(3)?,
        expected_salary_range_max: row.get(4)?,
        personal_salary_benchmark: row.get(5)?,
        is_mismatched_company: row.get::<_, i64>(6).map(|v| v != 0).unwrap_or(false),
        data_source: row.get(7)?,
        note: row.get(8)?,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSalaryBenchmarkArgs {
    pub job_target_id: String,
    pub average_salary_at_company: Option<Option<i64>>,
    pub expected_salary_range_min: Option<Option<i64>>,
    pub expected_salary_range_max: Option<Option<i64>>,
    pub personal_salary_benchmark: Option<Option<i64>>,
    pub is_mismatched_company: Option<bool>,
    pub data_source: Option<Option<String>>,
    pub note: Option<Option<String>>,
}

#[tauri::command]
pub fn create_salary_benchmark(
    db: State<'_, Mutex<Connection>>,
    args: CreateSalaryBenchmarkArgs,
) -> Result<SalaryBenchmarkRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();
    let is_mismatched = args.is_mismatched_company.unwrap_or(false) as i64;

    conn.execute(
        "INSERT INTO salary_benchmarks \
         (id, job_target_id, average_salary_at_company, expected_salary_range_min, \
          expected_salary_range_max, personal_salary_benchmark, is_mismatched_company, \
          data_source, note, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?10)",
        rusqlite::params![
            id,
            args.job_target_id,
            args.average_salary_at_company.unwrap_or(None),
            args.expected_salary_range_min.unwrap_or(None),
            args.expected_salary_range_max.unwrap_or(None),
            args.personal_salary_benchmark.unwrap_or(None),
            is_mismatched,
            args.data_source.unwrap_or(None),
            args.note.unwrap_or(None),
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM salary_benchmarks WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_salary_benchmarks_by_job_target(
    db: State<'_, Mutex<Connection>>,
    job_target_id: String,
) -> Result<Vec<SalaryBenchmarkRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM salary_benchmarks \
         WHERE job_target_id = ?1 ORDER BY created_at DESC, id DESC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(rusqlite::params![job_target_id], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_salary_benchmark(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<SalaryBenchmarkRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM salary_benchmarks WHERE id = ?1");
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
pub struct UpdateSalaryBenchmarkArgs {
    pub average_salary_at_company: Option<Option<i64>>,
    pub expected_salary_range_min: Option<Option<i64>>,
    pub expected_salary_range_max: Option<Option<i64>>,
    pub personal_salary_benchmark: Option<Option<i64>>,
    pub is_mismatched_company: Option<bool>,
    pub data_source: Option<Option<String>>,
    pub note: Option<Option<String>>,
}

#[tauri::command]
pub fn update_salary_benchmark(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateSalaryBenchmarkArgs,
) -> Result<SalaryBenchmarkRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.average_salary_at_company {
        sets.push("average_salary_at_company = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.expected_salary_range_min {
        sets.push("expected_salary_range_min = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.expected_salary_range_max {
        sets.push("expected_salary_range_max = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.personal_salary_benchmark {
        sets.push("personal_salary_benchmark = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.is_mismatched_company {
        sets.push("is_mismatched_company = ?".to_string());
        params.push(Box::new(v as i64));
    }
    if let Some(v) = patch.data_source {
        sets.push("data_source = ?".to_string());
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
        "UPDATE salary_benchmarks SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("salary_benchmark not found: {id}"));
    }

    let select_sql = format!("SELECT {SELECT_COLUMNS} FROM salary_benchmarks WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_salary_benchmark(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM salary_benchmarks WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("salary_benchmark not found: {id}"));
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
