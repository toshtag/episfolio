use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AgentTrackRecordRow {
    pub id: String,
    pub company_name: String,
    pub contact_name: String,
    pub contact_email: String,
    pub contact_phone: String,
    pub first_contact_date: Option<String>,
    pub memo: String,
    pub status: String,
    // 多経路発想・エージェントを資産として評価するフィールド
    pub specialty_industries: Option<String>,
    pub specialty_job_types: Option<String>,
    pub consultant_quality: Option<String>,
    pub has_exclusive_jobs: Option<bool>,
    pub provides_recommendation_letter: Option<bool>,
    pub recommendation_letter_received: Option<bool>,
    pub number_of_jobs_introduced: Option<i64>,
    pub response_speed_days: Option<f64>,
    pub overall_rating: Option<f64>,
    pub created_at: String,
    pub updated_at: String,
}

fn int_to_bool(v: Option<i64>) -> Option<bool> {
    v.map(|n| n != 0)
}

fn validate_nonnegative_i64(field: &str, value: Option<i64>) -> Result<(), String> {
    if let Some(v) = value {
        if v < 0 {
            return Err(format!("{field} must be nonnegative"));
        }
    }
    Ok(())
}

fn validate_nonnegative_f64(field: &str, value: Option<f64>) -> Result<(), String> {
    if let Some(v) = value {
        if !v.is_finite() || v < 0.0 {
            return Err(format!("{field} must be a finite nonnegative number"));
        }
    }
    Ok(())
}

fn validate_rating(field: &str, value: Option<f64>) -> Result<(), String> {
    if let Some(v) = value {
        if !v.is_finite() || !(1.0..=5.0).contains(&v) {
            return Err(format!("{field} must be between 1 and 5"));
        }
    }
    Ok(())
}

fn validate_agent_create_args(args: &CreateAgentTrackRecordArgs) -> Result<(), String> {
    validate_nonnegative_i64("numberOfJobsIntroduced", args.number_of_jobs_introduced)?;
    validate_nonnegative_f64("responseSpeedDays", args.response_speed_days)?;
    validate_rating("overallRating", args.overall_rating)?;
    Ok(())
}

fn validate_agent_update_args(patch: &UpdateAgentTrackRecordArgs) -> Result<(), String> {
    validate_nonnegative_i64(
        "numberOfJobsIntroduced",
        patch.number_of_jobs_introduced.flatten(),
    )?;
    validate_nonnegative_f64("responseSpeedDays", patch.response_speed_days.flatten())?;
    validate_rating("overallRating", patch.overall_rating.flatten())?;
    Ok(())
}

