use keyring::Entry;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

use crate::adapters::openai;
use crate::commands::evidence::{list_skill_evidence, SkillEvidenceRow};

const KEYRING_SERVICE: &str = "io.github.toshtag.episfolio";
const KEYRING_ACCOUNT: &str = "openai-api-key";
const DEFAULT_MODEL: &str = "gpt-4o-mini";

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
        created_at: row.get(6)?,
    })
}

// ──────────────────────────────────────────────
// generate_document
// ──────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateDocumentArgs {
    pub evidence_ids: Vec<String>,
    pub job_target: String,
    pub model: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateDocumentResult {
    pub document: CareerDocumentRow,
    pub revision: DocumentRevisionRow,
}

#[tauri::command]
pub async fn generate_document(
    db: State<'_, Mutex<Connection>>,
    args: GenerateDocumentArgs,
) -> Result<GenerateDocumentResult, String> {
    let now = chrono_now();
    let doc_id = Ulid::new().to_string();
    let rev_id = Ulid::new().to_string();
    let job_target = args.job_target.trim().to_string();
    let title = format!("{} 職務経歴書", job_target);

    // accepted SkillEvidence を DB から取得
    let all_evidences: Vec<SkillEvidenceRow> = list_skill_evidence(db.clone())?;
    let evidences: Vec<&SkillEvidenceRow> = if args.evidence_ids.is_empty() {
        all_evidences
            .iter()
            .filter(|ev| ev.status == "accepted")
            .collect()
    } else {
        all_evidences
            .iter()
            .filter(|ev| args.evidence_ids.contains(&ev.id))
            .collect()
    };

    // エビデンスが 0 件の場合: 空ドキュメントを保存して返す
    if evidences.is_empty() {
        let doc = save_document(&db, &doc_id, &title, &job_target, &now)?;
        let rev = save_revision(
            &db,
            &rev_id,
            &doc_id,
            "",
            &[],
            None,
            &now,
        )?;
        return Ok(GenerateDocumentResult {
            document: doc,
            revision: rev,
        });
    }

    // API key
    let api_key = {
        let entry = Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT).map_err(|e| e.to_string())?;
        entry.get_password().map_err(|e| match e {
            keyring::Error::NoEntry => "API key が未設定です".to_string(),
            other => other.to_string(),
        })?
    };

    let model = args.model.as_deref().unwrap_or(DEFAULT_MODEL).to_string();

    // プロンプト構築
    let (system_prompt, user_prompt) = build_prompt(&evidences, &job_target);
    let prompt_hash = sha256_hex(&system_prompt);

    // OpenAI 呼び出し
    let gen_result = openai::generate(&api_key, &model, Some(&system_prompt), &user_prompt, true)
        .await?;

    // JSON parse
    let (output_parsed, parse_error): (Option<Value>, Option<String>) =
        match serde_json::from_str::<Value>(&gen_result.text) {
            Ok(v) => (Some(v), None),
            Err(e) => (None, Some(e.to_string())),
        };

    // AIRun 保存
    let ai_run_id = Ulid::new().to_string();
    {
        let conn = db.lock().map_err(|e| e.to_string())?;
        let evidence_ids_val: Vec<String> = evidences.iter().map(|ev| ev.id.clone()).collect();
        let input_refs = serde_json::json!({ "evidenceIds": evidence_ids_val });
        let token_usage = serde_json::json!({
            "input": gen_result.input_tokens,
            "output": gen_result.output_tokens,
            "total": gen_result.total_tokens,
        });
        conn.execute(
            "INSERT INTO ai_runs \
             (id, provider, model, purpose, prompt_id, prompt_version, prompt_hash, \
              model_params, input_snapshot_mode, input_snapshot, input_references, \
              output_raw, output_parsed, parse_error, token_usage, cost_estimate_usd, created_at) \
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17)",
            rusqlite::params![
                ai_run_id,
                "openai",
                gen_result.model_used,
                "generate_document",
                "generate-document-v1",
                "1.0.0",
                prompt_hash,
                None::<String>,
                "references_only",
                None::<String>,
                input_refs.to_string(),
                gen_result.text,
                output_parsed.as_ref().map(|v| v.to_string()),
                parse_error.clone(),
                token_usage.to_string(),
                None::<f64>,
                now,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    // Markdown 組み立て
    let content = match &output_parsed {
        Some(v) if parse_error.is_none() => build_markdown(v),
        _ => String::new(),
    };

    let source_ids: Vec<String> = evidences.iter().map(|ev| ev.id.clone()).collect();

    let doc = save_document(&db, &doc_id, &title, &job_target, &now)?;
    let rev = save_revision(
        &db,
        &rev_id,
        &doc_id,
        &content,
        &source_ids,
        Some(&ai_run_id),
        &now,
    )?;

    Ok(GenerateDocumentResult {
        document: doc,
        revision: rev,
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
             created_by, created_at \
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

fn save_revision(
    db: &State<'_, Mutex<Connection>>,
    id: &str,
    document_id: &str,
    content: &str,
    source_evidence_ids: &[String],
    source_ai_run_id: Option<&str>,
    now: &str,
) -> Result<DocumentRevisionRow, String> {
    let ids_json = serde_json::to_string(source_evidence_ids).unwrap_or_default();
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO document_revisions \
         (id, document_id, content, source_evidence_ids, source_ai_run_id, created_by, created_at) \
         VALUES (?1, ?2, ?3, ?4, ?5, 'ai', ?6)",
        rusqlite::params![id, document_id, content, ids_json, source_ai_run_id, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(DocumentRevisionRow {
        id: id.to_string(),
        document_id: document_id.to_string(),
        content: content.to_string(),
        source_evidence_ids: source_evidence_ids.to_vec(),
        source_ai_run_id: source_ai_run_id.map(|s| s.to_string()),
        created_by: "ai".to_string(),
        created_at: now.to_string(),
    })
}

fn build_prompt(evidences: &[&SkillEvidenceRow], job_target: &str) -> (String, String) {
    let evidences_text = evidences
        .iter()
        .enumerate()
        .map(|(i, ev)| {
            format!(
                "### エビデンス {}: {} (ID: {})\n\n説明: {}\n再現性: {}\n評価文脈: {}\n確信度: {}",
                i + 1,
                ev.strength_label,
                ev.id,
                ev.description,
                ev.reproducibility,
                ev.evaluated_context,
                ev.confidence,
            )
        })
        .collect::<Vec<_>>()
        .join("\n\n---\n\n");

    let system_prompt = format!(
        "あなたはキャリアコンサルタントのアシスタントです。\n\
        以下の強みエビデンス {} 件をもとに、「{}」向けの職務経歴書の強みセクション草稿を生成してください。\n\n\
        ## 強みエビデンス\n\n\
        {}\n\n\
        ## 指示\n\n\
        - 各エビデンスの strengthLabel・description・reproducibility・evaluatedContext を活用してください\n\
        - 読み手（採用担当者）に伝わる自然な日本語で記述してください\n\
        - 強みを 3〜5 項目にまとめ、各項目に見出しと説明文（2〜4文）を付けてください\n\
        - 事実から外れた誇張や推測は一切行わないでください\n\n\
        ## 出力形式\n\n\
        JSON オブジェクトで出力してください。以下の構造を持ちます：\n\n\
        {{\n\
          \"sections\": [\n\
            {{\n\
              \"heading\": \"強みの見出し（15文字以内）\",\n\
              \"body\": \"説明文（2〜4文）\",\n\
              \"evidenceIds\": [\"根拠となる SkillEvidence の ID\"]\n\
            }}\n\
          ],\n\
          \"summary\": \"全体の強みを 1〜2 文でまとめた文章\"\n\
        }}\n\n\
        JSON 以外のテキストは出力しないでください。",
        evidences.len(),
        job_target,
        evidences_text,
    );

    let user_prompt = format!(
        "上記 {} 件のエビデンスをもとに、「{}」向けの職務経歴書強みセクションを生成してください。",
        evidences.len(),
        job_target,
    );

    (system_prompt, user_prompt)
}

fn build_markdown(v: &Value) -> String {
    let sections = v
        .get("sections")
        .and_then(|s| s.as_array())
        .map(|arr| {
            arr.iter()
                .map(|s| {
                    let heading = s.get("heading").and_then(|h| h.as_str()).unwrap_or("");
                    let body = s.get("body").and_then(|b| b.as_str()).unwrap_or("");
                    format!("## {}\n\n{}", heading, body)
                })
                .collect::<Vec<_>>()
                .join("\n\n")
        })
        .unwrap_or_default();

    let summary = v
        .get("summary")
        .and_then(|s| s.as_str())
        .unwrap_or("");

    if summary.is_empty() {
        sections
    } else {
        format!("{}\n\n---\n\n{}", sections, summary)
    }
}

fn sha256_hex(text: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut h = DefaultHasher::new();
    text.hash(&mut h);
    format!("{:016x}", h.finish())
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
