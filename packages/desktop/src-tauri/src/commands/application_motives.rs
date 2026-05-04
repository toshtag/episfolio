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
    pub motive_style: String,
    // shared
    pub formatted_text: String,
    pub created_at: String,
    pub updated_at: String,
    // standard fields
    pub company_future: String,
    pub contribution_action: String,
    pub leveraged_experience: String,
    pub info_source_type: Option<String>,
    pub info_source_url: String,
    pub target_department: String,
    pub department_challenge: String,
    // iron fields
    pub positive_influence: String,
    pub before_after_fact: String,
    pub self_identification: Option<String>,
    pub provider_switch_moment: String,
    pub value_analysis_type: Option<String>,
    pub value_analysis_detail: String,
    pub post_join_action_plan: String,
}

const SELECT_COLUMNS: &str =
    "id, job_target_id, motive_style, formatted_text, created_at, updated_at, \
     company_future, contribution_action, leveraged_experience, \
     info_source_type, info_source_url, target_department, department_challenge, \
     positive_influence, before_after_fact, self_identification, \
     provider_switch_moment, value_analysis_type, value_analysis_detail, post_join_action_plan";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<ApplicationMotiveRow> {
    Ok(ApplicationMotiveRow {
        id: row.get(0)?,
        job_target_id: row.get(1)?,
        motive_style: row.get(2)?,
        formatted_text: row.get(3)?,
        created_at: row.get(4)?,
        updated_at: row.get(5)?,
        company_future: row.get(6)?,
        contribution_action: row.get(7)?,
        leveraged_experience: row.get(8)?,
        info_source_type: row.get(9)?,
        info_source_url: row.get(10)?,
        target_department: row.get(11)?,
        department_challenge: row.get(12)?,
        positive_influence: row.get(13)?,
        before_after_fact: row.get(14)?,
        self_identification: row.get(15)?,
        provider_switch_moment: row.get(16)?,
        value_analysis_type: row.get(17)?,
        value_analysis_detail: row.get(18)?,
        post_join_action_plan: row.get(19)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateApplicationMotiveArgs {
    pub job_target_id: String,
    pub motive_style: Option<String>,
    pub formatted_text: Option<String>,
    // standard
    pub company_future: Option<String>,
    pub contribution_action: Option<String>,
    pub leveraged_experience: Option<String>,
    pub info_source_type: Option<String>,
    pub info_source_url: Option<String>,
    pub target_department: Option<String>,
    pub department_challenge: Option<String>,
    // iron
    pub positive_influence: Option<String>,
    pub before_after_fact: Option<String>,
    pub self_identification: Option<String>,
    pub provider_switch_moment: Option<String>,
    pub value_analysis_type: Option<String>,
    pub value_analysis_detail: Option<String>,
    pub post_join_action_plan: Option<String>,
}

#[tauri::command]
pub fn create_application_motive(
    db: State<'_, Mutex<Connection>>,
    args: CreateApplicationMotiveArgs,
) -> Result<ApplicationMotiveRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();
    let style = args.motive_style.unwrap_or_else(|| "standard".to_string());

    conn.execute(
        "INSERT INTO application_motives \
         (id, job_target_id, motive_style, formatted_text, created_at, updated_at, \
          company_future, contribution_action, leveraged_experience, \
          info_source_type, info_source_url, target_department, department_challenge, \
          positive_influence, before_after_fact, self_identification, \
          provider_switch_moment, value_analysis_type, value_analysis_detail, post_join_action_plan) \
         VALUES (?1,?2,?3,?4,?5,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19)",
        rusqlite::params![
            id,
            args.job_target_id,
            style,
            args.formatted_text.unwrap_or_default(),
            now,
            args.company_future.unwrap_or_default(),
            args.contribution_action.unwrap_or_default(),
            args.leveraged_experience.unwrap_or_default(),
            args.info_source_type,
            args.info_source_url.unwrap_or_default(),
            args.target_department.unwrap_or_default(),
            args.department_challenge.unwrap_or_default(),
            args.positive_influence.unwrap_or_default(),
            args.before_after_fact.unwrap_or_default(),
            args.self_identification,
            args.provider_switch_moment.unwrap_or_default(),
            args.value_analysis_type,
            args.value_analysis_detail.unwrap_or_default(),
            args.post_join_action_plan.unwrap_or_default(),
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
    pub motive_style: Option<String>,
    pub formatted_text: Option<String>,
    // standard
    pub company_future: Option<String>,
    pub contribution_action: Option<String>,
    pub leveraged_experience: Option<String>,
    pub info_source_type: Option<Option<String>>,
    pub info_source_url: Option<String>,
    pub target_department: Option<String>,
    pub department_challenge: Option<String>,
    // iron
    pub positive_influence: Option<String>,
    pub before_after_fact: Option<String>,
    pub self_identification: Option<Option<String>>,
    pub provider_switch_moment: Option<String>,
    pub value_analysis_type: Option<Option<String>>,
    pub value_analysis_detail: Option<String>,
    pub post_join_action_plan: Option<String>,
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

    macro_rules! add_field {
        ($field:expr, $col:expr) => {
            if let Some(v) = $field {
                sets.push(format!("{} = ?", $col));
                params.push(Box::new(v));
            }
        };
    }

    add_field!(patch.motive_style, "motive_style");
    add_field!(patch.formatted_text, "formatted_text");
    add_field!(patch.company_future, "company_future");
    add_field!(patch.contribution_action, "contribution_action");
    add_field!(patch.leveraged_experience, "leveraged_experience");
    if let Some(v) = patch.info_source_type {
        sets.push("info_source_type = ?".to_string());
        params.push(Box::new(v));
    }
    add_field!(patch.info_source_url, "info_source_url");
    add_field!(patch.target_department, "target_department");
    add_field!(patch.department_challenge, "department_challenge");
    add_field!(patch.positive_influence, "positive_influence");
    add_field!(patch.before_after_fact, "before_after_fact");
    if let Some(v) = patch.self_identification {
        sets.push("self_identification = ?".to_string());
        params.push(Box::new(v));
    }
    add_field!(patch.provider_switch_moment, "provider_switch_moment");
    if let Some(v) = patch.value_analysis_type {
        sets.push("value_analysis_type = ?".to_string());
        params.push(Box::new(v));
    }
    add_field!(patch.value_analysis_detail, "value_analysis_detail");
    add_field!(patch.post_join_action_plan, "post_join_action_plan");

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
