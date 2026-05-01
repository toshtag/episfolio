use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

// ──────────────────────────────────────────────
// Row types
// ──────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CareerDocumentRow {
    pub id: String,
    pub title: String,
    pub job_target: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DocumentRevisionRow {
    pub id: String,
    pub document_id: String,
    pub content: String,
    pub source_evidence_ids: Vec<String>,
    pub source_ai_run_id: Option<String>,
    pub created_by: String,
    pub revision_reason: String,
    pub target_memo: String,
    pub previous_revision_id: Option<String>,
    pub created_at: String,
}

fn doc_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<CareerDocumentRow> {
    Ok(CareerDocumentRow {
        id: row.get(0)?,
        title: row.get(1)?,
        job_target: row.get(2)?,
        status: row.get(3)?,
        created_at: row.get(4)?,
        updated_at: row.get(5)?,
    })
}

fn revision_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<DocumentRevisionRow> {
    let ids_json: String = row.get(3)?;
    Ok(DocumentRevisionRow {
        id: row.get(0)?,
        document_id: row.get(1)?,
        content: row.get(2)?,
        source_evidence_ids: serde_json::from_str(&ids_json).unwrap_or_default(),
        source_ai_run_id: row.get(4)?,
        created_by: row.get(5)?,
        revision_reason: row.get(6).unwrap_or_default(),
        target_memo: row.get(7).unwrap_or_default(),
        previous_revision_id: row.get(8).unwrap_or(None),
        created_at: row.get(9)?,
    })
}

// ──────────────────────────────────────────────
// list_documents
// ──────────────────────────────────────────────

#[tauri::command]
pub fn list_documents(
    db: State<'_, Mutex<Connection>>,
) -> Result<Vec<CareerDocumentRow>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, title, job_target, status, created_at, updated_at \
             FROM career_documents ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], doc_from_row)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

// ──────────────────────────────────────────────
// get_document
// ──────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetDocumentArgs {
    pub document_id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetDocumentResult {
    pub document: CareerDocumentRow,
    pub revisions: Vec<DocumentRevisionRow>,
}

#[tauri::command]
pub fn get_document(
    db: State<'_, Mutex<Connection>>,
    args: GetDocumentArgs,
) -> Result<GetDocumentResult, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, title, job_target, status, created_at, updated_at \
             FROM career_documents WHERE id = ?1",
        )
        .map_err(|e| e.to_string())?;
    let doc = stmt
        .query_row(rusqlite::params![args.document_id], doc_from_row)
        .map_err(|_| format!("ドキュメントが見つかりません: {}", args.document_id))?;

    let mut stmt2 = conn
        .prepare(
            "SELECT id, document_id, content, source_evidence_ids, source_ai_run_id, \
             created_by, revision_reason, target_memo, previous_revision_id, created_at \
             FROM document_revisions WHERE document_id = ?1 ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let revisions = stmt2
        .query_map(rusqlite::params![args.document_id], revision_from_row)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(GetDocumentResult { document: doc, revisions })
}

// ──────────────────────────────────────────────
// create_document_manual
// ──────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDocumentManualArgs {
    pub title: String,
    pub template: String,
    pub content: String,
    pub source_evidence_ids: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDocumentManualResult {
    pub document: CareerDocumentRow,
    pub revision: DocumentRevisionRow,
}

#[tauri::command]
pub fn create_document_manual(
    db: State<'_, Mutex<Connection>>,
    args: CreateDocumentManualArgs,
) -> Result<CreateDocumentManualResult, String> {
    let now = chrono_now();
    let doc_id = Ulid::new().to_string();
    let rev_id = Ulid::new().to_string();
    let title = args.title.trim().to_string();
    if title.is_empty() {
        return Err("タイトルは必須です".to_string());
    }
    let content = if args.content.is_empty() {
        template_content(&args.template)
    } else {
        args.content.clone()
    };
    let doc = save_document(&db, &doc_id, &title, "", &now)?;
    let ids_json = serde_json::to_string(&args.source_evidence_ids).unwrap_or_default();
    let rev = {
        let conn = db.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO document_revisions \
             (id, document_id, content, source_evidence_ids, source_ai_run_id, created_by, created_at) \
             VALUES (?1, ?2, ?3, ?4, NULL, 'human', ?5)",
            rusqlite::params![rev_id, doc_id, content, ids_json, now],
        )
        .map_err(|e| e.to_string())?;
        DocumentRevisionRow {
            id: rev_id,
            document_id: doc_id.clone(),
            content,
            source_evidence_ids: args.source_evidence_ids,
            source_ai_run_id: None,
            created_by: "human".to_string(),
            revision_reason: String::new(),
            target_memo: String::new(),
            previous_revision_id: None,
            created_at: now,
        }
    };
    Ok(CreateDocumentManualResult { document: doc, revision: rev })
}

fn template_content(template: &str) -> String {
    match template {
        "resume" => "# 職務経歴書\n\n## 職務要約\n\n\n\n## 強み・スキル\n\n\n\n## 職務経歴\n\n".to_string(),
        "skill-summary" => "# スキルサマリー\n\n## 技術スキル\n\n\n\n## ソフトスキル\n\n".to_string(),
        _ => String::new(),
    }
}

// ──────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────

fn save_document(
    db: &State<'_, Mutex<Connection>>,
    id: &str,
    title: &str,
    job_target: &str,
    now: &str,
) -> Result<CareerDocumentRow, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO career_documents (id, title, job_target, status, created_at, updated_at) \
         VALUES (?1, ?2, ?3, 'draft', ?4, ?5)",
        rusqlite::params![id, title, job_target, now, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(CareerDocumentRow {
        id: id.to_string(),
        title: title.to_string(),
        job_target: job_target.to_string(),
        status: "draft".to_string(),
        created_at: now.to_string(),
        updated_at: now.to_string(),
    })
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
