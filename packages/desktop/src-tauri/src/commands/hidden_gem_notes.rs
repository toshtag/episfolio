use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HiddenGemNoteRow {
    pub id: String,
    pub job_target_id: String,
    pub is_gnt_listed: bool,
    pub niche_keywords: Option<String>,
    pub has_anti_monster_mechanism: bool,
    pub mechanism_note: Option<String>,
    pub is_hiring_on_job_sites: bool,
    pub direct_contact_note: Option<String>,
    pub note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str = "id, job_target_id, is_gnt_listed, niche_keywords, \
    has_anti_monster_mechanism, mechanism_note, is_hiring_on_job_sites, \
    direct_contact_note, note, created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<HiddenGemNoteRow> {
    Ok(HiddenGemNoteRow {
        id: row.get(0)?,
        job_target_id: row.get(1)?,
        is_gnt_listed: row.get::<_, i64>(2).map(|v| v != 0).unwrap_or(false),
        niche_keywords: row.get(3)?,
        has_anti_monster_mechanism: row.get::<_, i64>(4).map(|v| v != 0).unwrap_or(false),
        mechanism_note: row.get(5)?,
        is_hiring_on_job_sites: row.get::<_, i64>(6).map(|v| v != 0).unwrap_or(false),
        direct_contact_note: row.get(7)?,
        note: row.get(8)?,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateHiddenGemNoteArgs {
    pub job_target_id: String,
    pub is_gnt_listed: Option<bool>,
    pub niche_keywords: Option<Option<String>>,
    pub has_anti_monster_mechanism: Option<bool>,
    pub mechanism_note: Option<Option<String>>,
    pub is_hiring_on_job_sites: Option<bool>,
    pub direct_contact_note: Option<Option<String>>,
    pub note: Option<Option<String>>,
}

#[tauri::command]
pub fn create_hidden_gem_note(
    db: State<'_, Mutex<Connection>>,
    args: CreateHiddenGemNoteArgs,
) -> Result<HiddenGemNoteRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();
    let is_gnt = args.is_gnt_listed.unwrap_or(false) as i64;
    let has_mechanism = args.has_anti_monster_mechanism.unwrap_or(false) as i64;
    let is_hiring = args.is_hiring_on_job_sites.unwrap_or(false) as i64;

    conn.execute(
        "INSERT INTO hidden_gem_notes \
         (id, job_target_id, is_gnt_listed, niche_keywords, has_anti_monster_mechanism, \
          mechanism_note, is_hiring_on_job_sites, direct_contact_note, note, \
          created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?10)",
        rusqlite::params![
            id,
            args.job_target_id,
            is_gnt,
            args.niche_keywords.unwrap_or(None),
            has_mechanism,
            args.mechanism_note.unwrap_or(None),
            is_hiring,
            args.direct_contact_note.unwrap_or(None),
            args.note.unwrap_or(None),
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM hidden_gem_notes WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_hidden_gem_notes_by_job_target(
    db: State<'_, Mutex<Connection>>,
    job_target_id: String,
) -> Result<Vec<HiddenGemNoteRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM hidden_gem_notes \
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
pub fn get_hidden_gem_note(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<HiddenGemNoteRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM hidden_gem_notes WHERE id = ?1");
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
pub struct UpdateHiddenGemNoteArgs {
    pub is_gnt_listed: Option<bool>,
    pub niche_keywords: Option<Option<String>>,
    pub has_anti_monster_mechanism: Option<bool>,
    pub mechanism_note: Option<Option<String>>,
    pub is_hiring_on_job_sites: Option<bool>,
    pub direct_contact_note: Option<Option<String>>,
    pub note: Option<Option<String>>,
}

#[tauri::command]
pub fn update_hidden_gem_note(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateHiddenGemNoteArgs,
) -> Result<HiddenGemNoteRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.is_gnt_listed {
        sets.push("is_gnt_listed = ?".to_string());
        params.push(Box::new(v as i64));
    }
    if let Some(v) = patch.niche_keywords {
        sets.push("niche_keywords = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.has_anti_monster_mechanism {
        sets.push("has_anti_monster_mechanism = ?".to_string());
        params.push(Box::new(v as i64));
    }
    if let Some(v) = patch.mechanism_note {
        sets.push("mechanism_note = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.is_hiring_on_job_sites {
        sets.push("is_hiring_on_job_sites = ?".to_string());
        params.push(Box::new(v as i64));
    }
    if let Some(v) = patch.direct_contact_note {
        sets.push("direct_contact_note = ?".to_string());
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
        "UPDATE hidden_gem_notes SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("hidden_gem_note not found: {id}"));
    }

    let select_sql = format!("SELECT {SELECT_COLUMNS} FROM hidden_gem_notes WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_hidden_gem_note(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM hidden_gem_notes WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("hidden_gem_note not found: {id}"));
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
