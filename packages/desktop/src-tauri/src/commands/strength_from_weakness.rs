use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StrengthFromWeaknessRow {
    pub id: String,
    pub weakness_label: String,
    pub blank_type: Option<String>,
    pub background: String,
    pub reframe: String,
    pub target_company_profile: String,
    pub note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str =
    "id, weakness_label, blank_type, background, reframe, target_company_profile, note, created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<StrengthFromWeaknessRow> {
    Ok(StrengthFromWeaknessRow {
        id: row.get(0)?,
        weakness_label: row.get(1)?,
        blank_type: row.get(2)?,
        background: row.get(3)?,
        reframe: row.get(4)?,
        target_company_profile: row.get(5)?,
        note: row.get(6)?,
        created_at: row.get(7)?,
        updated_at: row.get(8)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateStrengthFromWeaknessArgs {
    pub weakness_label: Option<String>,
    pub blank_type: Option<String>,
    pub background: Option<String>,
    pub reframe: Option<String>,
    pub target_company_profile: Option<String>,
    pub note: Option<Option<String>>,
}

#[tauri::command]
pub fn create_strength_from_weakness(
    db: State<'_, Mutex<Connection>>,
    args: CreateStrengthFromWeaknessArgs,
) -> Result<StrengthFromWeaknessRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();

    conn.execute(
        "INSERT INTO strength_from_weakness \
         (id, weakness_label, blank_type, background, reframe, target_company_profile, note, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?8)",
        rusqlite::params![
            id,
            args.weakness_label.unwrap_or_default(),
            args.blank_type,
            args.background.unwrap_or_default(),
            args.reframe.unwrap_or_default(),
            args.target_company_profile.unwrap_or_default(),
            args.note.unwrap_or(None),
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM strength_from_weakness WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_strength_from_weakness(
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<StrengthFromWeaknessRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM strength_from_weakness ORDER BY created_at ASC, id ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_strength_from_weakness(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<StrengthFromWeaknessRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql =
        format!("SELECT {SELECT_COLUMNS} FROM strength_from_weakness WHERE id = ?1");
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
pub struct UpdateStrengthFromWeaknessArgs {
    pub weakness_label: Option<String>,
    pub blank_type: Option<Option<String>>,
    pub background: Option<String>,
    pub reframe: Option<String>,
    pub target_company_profile: Option<String>,
    pub note: Option<Option<String>>,
}

#[tauri::command]
pub fn update_strength_from_weakness(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateStrengthFromWeaknessArgs,
) -> Result<StrengthFromWeaknessRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.weakness_label {
        sets.push("weakness_label = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.blank_type {
        sets.push("blank_type = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.background {
        sets.push("background = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.reframe {
        sets.push("reframe = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.target_company_profile {
        sets.push("target_company_profile = ?".to_string());
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
        "UPDATE strength_from_weakness SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("strength_from_weakness not found: {id}"));
    }

    let select_sql =
        format!("SELECT {SELECT_COLUMNS} FROM strength_from_weakness WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_strength_from_weakness(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM strength_from_weakness WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("strength_from_weakness not found: {id}"));
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
