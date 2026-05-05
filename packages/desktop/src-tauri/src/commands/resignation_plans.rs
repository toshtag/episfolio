use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ResignationPlanRow {
    pub id: String,
    pub job_target_id: String,
    pub annual_salary: Option<i64>,
    pub annual_holidays: Option<i64>,
    pub daily_working_hours: Option<f64>,
    pub commute_minutes: Option<i64>,
    pub position_note: String,
    pub recruitment_background: Option<String>,
    pub risk_memo: String,
    pub final_interview_at: Option<String>,
    pub offer_notified_at: Option<String>,
    pub offer_accepted_at: Option<String>,
    pub resignation_notified_at: Option<String>,
    pub handover_started_at: Option<String>,
    pub last_working_day_at: Option<String>,
    pub paid_leave_start_at: Option<String>,
    pub joined_at: Option<String>,
    pub available_date_from: Option<String>,
    pub available_date_to: Option<String>,
    pub negotiation_note: String,
    pub samurai_loss_note: String,
    pub samurai_gain_note: String,
    pub next_exit_plan: String,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str =
    "id, job_target_id, annual_salary, annual_holidays, daily_working_hours, commute_minutes, \
     position_note, recruitment_background, risk_memo, \
     final_interview_at, offer_notified_at, offer_accepted_at, resignation_notified_at, \
     handover_started_at, last_working_day_at, paid_leave_start_at, joined_at, \
     available_date_from, available_date_to, negotiation_note, \
     samurai_loss_note, samurai_gain_note, next_exit_plan, \
     created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<ResignationPlanRow> {
    Ok(ResignationPlanRow {
        id: row.get(0)?,
        job_target_id: row.get(1)?,
        annual_salary: row.get(2)?,
        annual_holidays: row.get(3)?,
        daily_working_hours: row.get(4)?,
        commute_minutes: row.get(5)?,
        position_note: row.get(6)?,
        recruitment_background: row.get(7)?,
        risk_memo: row.get(8)?,
        final_interview_at: row.get(9)?,
        offer_notified_at: row.get(10)?,
        offer_accepted_at: row.get(11)?,
        resignation_notified_at: row.get(12)?,
        handover_started_at: row.get(13)?,
        last_working_day_at: row.get(14)?,
        paid_leave_start_at: row.get(15)?,
        joined_at: row.get(16)?,
        available_date_from: row.get(17)?,
        available_date_to: row.get(18)?,
        negotiation_note: row.get(19)?,
        samurai_loss_note: row.get(20)?,
        samurai_gain_note: row.get(21)?,
        next_exit_plan: row.get(22)?,
        created_at: row.get(23)?,
        updated_at: row.get(24)?,
    })
}

fn validate_nonnegative_i64(field: &str, value: Option<i64>) -> Result<(), String> {
    if let Some(v) = value {
        if v < 0 {
            return Err(format!("{field} must be nonnegative"));
        }
    }
    Ok(())
}

fn validate_i64_range(field: &str, value: Option<i64>, min: i64, max: i64) -> Result<(), String> {
    if let Some(v) = value {
        if v < min || v > max {
            return Err(format!("{field} must be between {min} and {max}"));
        }
    }
    Ok(())
}

fn validate_f64_range(field: &str, value: Option<f64>, min: f64, max: f64) -> Result<(), String> {
    if let Some(v) = value {
        if !v.is_finite() || v < min || v > max {
            return Err(format!("{field} must be between {min} and {max}"));
        }
    }
    Ok(())
}

fn validate_resignation_create_args(args: &CreateResignationPlanArgs) -> Result<(), String> {
    validate_nonnegative_i64("annualSalary", args.annual_salary)?;
    validate_i64_range("annualHolidays", args.annual_holidays, 0, 366)?;
    validate_f64_range("dailyWorkingHours", args.daily_working_hours, 0.0, 24.0)?;
    validate_nonnegative_i64("commuteMinutes", args.commute_minutes)?;
    Ok(())
}

