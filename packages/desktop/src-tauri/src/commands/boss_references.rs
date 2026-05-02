use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BossReferenceRow {
    pub id: String,
    pub boss_name: Option<String>,
    pub company_name: String,
    pub period: String,
    pub axis_logic_vs_emotion: i64,
    pub axis_result_vs_process: i64,
    pub axis_solo_vs_team: i64,
    pub axis_future_vs_tradition: i64,
    pub axis_shares_private: i64,
    pub axis_teaching_skill: i64,
    pub axis_listening: i64,
    pub axis_busyness: i64,
    pub q1: Option<String>,
    pub q2: Option<String>,
    pub q3: Option<String>,
    pub q4: Option<String>,
    pub q5: Option<String>,
    pub q6: Option<String>,
    pub q7: Option<String>,
    pub q8: Option<String>,
    pub q9: Option<String>,
    pub q10: Option<String>,
    pub q11: Option<String>,
    pub strength_episode: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str =
    "id, boss_name, company_name, period, \
     axis_logic_vs_emotion, axis_result_vs_process, axis_solo_vs_team, \
     axis_future_vs_tradition, axis_shares_private, axis_teaching_skill, \
     axis_listening, axis_busyness, \
     q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, strength_episode, \
     created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<BossReferenceRow> {
    Ok(BossReferenceRow {
        id: row.get(0)?,
        boss_name: row.get(1)?,
        company_name: row.get(2)?,
        period: row.get(3)?,
        axis_logic_vs_emotion: row.get(4)?,
        axis_result_vs_process: row.get(5)?,
        axis_solo_vs_team: row.get(6)?,
        axis_future_vs_tradition: row.get(7)?,
        axis_shares_private: row.get(8)?,
        axis_teaching_skill: row.get(9)?,
        axis_listening: row.get(10)?,
        axis_busyness: row.get(11)?,
        q1: row.get(12)?,
        q2: row.get(13)?,
        q3: row.get(14)?,
        q4: row.get(15)?,
        q5: row.get(16)?,
        q6: row.get(17)?,
        q7: row.get(18)?,
        q8: row.get(19)?,
        q9: row.get(20)?,
        q10: row.get(21)?,
        q11: row.get(22)?,
        strength_episode: row.get(23)?,
        created_at: row.get(24)?,
        updated_at: row.get(25)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBossReferenceArgs {
    pub boss_name: Option<String>,
    pub company_name: Option<String>,
    pub period: Option<String>,
    pub axis_logic_vs_emotion: Option<i64>,
    pub axis_result_vs_process: Option<i64>,
    pub axis_solo_vs_team: Option<i64>,
    pub axis_future_vs_tradition: Option<i64>,
    pub axis_shares_private: Option<i64>,
    pub axis_teaching_skill: Option<i64>,
    pub axis_listening: Option<i64>,
    pub axis_busyness: Option<i64>,
    pub q1: Option<String>,
    pub q2: Option<String>,
    pub q3: Option<String>,
    pub q4: Option<String>,
    pub q5: Option<String>,
    pub q6: Option<String>,
    pub q7: Option<String>,
    pub q8: Option<String>,
    pub q9: Option<String>,
    pub q10: Option<String>,
    pub q11: Option<String>,
    pub strength_episode: Option<String>,
}

#[tauri::command]
pub fn create_boss_reference(
    db: State<'_, Mutex<Connection>>,
    args: CreateBossReferenceArgs,
) -> Result<BossReferenceRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();

    conn.execute(
        "INSERT INTO boss_references \
         (id, boss_name, company_name, period, \
          axis_logic_vs_emotion, axis_result_vs_process, axis_solo_vs_team, \
          axis_future_vs_tradition, axis_shares_private, axis_teaching_skill, \
          axis_listening, axis_busyness, \
          q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, strength_episode, \
          created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,?25,?25)",
        rusqlite::params![
            id,
            args.boss_name,
            args.company_name.unwrap_or_default(),
            args.period.unwrap_or_default(),
            args.axis_logic_vs_emotion.unwrap_or(3),
            args.axis_result_vs_process.unwrap_or(3),
            args.axis_solo_vs_team.unwrap_or(3),
            args.axis_future_vs_tradition.unwrap_or(3),
            args.axis_shares_private.unwrap_or(3),
            args.axis_teaching_skill.unwrap_or(3),
            args.axis_listening.unwrap_or(3),
            args.axis_busyness.unwrap_or(3),
            args.q1, args.q2, args.q3, args.q4, args.q5,
            args.q6, args.q7, args.q8, args.q9, args.q10, args.q11,
            args.strength_episode,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM boss_references WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_boss_references(
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<BossReferenceRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM boss_references ORDER BY created_at ASC, id ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_boss_reference(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<BossReferenceRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM boss_references WHERE id = ?1");
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
pub struct UpdateBossReferenceArgs {
    pub boss_name: Option<Option<String>>,
    pub company_name: Option<String>,
    pub period: Option<String>,
    pub axis_logic_vs_emotion: Option<i64>,
    pub axis_result_vs_process: Option<i64>,
    pub axis_solo_vs_team: Option<i64>,
    pub axis_future_vs_tradition: Option<i64>,
    pub axis_shares_private: Option<i64>,
    pub axis_teaching_skill: Option<i64>,
    pub axis_listening: Option<i64>,
    pub axis_busyness: Option<i64>,
    pub q1: Option<Option<String>>,
    pub q2: Option<Option<String>>,
    pub q3: Option<Option<String>>,
    pub q4: Option<Option<String>>,
    pub q5: Option<Option<String>>,
    pub q6: Option<Option<String>>,
    pub q7: Option<Option<String>>,
    pub q8: Option<Option<String>>,
    pub q9: Option<Option<String>>,
    pub q10: Option<Option<String>>,
    pub q11: Option<Option<String>>,
    pub strength_episode: Option<Option<String>>,
}

#[tauri::command]
pub fn update_boss_reference(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateBossReferenceArgs,
) -> Result<BossReferenceRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.boss_name {
        sets.push("boss_name = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.company_name {
        sets.push("company_name = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.period {
        sets.push("period = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.axis_logic_vs_emotion {
        sets.push("axis_logic_vs_emotion = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.axis_result_vs_process {
        sets.push("axis_result_vs_process = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.axis_solo_vs_team {
        sets.push("axis_solo_vs_team = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.axis_future_vs_tradition {
        sets.push("axis_future_vs_tradition = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.axis_shares_private {
        sets.push("axis_shares_private = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.axis_teaching_skill {
        sets.push("axis_teaching_skill = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.axis_listening {
        sets.push("axis_listening = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.axis_busyness {
        sets.push("axis_busyness = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.q1 {
        sets.push("q1 = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.q2 {
        sets.push("q2 = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.q3 {
        sets.push("q3 = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.q4 {
        sets.push("q4 = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.q5 {
        sets.push("q5 = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.q6 {
        sets.push("q6 = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.q7 {
        sets.push("q7 = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.q8 {
        sets.push("q8 = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.q9 {
        sets.push("q9 = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.q10 {
        sets.push("q10 = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.q11 {
        sets.push("q11 = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.strength_episode {
        sets.push("strength_episode = ?".to_string());
        params.push(Box::new(v));
    }

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?".to_string());
    params.push(Box::new(now));
    params.push(Box::new(id.clone()));

    let sql = format!(
        "UPDATE boss_references SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("boss_reference not found: {id}"));
    }

    let select_sql = format!("SELECT {SELECT_COLUMNS} FROM boss_references WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_boss_reference(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM boss_references WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("boss_reference not found: {id}"));
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
