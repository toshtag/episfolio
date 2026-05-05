use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LifeTimelineEntryRow {
    pub id: String,
    pub age_range_start: i64,
    pub age_range_end: i64,
    pub year_start: Option<i64>,
    pub year_end: Option<i64>,
    pub category: String,
    pub summary: String,
    pub detail: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<LifeTimelineEntryRow> {
    let tags_json: String = row.get(8)?;
    Ok(LifeTimelineEntryRow {
        id: row.get(0)?,
        age_range_start: row.get(1)?,
        age_range_end: row.get(2)?,
        year_start: row.get(3)?,
        year_end: row.get(4)?,
        category: row.get(5)?,
        summary: row.get(6)?,
        detail: row.get(7)?,
        tags: super::parse_json_column(8, &tags_json)?,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
    })
}

const SELECT_COLUMNS: &str =
    "id, age_range_start, age_range_end, year_start, year_end, category, \
     summary, detail, tags, created_at, updated_at";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLifeTimelineEntryArgs {
    pub age_range_start: i64,
    pub age_range_end: i64,
    pub year_start: Option<i64>,
    pub year_end: Option<i64>,
    pub category: String,
    pub summary: String,
    pub detail: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[tauri::command]
pub fn create_life_timeline_entry(
    db: State<'_, Mutex<Connection>>,
    args: CreateLifeTimelineEntryArgs,
) -> Result<LifeTimelineEntryRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();
    let detail = args.detail.unwrap_or_default();
    let tags =
        serde_json::to_string(&args.tags.unwrap_or_default()).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO life_timeline_entries \
         (id, age_range_start, age_range_end, year_start, year_end, category, \
          summary, detail, tags, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
        rusqlite::params![
            id,
            args.age_range_start,
            args.age_range_end,
            args.year_start,
            args.year_end,
            args.category,
            args.summary,
            detail,
            tags,
            now,
            now
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM life_timeline_entries WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_life_timeline_entries(
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<LifeTimelineEntryRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM life_timeline_entries ORDER BY age_range_start ASC, created_at ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_life_timeline_entry(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<LifeTimelineEntryRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM life_timeline_entries WHERE id = ?1");
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
pub struct UpdateLifeTimelineEntryArgs {
    pub age_range_start: Option<i64>,
    pub age_range_end: Option<i64>,
    pub year_start: Option<i64>,
    pub year_end: Option<i64>,
    pub category: Option<String>,
    pub summary: Option<String>,
    pub detail: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[tauri::command]
pub fn update_life_timeline_entry(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateLifeTimelineEntryArgs,
) -> Result<LifeTimelineEntryRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<&str> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    macro_rules! push_i64 {
        ($field:expr, $col:literal) => {
            if let Some(v) = $field {
                sets.push(concat!($col, " = ?"));
                params.push(Box::new(v));
            }
        };
    }
    macro_rules! push_str {
        ($field:expr, $col:literal) => {
            if let Some(v) = $field {
                sets.push(concat!($col, " = ?"));
                params.push(Box::new(v));
            }
        };
    }

    push_i64!(patch.age_range_start, "age_range_start");
    push_i64!(patch.age_range_end, "age_range_end");
    if patch.year_start.is_some() || patch.year_end.is_some() {
        if let Some(v) = patch.year_start {
            sets.push("year_start = ?");
            params.push(Box::new(v));
        }
        if let Some(v) = patch.year_end {
            sets.push("year_end = ?");
            params.push(Box::new(v));
        }
    }
    push_str!(patch.category, "category");
    push_str!(patch.summary, "summary");
    push_str!(patch.detail, "detail");

    if let Some(v) = patch.tags {
        sets.push("tags = ?");
        params.push(Box::new(
            serde_json::to_string(&v).map_err(|e| e.to_string())?,
        ));
    }

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?");
    params.push(Box::new(now.clone()));

    let sql = format!(
        "UPDATE life_timeline_entries SET {} WHERE id = ?",
        sets.join(", ")
    );
    params.push(Box::new(id.clone()));

    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("life timeline entry not found: {id}"));
    }

    let select_sql =
        format!("SELECT {SELECT_COLUMNS} FROM life_timeline_entries WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_life_timeline_entry(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM life_timeline_entries WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("life timeline entry not found: {id}"));
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
