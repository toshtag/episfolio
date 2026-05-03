use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MonsterCompanyCheckRow {
    pub id: String,
    pub job_target_id: String,
    pub mhlw_case_url: Option<String>,
    pub violation_law: Option<String>,
    pub case_summary: Option<String>,
    pub case_publication_date: Option<String>,
    pub resignation_entries: String,
    pub hidden_monster_note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str = "id, job_target_id, mhlw_case_url, violation_law, \
    case_summary, case_publication_date, resignation_entries, hidden_monster_note, \
    created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<MonsterCompanyCheckRow> {
    Ok(MonsterCompanyCheckRow {
        id: row.get(0)?,
        job_target_id: row.get(1)?,
        mhlw_case_url: row.get(2)?,
        violation_law: row.get(3)?,
        case_summary: row.get(4)?,
        case_publication_date: row.get(5)?,
        resignation_entries: row.get::<_, Option<String>>(6)?.unwrap_or_else(|| "[]".to_string()),
        hidden_monster_note: row.get(7)?,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMonsterCompanyCheckArgs {
    pub job_target_id: String,
    pub mhlw_case_url: Option<Option<String>>,
    pub violation_law: Option<Option<String>>,
    pub case_summary: Option<Option<String>>,
    pub case_publication_date: Option<Option<String>>,
    pub resignation_entries: Option<String>,
    pub hidden_monster_note: Option<Option<String>>,
}

#[tauri::command]
pub fn create_monster_company_check(
    db: State<'_, Mutex<Connection>>,
    args: CreateMonsterCompanyCheckArgs,
) -> Result<MonsterCompanyCheckRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();

    conn.execute(
        "INSERT INTO monster_company_checks \
         (id, job_target_id, mhlw_case_url, violation_law, case_summary, \
          case_publication_date, resignation_entries, hidden_monster_note, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?9)",
        rusqlite::params![
            id,
            args.job_target_id,
            args.mhlw_case_url.unwrap_or(None),
            args.violation_law.unwrap_or(None),
            args.case_summary.unwrap_or(None),
            args.case_publication_date.unwrap_or(None),
            args.resignation_entries.unwrap_or_else(|| "[]".to_string()),
            args.hidden_monster_note.unwrap_or(None),
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM monster_company_checks WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_monster_company_checks_by_job_target(
    db: State<'_, Mutex<Connection>>,
    job_target_id: String,
) -> Result<Vec<MonsterCompanyCheckRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM monster_company_checks \
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
pub fn get_monster_company_check(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<MonsterCompanyCheckRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM monster_company_checks WHERE id = ?1");
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
pub struct UpdateMonsterCompanyCheckArgs {
    pub mhlw_case_url: Option<Option<String>>,
    pub violation_law: Option<Option<String>>,
    pub case_summary: Option<Option<String>>,
    pub case_publication_date: Option<Option<String>>,
    pub resignation_entries: Option<String>,
    pub hidden_monster_note: Option<Option<String>>,
}

#[tauri::command]
pub fn update_monster_company_check(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateMonsterCompanyCheckArgs,
) -> Result<MonsterCompanyCheckRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.mhlw_case_url {
        sets.push("mhlw_case_url = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.violation_law {
        sets.push("violation_law = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.case_summary {
        sets.push("case_summary = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.case_publication_date {
        sets.push("case_publication_date = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.resignation_entries {
        sets.push("resignation_entries = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.hidden_monster_note {
        sets.push("hidden_monster_note = ?".to_string());
        params.push(Box::new(v));
    }

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?".to_string());
    params.push(Box::new(now));
    params.push(Box::new(id.clone()));

    let sql = format!(
        "UPDATE monster_company_checks SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("monster_company_check not found: {id}"));
    }

    let select_sql =
        format!("SELECT {SELECT_COLUMNS} FROM monster_company_checks WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_monster_company_check(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM monster_company_checks WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("monster_company_check not found: {id}"));
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