fn validate_resignation_update_args(patch: &UpdateResignationPlanArgs) -> Result<(), String> {
    validate_nonnegative_i64("annualSalary", patch.annual_salary.flatten())?;
    validate_i64_range("annualHolidays", patch.annual_holidays.flatten(), 0, 366)?;
    validate_f64_range(
        "dailyWorkingHours",
        patch.daily_working_hours.flatten(),
        0.0,
        24.0,
    )?;
    validate_nonnegative_i64("commuteMinutes", patch.commute_minutes.flatten())?;
    Ok(())
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateResignationPlanArgs {
    pub job_target_id: String,
    pub annual_salary: Option<i64>,
    pub annual_holidays: Option<i64>,
    pub daily_working_hours: Option<f64>,
    pub commute_minutes: Option<i64>,
    pub position_note: Option<String>,
    pub recruitment_background: Option<String>,
    pub risk_memo: Option<String>,
    pub final_interview_at: Option<String>,
    pub offer_notified_at: Option<String>,
    pub offer_accepted_at: Option<String>,
    pub resignation_notified_at: Option<String>,
    pub handover_started_at: Option<String>,
    pub last_working_day_at: Option<String>,
    pub paid_leave_start_at: Option<String>,
    pub joined_at: Option<String>,
    pub available_date_from: Option<String>,
    pub available_date_to: Option<String>,
    pub negotiation_note: Option<String>,
    pub samurai_loss_note: Option<String>,
    pub samurai_gain_note: Option<String>,
    pub next_exit_plan: Option<String>,
}

#[tauri::command]
pub fn create_resignation_plan(
    db: State<'_, Mutex<Connection>>,
    args: CreateResignationPlanArgs,
) -> Result<ResignationPlanRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    create_resignation_plan_with_conn(&conn, args)
}

