use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RecruitmentImpressionRow {
    pub id: String,
    pub job_target_id: String,
    pub selection_process_note: Option<String>,
    pub office_atmosphere: Option<String>,
    pub sensory_observations: String,
    pub lifestyle_compatibility_note: Option<String>,
    pub red_flags_note: Option<String>,
    pub overall_impression: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str = "id, job_target_id, selection_process_note, office_atmosphere, \
    sensory_observations, lifestyle_compatibility_note, red_flags_note, overall_impression, \
    created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<RecruitmentImpressionRow> {
    Ok(RecruitmentImpressionRow {
        id: row.get(0)?,
        job_target_id: row.get(1)?,
        selection_process_note: row.get(2)?,
        office_atmosphere: row.get(3)?,
        sensory_observations: row
            .get::<_, Option<String>>(4)?
            .unwrap_or_else(|| "[]".to_string()),
        lifestyle_compatibility_note: row.get(5)?,
        red_flags_note: row.get(6)?,
        overall_impression: row.get(7)?,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRecruitmentImpressionArgs {
    pub job_target_id: String,
    pub selection_process_note: Option<Option<String>>,
    pub office_atmosphere: Option<Option<String>>,
    pub sensory_observations: Option<String>,
    pub lifestyle_compatibility_note: Option<Option<String>>,
    pub red_flags_note: Option<Option<String>>,
    pub overall_impression: Option<Option<String>>,
}

#[tauri::command]
pub fn create_recruitment_impression(
    db: State<'_, Mutex<Connection>>,
    args: CreateRecruitmentImpressionArgs,
) -> Result<RecruitmentImpressionRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();

    conn.execute(
        "INSERT INTO recruitment_impressions \
         (id, job_target_id, selection_process_note, office_atmosphere, sensory_observations, \
          lifestyle_compatibility_note, red_flags_note, overall_impression, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?9)",
        rusqlite::params![
            id,
            args.job_target_id,
            args.selection_process_note.unwrap_or(None),
            args.office_atmosphere.unwrap_or(None),
            args.sensory_observations
                .unwrap_or_else(|| "[]".to_string()),
            args.lifestyle_compatibility_note.unwrap_or(None),
            args.red_flags_note.unwrap_or(None),
            args.overall_impression.unwrap_or(None),
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql =
        format!("SELECT {SELECT_COLUMNS} FROM recruitment_impressions WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_recruitment_impressions_by_job_target(
    db: State<'_, Mutex<Connection>>,
    job_target_id: String,
) -> Result<Vec<RecruitmentImpressionRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM recruitment_impressions \
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
pub fn get_recruitment_impression(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<RecruitmentImpressionRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql =
        format!("SELECT {SELECT_COLUMNS} FROM recruitment_impressions WHERE id = ?1");
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
pub struct UpdateRecruitmentImpressionArgs {
    pub selection_process_note: Option<Option<String>>,
    pub office_atmosphere: Option<Option<String>>,
    pub sensory_observations: Option<String>,
    pub lifestyle_compatibility_note: Option<Option<String>>,
    pub red_flags_note: Option<Option<String>>,
    pub overall_impression: Option<Option<String>>,
}

#[tauri::command]
pub fn update_recruitment_impression(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateRecruitmentImpressionArgs,
) -> Result<RecruitmentImpressionRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.selection_process_note {
        sets.push("selection_process_note = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.office_atmosphere {
        sets.push("office_atmosphere = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.sensory_observations {
        sets.push("sensory_observations = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.lifestyle_compatibility_note {
        sets.push("lifestyle_compatibility_note = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.red_flags_note {
        sets.push("red_flags_note = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.overall_impression {
        sets.push("overall_impression = ?".to_string());
        params.push(Box::new(v));
    }

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?".to_string());
    params.push(Box::new(now));
    params.push(Box::new(id.clone()));

    let sql = format!(
        "UPDATE recruitment_impressions SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("recruitment_impression not found: {id}"));
    }

    let select_sql =
        format!("SELECT {SELECT_COLUMNS} FROM recruitment_impressions WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_recruitment_impression(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM recruitment_impressions WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("recruitment_impression not found: {id}"));
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
