use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CustomerReferenceRow {
    pub id: String,
    pub customer_type: String,
    pub customer_label: Option<String>,
    pub company_name: String,
    pub period: String,
    pub industry: Option<String>,
    pub company_scale: Option<String>,
    pub counterpart_role: Option<String>,
    pub typical_requests: Option<String>,
    pub age_range: Option<String>,
    pub family_status: Option<String>,
    pub residence: Option<String>,
    pub income_range: Option<String>,
    pub hardest_experience: Option<String>,
    pub claim_content: Option<String>,
    pub response_time: Option<String>,
    pub strength_episode: Option<String>,
    pub indirect_role_idea: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

const SELECT_COLUMNS: &str =
    "id, customer_type, customer_label, company_name, period, \
     industry, company_scale, counterpart_role, typical_requests, \
     age_range, family_status, residence, income_range, \
     hardest_experience, claim_content, response_time, \
     strength_episode, indirect_role_idea, \
     created_at, updated_at";

fn row_from_query(row: &rusqlite::Row<'_>) -> rusqlite::Result<CustomerReferenceRow> {
    Ok(CustomerReferenceRow {
        id: row.get(0)?,
        customer_type: row.get(1)?,
        customer_label: row.get(2)?,
        company_name: row.get(3)?,
        period: row.get(4)?,
        industry: row.get(5)?,
        company_scale: row.get(6)?,
        counterpart_role: row.get(7)?,
        typical_requests: row.get(8)?,
        age_range: row.get(9)?,
        family_status: row.get(10)?,
        residence: row.get(11)?,
        income_range: row.get(12)?,
        hardest_experience: row.get(13)?,
        claim_content: row.get(14)?,
        response_time: row.get(15)?,
        strength_episode: row.get(16)?,
        indirect_role_idea: row.get(17)?,
        created_at: row.get(18)?,
        updated_at: row.get(19)?,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCustomerReferenceArgs {
    pub customer_type: Option<String>,
    pub customer_label: Option<String>,
    pub company_name: Option<String>,
    pub period: Option<String>,
    pub industry: Option<String>,
    pub company_scale: Option<String>,
    pub counterpart_role: Option<String>,
    pub typical_requests: Option<String>,
    pub age_range: Option<String>,
    pub family_status: Option<String>,
    pub residence: Option<String>,
    pub income_range: Option<String>,
    pub hardest_experience: Option<String>,
    pub claim_content: Option<String>,
    pub response_time: Option<String>,
    pub strength_episode: Option<String>,
    pub indirect_role_idea: Option<String>,
}

#[tauri::command]
pub fn create_customer_reference(
    db: State<'_, Mutex<Connection>>,
    args: CreateCustomerReferenceArgs,
) -> Result<CustomerReferenceRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Ulid::new().to_string();
    let now = chrono_now();

    conn.execute(
        "INSERT INTO customer_references \
         (id, customer_type, customer_label, company_name, period, \
          industry, company_scale, counterpart_role, typical_requests, \
          age_range, family_status, residence, income_range, \
          hardest_experience, claim_content, response_time, \
          strength_episode, indirect_role_idea, \
          created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?19)",
        rusqlite::params![
            id,
            args.customer_type.unwrap_or_else(|| "b2b".to_string()),
            args.customer_label,
            args.company_name.unwrap_or_default(),
            args.period.unwrap_or_default(),
            args.industry,
            args.company_scale,
            args.counterpart_role,
            args.typical_requests,
            args.age_range,
            args.family_status,
            args.residence,
            args.income_range,
            args.hardest_experience,
            args.claim_content,
            args.response_time,
            args.strength_episode,
            args.indirect_role_idea,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let sql = format!("SELECT {SELECT_COLUMNS} FROM customer_references WHERE id = ?1");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_customer_references(
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<CustomerReferenceRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {SELECT_COLUMNS} FROM customer_references ORDER BY created_at ASC, id ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_from_query)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_customer_reference(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<Option<CustomerReferenceRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!("SELECT {SELECT_COLUMNS} FROM customer_references WHERE id = ?1");
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
pub struct UpdateCustomerReferenceArgs {
    pub customer_type: Option<String>,
    pub customer_label: Option<Option<String>>,
    pub company_name: Option<String>,
    pub period: Option<String>,
    pub industry: Option<Option<String>>,
    pub company_scale: Option<Option<String>>,
    pub counterpart_role: Option<Option<String>>,
    pub typical_requests: Option<Option<String>>,
    pub age_range: Option<Option<String>>,
    pub family_status: Option<Option<String>>,
    pub residence: Option<Option<String>>,
    pub income_range: Option<Option<String>>,
    pub hardest_experience: Option<Option<String>>,
    pub claim_content: Option<Option<String>>,
    pub response_time: Option<Option<String>>,
    pub strength_episode: Option<Option<String>>,
    pub indirect_role_idea: Option<Option<String>>,
}

#[tauri::command]
pub fn update_customer_reference(
    db: State<'_, Mutex<Connection>>,
    id: String,
    patch: UpdateCustomerReferenceArgs,
) -> Result<CustomerReferenceRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = patch.customer_type {
        sets.push("customer_type = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.customer_label {
        sets.push("customer_label = ?".to_string());
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
    if let Some(v) = patch.industry {
        sets.push("industry = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.company_scale {
        sets.push("company_scale = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.counterpart_role {
        sets.push("counterpart_role = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.typical_requests {
        sets.push("typical_requests = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.age_range {
        sets.push("age_range = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.family_status {
        sets.push("family_status = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.residence {
        sets.push("residence = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.income_range {
        sets.push("income_range = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.hardest_experience {
        sets.push("hardest_experience = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.claim_content {
        sets.push("claim_content = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.response_time {
        sets.push("response_time = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.strength_episode {
        sets.push("strength_episode = ?".to_string());
        params.push(Box::new(v));
    }
    if let Some(v) = patch.indirect_role_idea {
        sets.push("indirect_role_idea = ?".to_string());
        params.push(Box::new(v));
    }

    if sets.is_empty() {
        return Err("更新フィールドがありません".to_string());
    }

    sets.push("updated_at = ?".to_string());
    params.push(Box::new(now));
    params.push(Box::new(id.clone()));

    let sql = format!(
        "UPDATE customer_references SET {} WHERE id = ?",
        sets.join(", ")
    );
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    let affected = conn
        .execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("customer_reference not found: {id}"));
    }

    let select_sql = format!("SELECT {SELECT_COLUMNS} FROM customer_references WHERE id = ?1");
    let mut stmt = conn.prepare(&select_sql).map_err(|e| e.to_string())?;
    stmt.query_row(rusqlite::params![id], row_from_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_customer_reference(
    db: State<'_, Mutex<Connection>>,
    id: String,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute(
            "DELETE FROM customer_references WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err(format!("customer_reference not found: {id}"));
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
