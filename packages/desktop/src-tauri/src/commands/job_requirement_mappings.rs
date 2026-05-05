use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct JobRequirementMappingRow {
    pub id: String,
    pub job_target_id: String,
    pub requirement_skill_id: String,
    pub episode_ids: Vec<String>,
    pub user_note: String,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str =
    "id, job_target_id, requirement_skill_id, episode_ids, user_note, created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<JobRequirementMappingRow> {
    let episode_ids_json: String = row.get(3)?;
    Ok(JobRequirementMappingRow {
        id: row.get(0)?,
        job_target_id: row.get(1)?,
        requirement_skill_id: row.get(2)?,
        episode_ids: super::parse_json_column(3, &episode_ids_json)?,
        user_note: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveJobRequirementMappingArgs {
    pub job_target_id: String,
    pub requirement_skill_id: String,
    pub episode_ids: Option<Vec<String>>,
    pub user_note: Option<String>,
}

/// 同じ (job_target_id, requirement_skill_id) ペアが既に存在すれば update、
/// なければ insert する upsert。職務経歴ダイジェストのワークフローでは要件 1 行に対して
/// マッピングは 0 か 1 つしか持たないため、UI から見たときに「要件カードを保存」
/// が常に同じ row に書き込めるようにする。
#[tauri::command]
pub fn save_job_requirement_mapping(
    db: State<'_, Mutex<Connection>>,
    args: SaveJobRequirementMappingArgs,
) -> Result<JobRequirementMappingRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();
    let episode_ids_json = serde_json::to_string(&args.episode_ids.unwrap_or_default())
        .map_err(|e| e.to_string())?;
    let user_note = args.user_note.unwrap_or_default();

    let existing: Option<String> = conn
        .query_row(
            "SELECT id FROM job_requirement_mappings \
             WHERE job_target_id = ?1 AND requirement_skill_id = ?2",
            rusqlite::params![args.job_target_id, args.requirement_skill_id],
            |r| r.get(0),
        )
        .ok();

    let id = match existing {
        Some(id) => {
            conn.execute(
                "UPDATE job_requirement_mappings \
                 SET episode_ids = ?1, user_note = ?2, updated_at = ?3 \
                 WHERE id = ?4",
                rusqlite::params![episode_ids_json, user_note, now, id],
            )
            .map_err(|e| e.to_string())?;
            id
        }
        None => {
            let id = Ulid::new().to_string();
            conn.execute(
                "INSERT INTO job_requirement_mappings \
                 (id, job_target_id, requirement_skill_id, episode_ids, user_note, created_at, updated_at) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)",
                rusqlite::params![
                    id,
                    args.job_target_id,
                    args.requirement_skill_id,
                    episode_ids_json,
                    user_note,
                    now,
                ],
            )
            .map_err(|e| e.to_string())?;
            id
        }
    };

    let sql = format!("SELECT {SELECT_COLUMNS} FROM job_requirement_mappings WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_job_requirement_mappings_by_job_target(
    db: State<'_, Mutex<Connection>>,
    job_target_id: String,
) -> Result<Vec<JobRequirementMappingRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM job_requirement_mappings \
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
pub fn get_job_requirement_mapping(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<JobRequirementMappingRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM job_requirement_mappings WHERE id = ?1");
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
pub struct UpdateJobRequirementMappingArgs {
    pub episode_ids: Option<Vec<String>>,
    pub user_note: Option<String>,
}

#[tauri::command]
pub fn update_job_requirement_mapping(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateJobRequirementMappingArgs,
) -> Result<JobRequirementMappingRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<&str> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.episode_ids {
        sets.push("episode_ids = ?");
        params.push(Box::new(
            serde_json::to_string(&v).map_err(|e| e.to_string())?,
        ));
    }
    if let Some(v) = patch.user_note {
        sets.push("user_note = ?");
        params.push(Box::new(v));
    }

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?");
    params.push(Box::new(now.clone()));

    let sql = format!(
        "UPDATE job_requirement_mappings SET {} WHERE id = ?",
        sets.join(", ")
    );
    params.push(Box::new(id.clone()));

    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("job requirement mapping not found: {id}"));
    }

    let select_sql =
        format!("SELECT {SELECT_COLUMNS} FROM job_requirement_mappings WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_job_requirement_mapping(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM job_requirement_mappings WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("job requirement mapping not found: {id}"));
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
