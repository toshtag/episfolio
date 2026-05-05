use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

// ──────────────────────────────────────────────
// SkillEvidence row
// ──────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkillEvidenceRow {
    pub id: String,
    pub strength_label: String,
    pub description: String,
    pub evidence_episode_ids: Vec<String>,
    pub reproducibility: String,
    pub evaluated_context: String,
    pub confidence: String,
    pub status: String,
    pub source: String,
    pub created_by: String,
    pub source_ai_run_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

fn evidence_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<SkillEvidenceRow> {
    let ids_json: String = row.get(3)?;
    Ok(SkillEvidenceRow {
        id: row.get(0)?,
        strength_label: row.get(1)?,
        description: row.get(2)?,
        evidence_episode_ids: super::parse_json_column(3, &ids_json)?,
        reproducibility: row.get(4)?,
        evaluated_context: row.get(5)?,
        confidence: row.get(6)?,
        status: row.get(7)?,
        source: row.get(8)?,
        created_by: row.get(9)?,
        source_ai_run_id: row.get(10)?,
        created_at: row.get(11)?,
        updated_at: row.get(12)?,
    })
}

const EVIDENCE_COLUMNS: &str =
    "id, strength_label, description, evidence_episode_ids, reproducibility, \
     evaluated_context, confidence, status, source, created_by, source_ai_run_id, \
     created_at, updated_at";

// ──────────────────────────────────────────────
// create_skill_evidence_manual
// ──────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateManualEvidenceArgs {
    pub strength_label: String,
    pub description: String,
    pub evidence_episode_ids: Vec<String>,
    pub reproducibility: Option<String>,
    pub evaluated_context: Option<String>,
    pub confidence: Option<String>,
}

#[tauri::command]
pub fn create_skill_evidence_manual(
    db: State<'_, Mutex<Connection>>,
    args: CreateManualEvidenceArgs,
) -> Result<SkillEvidenceRow, String> {
    if args.strength_label.trim().is_empty() {
        return Err("強みのラベルは必須です".to_string());
    }
    if args.description.trim().is_empty() {
        return Err("説明は必須です".to_string());
    }
    let confidence = args.confidence.unwrap_or_else(|| "medium".to_string());
    if !matches!(confidence.as_str(), "low" | "medium" | "high") {
        return Err(format!("無効な confidence: {confidence}"));
    }

    let id = Ulid::new().to_string();
    let now = chrono_now();
    let evidence_ids_json =
        serde_json::to_string(&args.evidence_episode_ids).map_err(|e| e.to_string())?;
    let reproducibility = args.reproducibility.unwrap_or_default();
    let evaluated_context = args.evaluated_context.unwrap_or_default();

    {
        let conn = db.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO skill_evidence \
             (id, strength_label, description, evidence_episode_ids, reproducibility, \
              evaluated_context, confidence, status, source, created_by, source_ai_run_id, \
              created_at, updated_at) \
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)",
            rusqlite::params![
                id,
                args.strength_label.trim(),
                args.description.trim(),
                evidence_ids_json,
                reproducibility,
                evaluated_context,
                confidence,
                "accepted",
                "manual",
                "human",
                None::<String>,
                now,
                now,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(SkillEvidenceRow {
        id,
        strength_label: args.strength_label.trim().to_string(),
        description: args.description.trim().to_string(),
        evidence_episode_ids: args.evidence_episode_ids,
        reproducibility,
        evaluated_context,
        confidence,
        status: "accepted".to_string(),
        source: "manual".to_string(),
        created_by: "human".to_string(),
        source_ai_run_id: None,
        created_at: now.clone(),
        updated_at: now,
    })
}

// ──────────────────────────────────────────────
// list_skill_evidence
// ──────────────────────────────────────────────

#[tauri::command]
pub fn list_skill_evidence(
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<SkillEvidenceRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT {EVIDENCE_COLUMNS} FROM skill_evidence ORDER BY created_at DESC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], evidence_from_row)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

// ──────────────────────────────────────────────
// update_skill_evidence_status
// ──────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateEvidenceStatusArgs {
    pub id: String,
    pub status: String,
}

#[tauri::command]
pub fn update_skill_evidence_status(
    db: State<'_, Mutex<Connection>>,
    args: UpdateEvidenceStatusArgs,
) -> Result<SkillEvidenceRow, String> {
    let valid = matches!(args.status.as_str(), "candidate" | "accepted" | "rejected");
    if !valid {
        return Err(format!("無効なステータス: {}", args.status));
    }

    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = chrono_now();

    let affected = conn
        .execute(
            "UPDATE skill_evidence SET status = ?1, updated_at = ?2 WHERE id = ?3",
            rusqlite::params![args.status, now, args.id],
        )
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err(format!("SkillEvidence が見つかりません: {}", args.id));
    }

    let sql = format!(
        "SELECT {EVIDENCE_COLUMNS} FROM skill_evidence WHERE id = ?1"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query_map(rusqlite::params![args.id], evidence_from_row)
        .map_err(|e| e.to_string())?;
    match rows.next() {
        Some(r) => r.map_err(|e| e.to_string()),
        None => Err(format!("更新後に SkillEvidence が見つかりません: {}", args.id)),
    }
}

// ──────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────

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
