use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkillItemRow {
    pub id: String,
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct JobTargetRow {
    pub id: String,
    pub company_name: String,
    pub job_title: String,
    pub job_description: String,
    pub status: String,
    pub required_skills: Vec<SkillItemRow>,
    pub preferred_skills: Vec<SkillItemRow>,
    pub concerns: String,
    pub appeal_points: String,
    // 書籍 B 第 4 章 — 求人票分析フィールド
    pub annual_holidays: Option<i64>,
    pub working_hours_per_day: Option<f64>,
    pub commute_time_minutes: Option<i64>,
    pub employment_type: Option<String>,
    pub flex_time_available: Option<bool>,
    pub remote_work_available: Option<bool>,
    pub average_paid_leave_taken: Option<f64>,
    pub vacancy_reason: Option<String>,
    pub current_team_size: Option<i64>,
    pub wage_type: Option<String>,
    pub basic_salary: Option<i64>,
    pub fixed_overtime_hours: Option<f64>,
    pub bonus_base_months: Option<f64>,
    pub has_future_raise_promise: Option<bool>,
    pub future_raise_promise_in_contract: Option<bool>,
    // 書籍 B 第 3 章 — 応募経路
    pub application_route: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str = "id, company_name, job_title, job_description, status, \
     required_skills, preferred_skills, concerns, appeal_points, \
     annual_holidays, working_hours_per_day, commute_time_minutes, employment_type, \
     flex_time_available, remote_work_available, average_paid_leave_taken, vacancy_reason, \
     current_team_size, application_route, wage_type, basic_salary, fixed_overtime_hours, \
     bonus_base_months, has_future_raise_promise, future_raise_promise_in_contract, \
     created_at, updated_at";

fn int_to_bool(v: Option<i64>) -> Option<bool> {
    v.map(|n| n != 0)
}

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<JobTargetRow> {
    let required_json: String = row.get(5)?;
    let preferred_json: String = row.get(6)?;
    Ok(JobTargetRow {
        id: row.get(0)?,
        company_name: row.get(1)?,
        job_title: row.get(2)?,
        job_description: row.get(3)?,
        status: row.get(4)?,
        required_skills: serde_json::from_str(&required_json).unwrap_or_default(),
        preferred_skills: serde_json::from_str(&preferred_json).unwrap_or_default(),
        concerns: row.get(7)?,
        appeal_points: row.get(8)?,
        annual_holidays: row.get(9)?,
        working_hours_per_day: row.get(10)?,
        commute_time_minutes: row.get(11)?,
        employment_type: row.get(12)?,
        flex_time_available: int_to_bool(row.get(13)?),
        remote_work_available: int_to_bool(row.get(14)?),
        average_paid_leave_taken: row.get(15)?,
        vacancy_reason: row.get(16)?,
        current_team_size: row.get(17)?,
        application_route: row.get(18)?,
        wage_type: row.get(19)?,
        basic_salary: row.get(20)?,
        fixed_overtime_hours: row.get(21)?,
        bonus_base_months: row.get(22)?,
        has_future_raise_promise: int_to_bool(row.get(23)?),
        future_raise_promise_in_contract: int_to_bool(row.get(24)?),
        created_at: row.get(25)?,
        updated_at: row.get(26)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateJobTargetArgs {
    pub company_name: String,
    pub job_title: String,
    pub job_description: Option<String>,
    pub status: Option<String>,
    pub required_skills: Option<Vec<SkillItemRow>>,
    pub preferred_skills: Option<Vec<SkillItemRow>>,
    pub concerns: Option<String>,
    pub appeal_points: Option<String>,
    pub annual_holidays: Option<i64>,
    pub working_hours_per_day: Option<f64>,
    pub commute_time_minutes: Option<i64>,
    pub employment_type: Option<String>,
    pub flex_time_available: Option<bool>,
    pub remote_work_available: Option<bool>,
    pub average_paid_leave_taken: Option<f64>,
    pub vacancy_reason: Option<String>,
    pub current_team_size: Option<i64>,
    pub application_route: Option<String>,
    pub wage_type: Option<String>,
    pub basic_salary: Option<i64>,
    pub fixed_overtime_hours: Option<f64>,
    pub bonus_base_months: Option<f64>,
    pub has_future_raise_promise: Option<bool>,
    pub future_raise_promise_in_contract: Option<bool>,
}

#[tauri::command]
pub fn create_job_target(
    db: State<'_, Mutex<Connection>>,
    args: CreateJobTargetArgs,
) -> Result<JobTargetRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();
    let status = args.status.unwrap_or_else(|| "researching".to_string());
    let required = serde_json::to_string(&args.required_skills.unwrap_or_default())
        .map_err(|e| e.to_string())?;
    let preferred = serde_json::to_string(&args.preferred_skills.unwrap_or_default())
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO job_targets \
         (id, company_name, job_title, job_description, status, \
          required_skills, preferred_skills, concerns, appeal_points, \
          annual_holidays, working_hours_per_day, commute_time_minutes, employment_type, \
          flex_time_available, remote_work_available, average_paid_leave_taken, vacancy_reason, \
          current_team_size, application_route, wage_type, basic_salary, fixed_overtime_hours, \
          bonus_base_months, has_future_raise_promise, future_raise_promise_in_contract, \
          created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,\
                 ?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,?25,\
                 ?26,?26)",
        rusqlite::params![
            id,
            args.company_name,
            args.job_title,
            args.job_description.unwrap_or_default(),
            status,
            required,
            preferred,
            args.concerns.unwrap_or_default(),
            args.appeal_points.unwrap_or_default(),
            args.annual_holidays,
            args.working_hours_per_day,
            args.commute_time_minutes,
            args.employment_type,
            args.flex_time_available.map(|b| b as i64),
            args.remote_work_available.map(|b| b as i64),
            args.average_paid_leave_taken,
            args.vacancy_reason,
            args.current_team_size,
            args.application_route,
            args.wage_type,
            args.basic_salary,
            args.fixed_overtime_hours,
            args.bonus_base_months,
            args.has_future_raise_promise.map(|b| b as i64),
            args.future_raise_promise_in_contract.map(|b| b as i64),
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM job_targets WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_job_targets(
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<JobTargetRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM job_targets ORDER BY created_at DESC, id DESC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_job_target(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<JobTargetRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM job_targets WHERE id = ?1");
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
pub struct UpdateJobTargetArgs {
    pub company_name: Option<String>,
    pub job_title: Option<String>,
    pub job_description: Option<String>,
    pub status: Option<String>,
    pub required_skills: Option<Vec<SkillItemRow>>,
    pub preferred_skills: Option<Vec<SkillItemRow>>,
    pub concerns: Option<String>,
    pub appeal_points: Option<String>,
    pub annual_holidays: Option<Option<i64>>,
    pub working_hours_per_day: Option<Option<f64>>,
    pub commute_time_minutes: Option<Option<i64>>,
    pub employment_type: Option<Option<String>>,
    pub flex_time_available: Option<Option<bool>>,
    pub remote_work_available: Option<Option<bool>>,
    pub average_paid_leave_taken: Option<Option<f64>>,
    pub vacancy_reason: Option<Option<String>>,
    pub current_team_size: Option<Option<i64>>,
    pub application_route: Option<Option<String>>,
    pub wage_type: Option<Option<String>>,
    pub basic_salary: Option<Option<i64>>,
    pub fixed_overtime_hours: Option<Option<f64>>,
    pub bonus_base_months: Option<Option<f64>>,
    pub has_future_raise_promise: Option<Option<bool>>,
    pub future_raise_promise_in_contract: Option<Option<bool>>,
}

#[tauri::command]
pub fn update_job_target(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateJobTargetArgs,
) -> Result<JobTargetRow, String> {
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
    macro_rules! push_nullable {
        ($field:expr, $col:literal) => {
            if let Some(v) = $field {
                sets.push(concat!($col, " = ?"));
                params.push(Box::new(v));
            }
        };
    }
    macro_rules! push_nullable_bool {
        ($field:expr, $col:literal) => {
            if let Some(v) = $field {
                sets.push(concat!($col, " = ?"));
                params.push(Box::new(v.map(|b| b as i64)));
            }
        };
    }

    push_str!(patch.company_name, "company_name");
    push_str!(patch.job_title, "job_title");
    push_str!(patch.job_description, "job_description");
    push_str!(patch.status, "status");
    push_str!(patch.concerns, "concerns");
    push_str!(patch.appeal_points, "appeal_points");

    if let Some(v) = patch.required_skills {
        sets.push("required_skills = ?");
        params.push(Box::new(
            serde_json::to_string(&v).map_err(|e| e.to_string())?,
        ));
    }
    if let Some(v) = patch.preferred_skills {
        sets.push("preferred_skills = ?");
        params.push(Box::new(
            serde_json::to_string(&v).map_err(|e| e.to_string())?,
        ));
    }

    push_nullable!(patch.annual_holidays, "annual_holidays");
    push_nullable!(patch.working_hours_per_day, "working_hours_per_day");
    push_nullable!(patch.commute_time_minutes, "commute_time_minutes");
    push_nullable!(patch.employment_type, "employment_type");
    push_nullable_bool!(patch.flex_time_available, "flex_time_available");
    push_nullable_bool!(patch.remote_work_available, "remote_work_available");
    push_nullable!(patch.average_paid_leave_taken, "average_paid_leave_taken");
    push_nullable!(patch.vacancy_reason, "vacancy_reason");
    push_nullable!(patch.current_team_size, "current_team_size");
    push_nullable!(patch.application_route, "application_route");
    push_nullable!(patch.wage_type, "wage_type");
    push_nullable!(patch.basic_salary, "basic_salary");
    push_nullable!(patch.fixed_overtime_hours, "fixed_overtime_hours");
    push_nullable!(patch.bonus_base_months, "bonus_base_months");
    push_nullable_bool!(patch.has_future_raise_promise, "has_future_raise_promise");
    push_nullable_bool!(
        patch.future_raise_promise_in_contract,
        "future_raise_promise_in_contract"
    );

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?");
    params.push(Box::new(now.clone()));

    let sql = format!("UPDATE job_targets SET {} WHERE id = ?", sets.join(", "));
    params.push(Box::new(id.clone()));

    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("job target not found: {id}"));
    }

    let select_sql = format!("SELECT {SELECT_COLUMNS} FROM job_targets WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_job_target(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM job_targets WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("job target not found: {id}"));
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