const SELECT_COLUMNS: &str = "id, company_name, contact_name, contact_email, contact_phone, \
     first_contact_date, memo, status, \
     specialty_industries, specialty_job_types, consultant_quality, \
     has_exclusive_jobs, provides_recommendation_letter, recommendation_letter_received, \
     number_of_jobs_introduced, response_speed_days, overall_rating, \
     created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<AgentTrackRecordRow> {
    Ok(AgentTrackRecordRow {
        id: row.get(0)?,
        company_name: row.get(1)?,
        contact_name: row.get(2)?,
        contact_email: row.get(3)?,
        contact_phone: row.get(4)?,
        first_contact_date: row.get(5)?,
        memo: row.get(6)?,
        status: row.get(7)?,
        specialty_industries: row.get(8)?,
        specialty_job_types: row.get(9)?,
        consultant_quality: row.get(10)?,
        has_exclusive_jobs: int_to_bool(row.get(11)?),
        provides_recommendation_letter: int_to_bool(row.get(12)?),
        recommendation_letter_received: int_to_bool(row.get(13)?),
        number_of_jobs_introduced: row.get(14)?,
        response_speed_days: row.get(15)?,
        overall_rating: row.get(16)?,
        created_at: row.get(17)?,
        updated_at: row.get(18)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAgentTrackRecordArgs {
    pub company_name: String,
    pub contact_name: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub first_contact_date: Option<String>,
    pub memo: Option<String>,
    pub status: Option<String>,
    pub specialty_industries: Option<String>,
    pub specialty_job_types: Option<String>,
    pub consultant_quality: Option<String>,
    pub has_exclusive_jobs: Option<bool>,
    pub provides_recommendation_letter: Option<bool>,
    pub recommendation_letter_received: Option<bool>,
    pub number_of_jobs_introduced: Option<i64>,
    pub response_speed_days: Option<f64>,
    pub overall_rating: Option<f64>,
}

#[tauri::command]
pub fn create_agent_track_record(
    db: State<'_, Mutex<Connection>>,
    args: CreateAgentTrackRecordArgs,
) -> Result<AgentTrackRecordRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    create_agent_track_record_with_conn(&conn, args)
}

fn create_agent_track_record_with_conn(
    conn: &Connection,
    args: CreateAgentTrackRecordArgs,
) -> Result<AgentTrackRecordRow, String> {
    validate_agent_create_args(&args)?;
    let id = Ulid::new().to_string();
    let now = chrono_now();
    let status = args.status.unwrap_or_else(|| "active".to_string());

    conn.execute(
        "INSERT INTO agent_track_records \
         (id, company_name, contact_name, contact_email, contact_phone, \
          first_contact_date, memo, status, \
          specialty_industries, specialty_job_types, consultant_quality, \
          has_exclusive_jobs, provides_recommendation_letter, recommendation_letter_received, \
          number_of_jobs_introduced, response_speed_days, overall_rating, \
          created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?18)",
        rusqlite::params![
            id,
            args.company_name,
            args.contact_name.unwrap_or_default(),
            args.contact_email.unwrap_or_default(),
            args.contact_phone.unwrap_or_default(),
            args.first_contact_date,
            args.memo.unwrap_or_default(),
            status,
            args.specialty_industries,
            args.specialty_job_types,
            args.consultant_quality,
            args.has_exclusive_jobs.map(|b| b as i64),
            args.provides_recommendation_letter.map(|b| b as i64),
            args.recommendation_letter_received.map(|b| b as i64),
            args.number_of_jobs_introduced,
            args.response_speed_days,
            args.overall_rating,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM agent_track_records WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_agent_track_records(
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<AgentTrackRecordRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    list_agent_track_records_with_conn(&conn)
}

fn list_agent_track_records_with_conn(
    conn: &Connection,
) -> Result<Vec<AgentTrackRecordRow>, String> {
    let sql =
        format!("SELECT {SELECT_COLUMNS} FROM agent_track_records ORDER BY created_at ASC, id ASC");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_agent_track_record(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<AgentTrackRecordRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    get_agent_track_record_with_conn(&conn, &id)
}

fn get_agent_track_record_with_conn(
    conn: &Connection,
    id: &str,
) -> Result<Option<AgentTrackRecordRow>, String> {
    let sql = format!("SELECT {SELECT_COLUMNS} FROM agent_track_records WHERE id = ?1");
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
pub struct UpdateAgentTrackRecordArgs {
    pub company_name: Option<String>,
    pub contact_name: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub first_contact_date: Option<Option<String>>,
    pub memo: Option<String>,
    pub status: Option<String>,
    pub specialty_industries: Option<Option<String>>,
    pub specialty_job_types: Option<Option<String>>,
    pub consultant_quality: Option<Option<String>>,
    pub has_exclusive_jobs: Option<Option<bool>>,
    pub provides_recommendation_letter: Option<Option<bool>>,
    pub recommendation_letter_received: Option<Option<bool>>,
    pub number_of_jobs_introduced: Option<Option<i64>>,
    pub response_speed_days: Option<Option<f64>>,
    pub overall_rating: Option<Option<f64>>,
}

#[tauri::command]
pub fn update_agent_track_record(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateAgentTrackRecordArgs,
) -> Result<AgentTrackRecordRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    update_agent_track_record_with_conn(&conn, &id, patch)
}

fn update_agent_track_record_with_conn(
    conn: &Connection,
    id: &str,
    patch: UpdateAgentTrackRecordArgs,
) -> Result<AgentTrackRecordRow, String> {
    validate_agent_update_args(&patch)?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    macro_rules! push_nullable {
        ($field:expr, $col:expr) => {
            if let Some(v) = $field {
                sets.push(format!("{} = ?", $col));
                params.push(Box::new(v));
            }
        };
    }

    macro_rules! push_nullable_bool {
        ($field:expr, $col:expr) => {
            if let Some(v) = $field {
                sets.push(format!("{} = ?", $col));
                params.push(Box::new(v.map(|b: bool| b as i64)));
            }
        };
    }

    if let Some(v) = patch.company_name {
        sets.push("company_name = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.contact_name {
        sets.push("contact_name = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.contact_email {
        sets.push("contact_email = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.contact_phone {
        sets.push("contact_phone = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.first_contact_date {
        sets.push("first_contact_date = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.memo {
        sets.push("memo = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.status {
        sets.push("status = ?".to_string());
        params.push(Box::new(v));
    }
    push_nullable!(patch.specialty_industries, "specialty_industries");
    push_nullable!(patch.specialty_job_types, "specialty_job_types");
    push_nullable!(patch.consultant_quality, "consultant_quality");
    push_nullable_bool!(patch.has_exclusive_jobs, "has_exclusive_jobs");
    push_nullable_bool!(
        patch.provides_recommendation_letter,
        "provides_recommendation_letter"
    );
    push_nullable_bool!(
        patch.recommendation_letter_received,
        "recommendation_letter_received"
    );
    push_nullable!(patch.number_of_jobs_introduced, "number_of_jobs_introduced");
    push_nullable!(patch.response_speed_days, "response_speed_days");
    push_nullable!(patch.overall_rating, "overall_rating");

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?".to_string());
    params.push(Box::new(now));
    params.push(Box::new(id.to_string()));

    let sql = format!(
        "UPDATE agent_track_records SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("agent_track_record not found: {id}"));
    }

    let select_sql = format!("SELECT {SELECT_COLUMNS} FROM agent_track_records WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_agent_track_record(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    delete_agent_track_record_with_conn(&conn, &id)
}

fn delete_agent_track_record_with_conn(conn: &Connection, id: &str) -> Result<(), String> {
    let affected = conn
        .execute(
            "DELETE FROM agent_track_records WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("agent_track_record not found: {id}"));
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::sqlite;

    fn create_args() -> CreateAgentTrackRecordArgs {
        CreateAgentTrackRecordArgs {
            company_name: "Agent Inc.".to_string(),
            contact_name: Some("Arai".to_string()),
            contact_email: Some("agent@example.com".to_string()),
            contact_phone: Some("03-0000-0000".to_string()),
            first_contact_date: Some("2026-05-04".to_string()),
            memo: Some("SaaS に強い".to_string()),
            status: Some("active".to_string()),
            specialty_industries: Some("SaaS, Fintech".to_string()),
            specialty_job_types: Some("Engineering manager".to_string()),
            consultant_quality: Some("excellent".to_string()),
            has_exclusive_jobs: Some(true),
            provides_recommendation_letter: Some(true),
            recommendation_letter_received: Some(false),
            number_of_jobs_introduced: Some(12),
            response_speed_days: Some(1.5),
            overall_rating: Some(5.0),
        }
    }

    fn empty_patch() -> UpdateAgentTrackRecordArgs {
        UpdateAgentTrackRecordArgs {
            company_name: None,
            contact_name: None,
            contact_email: None,
            contact_phone: None,
            first_contact_date: None,
            memo: None,
            status: None,
            specialty_industries: None,
            specialty_job_types: None,
            consultant_quality: None,
            has_exclusive_jobs: None,
            provides_recommendation_letter: None,
            recommendation_letter_received: None,
            number_of_jobs_introduced: None,
            response_speed_days: None,
            overall_rating: None,
        }
    }

    #[test]
    fn agent_track_record_command_core_crud_smoke() {
        let conn = sqlite::open_in_memory_with_migrations().unwrap();

        let created = create_agent_track_record_with_conn(&conn, create_args())
            .expect("create should store v0.11 agent fields");
        assert_eq!(created.company_name, "Agent Inc.");
        assert_eq!(
            created.specialty_industries.as_deref(),
            Some("SaaS, Fintech")
        );
        assert_eq!(created.consultant_quality.as_deref(), Some("excellent"));
        assert_eq!(created.has_exclusive_jobs, Some(true));
        assert_eq!(created.provides_recommendation_letter, Some(true));
        assert_eq!(created.recommendation_letter_received, Some(false));
        assert_eq!(created.number_of_jobs_introduced, Some(12));
        assert_eq!(created.response_speed_days, Some(1.5));
        assert_eq!(created.overall_rating, Some(5.0));

        let listed = list_agent_track_records_with_conn(&conn).unwrap();
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].id, created.id);

        let fetched = get_agent_track_record_with_conn(&conn, &created.id)
            .unwrap()
            .expect("created record should be fetchable");
        assert_eq!(fetched.id, created.id);

        let mut patch = empty_patch();
        patch.memo = Some("更新後メモ".to_string());
        patch.specialty_industries = Some(None);
        patch.consultant_quality = Some(None);
        patch.has_exclusive_jobs = Some(Some(false));
        patch.provides_recommendation_letter = Some(None);
        patch.overall_rating = Some(Some(4.0));

        let updated = update_agent_track_record_with_conn(&conn, &created.id, patch).unwrap();
        assert_eq!(updated.memo, "更新後メモ");
        assert_eq!(updated.specialty_industries, None);
        assert_eq!(updated.consultant_quality, None);
        assert_eq!(updated.has_exclusive_jobs, Some(false));
        assert_eq!(updated.provides_recommendation_letter, None);
        assert_eq!(updated.overall_rating, Some(4.0));

        delete_agent_track_record_with_conn(&conn, &created.id).unwrap();
        assert!(get_agent_track_record_with_conn(&conn, &created.id)
            .unwrap()
            .is_none());
    }

    #[test]
    fn agent_track_record_update_rejects_empty_patch() {
        let conn = sqlite::open_in_memory_with_migrations().unwrap();
        let created = create_agent_track_record_with_conn(&conn, create_args()).unwrap();

        let error = update_agent_track_record_with_conn(&conn, &created.id, empty_patch())
            .expect_err("empty patch should be rejected");
        assert!(error.contains("更新フィールドがありません"));
    }

    #[test]
    fn agent_track_record_rejects_invalid_v011_numbers() {
        let conn = sqlite::open_in_memory_with_migrations().unwrap();

        let mut args = create_args();
        args.number_of_jobs_introduced = Some(-1);
        assert!(create_agent_track_record_with_conn(&conn, args)
            .unwrap_err()
            .contains("numberOfJobsIntroduced"));

        let mut args = create_args();
        args.overall_rating = Some(6.0);
        assert!(create_agent_track_record_with_conn(&conn, args)
            .unwrap_err()
            .contains("overallRating"));

        let created = create_agent_track_record_with_conn(&conn, create_args()).unwrap();
        let mut patch = empty_patch();
        patch.response_speed_days = Some(Some(-0.1));
        assert!(
            update_agent_track_record_with_conn(&conn, &created.id, patch)
                .unwrap_err()
                .contains("responseSpeedDays")
        );

        let mut patch = empty_patch();
        patch.overall_rating = Some(None);
        update_agent_track_record_with_conn(&conn, &created.id, patch).unwrap();
    }
}