fn create_resignation_plan_with_conn(
    conn: &Connection,
    args: CreateResignationPlanArgs,
) -> Result<ResignationPlanRow, String> {
    validate_resignation_create_args(&args)?;
    let id = Ulid::new().to_string();
    let now = chrono_now();

    conn.execute(
        "INSERT INTO resignation_plans \
         (id, job_target_id, annual_salary, annual_holidays, daily_working_hours, commute_minutes, \
          position_note, recruitment_background, risk_memo, \
          final_interview_at, offer_notified_at, offer_accepted_at, resignation_notified_at, \
          handover_started_at, last_working_day_at, paid_leave_start_at, joined_at, \
          available_date_from, available_date_to, negotiation_note, \
          samurai_loss_note, samurai_gain_note, next_exit_plan, \
          created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,?24)",
        rusqlite::params![
            id,
            args.job_target_id,
            args.annual_salary,
            args.annual_holidays,
            args.daily_working_hours,
            args.commute_minutes,
            args.position_note.unwrap_or_default(),
            args.recruitment_background,
            args.risk_memo.unwrap_or_default(),
            args.final_interview_at,
            args.offer_notified_at,
            args.offer_accepted_at,
            args.resignation_notified_at,
            args.handover_started_at,
            args.last_working_day_at,
            args.paid_leave_start_at,
            args.joined_at,
            args.available_date_from,
            args.available_date_to,
            args.negotiation_note.unwrap_or_default(),
            args.samurai_loss_note.unwrap_or_default(),
            args.samurai_gain_note.unwrap_or_default(),
            args.next_exit_plan.unwrap_or_default(),
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM resignation_plans WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_resignation_plans_by_job_target(
    db: State<'_, Mutex<Connection>>,
    job_target_id: String,
) -> Result<Vec<ResignationPlanRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    list_resignation_plans_by_job_target_with_conn(&conn, &job_target_id)
}

fn list_resignation_plans_by_job_target_with_conn(
    conn: &Connection,
    job_target_id: &str,
) -> Result<Vec<ResignationPlanRow>, String> {
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM resignation_plans \
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
pub fn get_resignation_plan(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<ResignationPlanRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    get_resignation_plan_with_conn(&conn, &id)
}

fn get_resignation_plan_with_conn(
    conn: &Connection,
    id: &str,
) -> Result<Option<ResignationPlanRow>, String> {
    let sql = format!("SELECT {SELECT_COLUMNS} FROM resignation_plans WHERE id = ?1");
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
pub struct UpdateResignationPlanArgs {
    pub annual_salary: Option<Option<i64>>,
    pub annual_holidays: Option<Option<i64>>,
    pub daily_working_hours: Option<Option<f64>>,
    pub commute_minutes: Option<Option<i64>>,
    pub position_note: Option<String>,
    pub recruitment_background: Option<Option<String>>,
    pub risk_memo: Option<String>,
    pub final_interview_at: Option<Option<String>>,
    pub offer_notified_at: Option<Option<String>>,
    pub offer_accepted_at: Option<Option<String>>,
    pub resignation_notified_at: Option<Option<String>>,
    pub handover_started_at: Option<Option<String>>,
    pub last_working_day_at: Option<Option<String>>,
    pub paid_leave_start_at: Option<Option<String>>,
    pub joined_at: Option<Option<String>>,
    pub available_date_from: Option<Option<String>>,
    pub available_date_to: Option<Option<String>>,
    pub negotiation_note: Option<String>,
    pub samurai_loss_note: Option<String>,
    pub samurai_gain_note: Option<String>,
    pub next_exit_plan: Option<String>,
}

#[tauri::command]
pub fn update_resignation_plan(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateResignationPlanArgs,
) -> Result<ResignationPlanRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    update_resignation_plan_with_conn(&conn, &id, patch)
}

fn update_resignation_plan_with_conn(
    conn: &Connection,
    id: &str,
    patch: UpdateResignationPlanArgs,
) -> Result<ResignationPlanRow, String> {
    validate_resignation_update_args(&patch)?;
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

    macro_rules! push_str {
        ($field:expr, $col:expr) => {
            if let Some(v) = $field {
                sets.push(format!("{} = ?", $col));
                params.push(Box::new(v));
            }
        };
    }

    push_nullable!(patch.annual_salary, "annual_salary");
    push_nullable!(patch.annual_holidays, "annual_holidays");
    push_nullable!(patch.daily_working_hours, "daily_working_hours");
    push_nullable!(patch.commute_minutes, "commute_minutes");
    push_str!(patch.position_note, "position_note");
    push_nullable!(patch.recruitment_background, "recruitment_background");
    push_str!(patch.risk_memo, "risk_memo");
    push_nullable!(patch.final_interview_at, "final_interview_at");
    push_nullable!(patch.offer_notified_at, "offer_notified_at");
    push_nullable!(patch.offer_accepted_at, "offer_accepted_at");
    push_nullable!(patch.resignation_notified_at, "resignation_notified_at");
    push_nullable!(patch.handover_started_at, "handover_started_at");
    push_nullable!(patch.last_working_day_at, "last_working_day_at");
    push_nullable!(patch.paid_leave_start_at, "paid_leave_start_at");
    push_nullable!(patch.joined_at, "joined_at");
    push_nullable!(patch.available_date_from, "available_date_from");
    push_nullable!(patch.available_date_to, "available_date_to");
    push_str!(patch.negotiation_note, "negotiation_note");
    push_str!(patch.samurai_loss_note, "samurai_loss_note");
    push_str!(patch.samurai_gain_note, "samurai_gain_note");
    push_str!(patch.next_exit_plan, "next_exit_plan");

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?".to_string());
    params.push(Box::new(now));
    params.push(Box::new(id.to_string()));

    let sql = format!(
        "UPDATE resignation_plans SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("resignation_plan not found: {id}"));
    }

    let select_sql = format!("SELECT {SELECT_COLUMNS} FROM resignation_plans WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_resignation_plan(db: State<'_, Mutex<Connection>>, id: String) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    delete_resignation_plan_with_conn(&conn, &id)
}

fn delete_resignation_plan_with_conn(conn: &Connection, id: &str) -> Result<(), String> {
    let affected = conn
        .execute(
            "DELETE FROM resignation_plans WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("resignation_plan not found: {id}"));
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
    use std::fs;
    use std::path::{Path, PathBuf};

    const TS: &str = "2026-05-04T00:00:00Z";

    fn sidecar_path(path: &Path, suffix: &str) -> PathBuf {
        PathBuf::from(format!("{}{}", path.display(), suffix))
    }

    fn cleanup_db(path: &Path) {
        let _ = fs::remove_file(path);
        let _ = fs::remove_file(sidecar_path(path, "-wal"));
        let _ = fs::remove_file(sidecar_path(path, "-shm"));
    }

    fn db(suffix: &str) -> (Connection, PathBuf) {
        let path = std::env::temp_dir().join(format!(
            "episfolio-resignation-plan-test-{suffix}-{}.db",
            std::process::id()
        ));
        cleanup_db(&path);
        let conn = sqlite::open(path.clone()).unwrap();
        (conn, path)
    }

    fn insert_job_target(conn: &Connection, id: &str) {
        conn.execute(
            "INSERT INTO job_targets \
             (id, company_name, job_title, job_description, status, \
              required_skills, preferred_skills, concerns, appeal_points, created_at, updated_at) \
             VALUES (?1, 'Acme', 'Engineer', '', 'researching', '[]', '[]', '', '', ?2, ?2)",
            rusqlite::params![id, TS],
        )
        .unwrap();
    }

    fn create_args(job_target_id: &str) -> CreateResignationPlanArgs {
        CreateResignationPlanArgs {
            job_target_id: job_target_id.to_string(),
            annual_salary: Some(6_000_000),
            annual_holidays: Some(125),
            daily_working_hours: Some(7.5),
            commute_minutes: Some(35),
            position_note: Some("Tech lead".to_string()),
            recruitment_background: Some("expansion".to_string()),
            risk_memo: Some("引き継ぎリスク".to_string()),
            final_interview_at: Some("2026-05-10".to_string()),
            offer_notified_at: Some("2026-05-12".to_string()),
            offer_accepted_at: Some("2026-05-13".to_string()),
            resignation_notified_at: Some("2026-05-14".to_string()),
            handover_started_at: Some("2026-05-15".to_string()),
            last_working_day_at: Some("2026-06-20".to_string()),
            paid_leave_start_at: Some("2026-06-21".to_string()),
            joined_at: Some("2026-07-01".to_string()),
            available_date_from: Some("2026-06-24".to_string()),
            available_date_to: Some("2026-06-30".to_string()),
            negotiation_note: Some("入社日調整".to_string()),
            samurai_loss_note: Some("失うもの".to_string()),
            samurai_gain_note: Some("得るもの".to_string()),
            next_exit_plan: Some("次の出口".to_string()),
        }
    }

    fn empty_patch() -> UpdateResignationPlanArgs {
        UpdateResignationPlanArgs {
            annual_salary: None,
            annual_holidays: None,
            daily_working_hours: None,
            commute_minutes: None,
            position_note: None,
            recruitment_background: None,
            risk_memo: None,
            final_interview_at: None,
            offer_notified_at: None,
            offer_accepted_at: None,
            resignation_notified_at: None,
            handover_started_at: None,
            last_working_day_at: None,
            paid_leave_start_at: None,
            joined_at: None,
            available_date_from: None,
            available_date_to: None,
            negotiation_note: None,
            samurai_loss_note: None,
            samurai_gain_note: None,
            next_exit_plan: None,
        }
    }

    #[test]
    fn resignation_plan_command_core_crud_smoke() {
        let (conn, path) = db("crud");
        insert_job_target(&conn, "jt_resignation");

        let created = create_resignation_plan_with_conn(&conn, create_args("jt_resignation"))
            .expect("create should store a complete resignation plan");
        assert_eq!(created.job_target_id, "jt_resignation");
        assert_eq!(created.annual_salary, Some(6_000_000));
        assert_eq!(created.recruitment_background.as_deref(), Some("expansion"));
        assert_eq!(created.next_exit_plan, "次の出口");

        let listed =
            list_resignation_plans_by_job_target_with_conn(&conn, "jt_resignation").unwrap();
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].id, created.id);

        let fetched = get_resignation_plan_with_conn(&conn, &created.id)
            .unwrap()
            .expect("created plan should be fetchable");
        assert_eq!(fetched.id, created.id);

        let mut patch = empty_patch();
        patch.annual_salary = Some(Some(7_000_000));
        patch.recruitment_background = Some(None);
        patch.risk_memo = Some("更新後リスク".to_string());
        patch.final_interview_at = Some(None);
        patch.next_exit_plan = Some("更新後の出口".to_string());

        let updated = update_resignation_plan_with_conn(&conn, &created.id, patch).unwrap();
        assert_eq!(updated.annual_salary, Some(7_000_000));
        assert_eq!(updated.recruitment_background, None);
        assert_eq!(updated.final_interview_at, None);
        assert_eq!(updated.risk_memo, "更新後リスク");
        assert_eq!(updated.next_exit_plan, "更新後の出口");

        delete_resignation_plan_with_conn(&conn, &created.id).unwrap();
        assert!(get_resignation_plan_with_conn(&conn, &created.id)
            .unwrap()
            .is_none());

        drop(conn);
        cleanup_db(&path);
    }

    #[test]
    fn resignation_plan_fk_and_cascade_smoke() {
        let (conn, path) = db("fk-cascade");

        let missing = create_resignation_plan_with_conn(&conn, create_args("missing_job_target"));
        assert!(
            missing.is_err(),
            "missing job_target_id should be rejected by FK"
        );

        insert_job_target(&conn, "jt_cascade");
        create_resignation_plan_with_conn(&conn, create_args("jt_cascade")).unwrap();

        conn.execute(
            "DELETE FROM job_targets WHERE id = ?1",
            rusqlite::params!["jt_cascade"],
        )
        .unwrap();

        let remaining = list_resignation_plans_by_job_target_with_conn(&conn, "jt_cascade")
            .expect("list after cascade should succeed");
        assert!(remaining.is_empty());

        drop(conn);
        cleanup_db(&path);
    }

    #[test]
    fn resignation_plan_update_rejects_empty_patch() {
        let (conn, path) = db("empty-patch");
        insert_job_target(&conn, "jt_empty_patch");
        let created =
            create_resignation_plan_with_conn(&conn, create_args("jt_empty_patch")).unwrap();

        let error = update_resignation_plan_with_conn(&conn, &created.id, empty_patch())
            .expect_err("empty patch should be rejected");
        assert!(error.contains("更新フィールドがありません"));

        drop(conn);
        cleanup_db(&path);
    }

    #[test]
    fn resignation_plan_rejects_invalid_offer_numbers() {
        let (conn, path) = db("invalid-numbers");
        insert_job_target(&conn, "jt_invalid_numbers");

        let mut args = create_args("jt_invalid_numbers");
        args.annual_holidays = Some(367);
        assert!(create_resignation_plan_with_conn(&conn, args)
            .unwrap_err()
            .contains("annualHolidays"));

        let mut args = create_args("jt_invalid_numbers");
        args.daily_working_hours = Some(f64::NAN);
        assert!(create_resignation_plan_with_conn(&conn, args)
            .unwrap_err()
            .contains("dailyWorkingHours"));

        let created =
            create_resignation_plan_with_conn(&conn, create_args("jt_invalid_numbers")).unwrap();
        let mut patch = empty_patch();
        patch.commute_minutes = Some(Some(-1));
        assert!(update_resignation_plan_with_conn(&conn, &created.id, patch)
            .unwrap_err()
            .contains("commuteMinutes"));

        let mut patch = empty_patch();
        patch.annual_salary = Some(None);
        update_resignation_plan_with_conn(&conn, &created.id, patch).unwrap();

        drop(conn);
        cleanup_db(&path);
    }
}
