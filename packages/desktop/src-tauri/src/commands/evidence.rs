use keyring::Entry;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Mutex;
use tauri::State;
use ulid::Ulid;

use crate::adapters::openai;
use crate::commands::episodes::{row_from_query, EpisodeRow, SELECT_COLUMNS};

const KEYRING_SERVICE: &str = "io.github.toshtag.episfolio";
const KEYRING_ACCOUNT: &str = "openai-api-key";
const DEFAULT_MODEL: &str = "gpt-4o-mini";

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
        evidence_episode_ids: serde_json::from_str(&ids_json).unwrap_or_default(),
        reproducibility: row.get(4)?,
        evaluated_context: row.get(5)?,
        confidence: row.get(6)?,
        status: row.get(7)?,
        created_by: row.get(8)?,
        source_ai_run_id: row.get(9)?,
        created_at: row.get(10)?,
        updated_at: row.get(11)?,
    })
}

const EVIDENCE_COLUMNS: &str =
    "id, strength_label, description, evidence_episode_ids, reproducibility, \
     evaluated_context, confidence, status, created_by, source_ai_run_id, \
     created_at, updated_at";

// ──────────────────────────────────────────────
// extract_evidence
// ──────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractEvidenceArgs {
    pub episode_ids: Vec<String>,
    pub model: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractEvidenceResult {
    pub evidences: Vec<SkillEvidenceRow>,
    pub ai_run_id: String,
    pub parse_error: Option<String>,
}

#[tauri::command]
pub async fn extract_evidence(
    db: State<'_, Mutex<Connection>>,
    args: ExtractEvidenceArgs,
) -> Result<ExtractEvidenceResult, String> {
    // 1. API key
    let api_key = {
        let entry = Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT).map_err(|e| e.to_string())?;
        entry.get_password().map_err(|e| match e {
            keyring::Error::NoEntry => "API key が未設定です".to_string(),
            other => other.to_string(),
        })?
    };

    let model = args.model.as_deref().unwrap_or(DEFAULT_MODEL).to_string();

    // 2. エピソードを DB から取得
    let episodes: Vec<EpisodeRow> = {
        let conn = db.lock().map_err(|e| e.to_string())?;
        let sql = format!(
            "SELECT {SELECT_COLUMNS} FROM episodes WHERE id IN ({}) ORDER BY created_at DESC",
            args.episode_ids
                .iter()
                .map(|_| "?")
                .collect::<Vec<_>>()
                .join(", ")
        );
        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
        let params: Vec<&dyn rusqlite::ToSql> = args
            .episode_ids
            .iter()
            .map(|id| id as &dyn rusqlite::ToSql)
            .collect();
        let rows = stmt
            .query_map(params.as_slice(), row_from_query)
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        rows
    };

    if episodes.is_empty() {
        return Err("指定されたエピソードが見つかりません".to_string());
    }

    // remoteLLMAllowed チェック（OpenAI はリモート）
    let blocked: Vec<&str> = episodes
        .iter()
        .filter(|ep| !ep.remote_llm_allowed)
        .map(|ep| ep.id.as_str())
        .collect();
    if !blocked.is_empty() {
        return Err(format!(
            "リモート LLM への送信が許可されていないエピソードが含まれています: {}",
            blocked.join(", ")
        ));
    }

    // 3. プロンプト構築
    let (system_prompt, user_prompt) = build_prompt(&episodes);

    // 4. SHA-256 hash（prompt_hash）
    let prompt_hash = sha256_hex(&system_prompt);

    // 5. OpenAI 呼び出し（JSON mode）
    let gen_result = openai::generate(
        &api_key,
        &model,
        Some(&system_prompt),
        &user_prompt,
        true,
    )
    .await?;

    let now = chrono_now();
    let ai_run_id = Ulid::new().to_string();

    // 6. JSON parse
    let (output_parsed, parse_error): (Option<Value>, Option<String>) =
        match serde_json::from_str::<Value>(&gen_result.text) {
            Ok(v) => (Some(v), None),
            Err(e) => (None, Some(e.to_string())),
        };

    // 7. AIRun 保存
    {
        let conn = db.lock().map_err(|e| e.to_string())?;
        let input_refs = serde_json::json!({ "episodeIds": args.episode_ids });
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
                "extract_evidence",
                "extract-evidence-v1",
                "1.0.0",
                prompt_hash,
                None::<String>,           // model_params
                "references_only",
                None::<String>,           // input_snapshot
                input_refs.to_string(),
                gen_result.text,
                output_parsed.as_ref().map(|v| v.to_string()),
                parse_error.clone(),
                token_usage.to_string(),
                None::<f64>,              // cost_estimate_usd
                now,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    if parse_error.is_some() {
        return Ok(ExtractEvidenceResult {
            evidences: vec![],
            ai_run_id,
            parse_error,
        });
    }

    // 8. candidates を SkillEvidence として保存
    let candidates = output_parsed
        .as_ref()
        .and_then(|v| v.get("candidates"))
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    let mut saved: Vec<SkillEvidenceRow> = Vec::new();
    {
        let conn = db.lock().map_err(|e| e.to_string())?;
        for c in &candidates {
            let ev_id = Ulid::new().to_string();
            let strength_label = c
                .get("strengthLabel")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let description = c
                .get("description")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let evidence_ids = c
                .get("evidenceEpisodeIds")
                .and_then(|v| v.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|x| x.as_str())
                        .map(|s| s.to_string())
                        .collect::<Vec<_>>()
                })
                .unwrap_or_default();
            let evidence_ids_json = serde_json::to_string(&evidence_ids).unwrap_or_default();
            let reproducibility = c
                .get("reproducibility")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let evaluated_context = c
                .get("evaluatedContext")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let confidence = c
                .get("confidence")
                .and_then(|v| v.as_str())
                .unwrap_or("medium")
                .to_string();

            conn.execute(
                "INSERT INTO skill_evidence \
                 (id, strength_label, description, evidence_episode_ids, reproducibility, \
                  evaluated_context, confidence, status, created_by, source_ai_run_id, \
                  created_at, updated_at) \
                 VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)",
                rusqlite::params![
                    ev_id,
                    strength_label,
                    description,
                    evidence_ids_json,
                    reproducibility,
                    evaluated_context,
                    confidence,
                    "candidate",
                    "ai",
                    ai_run_id,
                    now,
                    now,
                ],
            )
            .map_err(|e| e.to_string())?;

            saved.push(SkillEvidenceRow {
                id: ev_id,
                strength_label,
                description,
                evidence_episode_ids: evidence_ids,
                reproducibility,
                evaluated_context,
                confidence,
                status: "candidate".to_string(),
                created_by: "ai".to_string(),
                source_ai_run_id: Some(ai_run_id.clone()),
                created_at: now.clone(),
                updated_at: now.clone(),
            });
        }
    }

    Ok(ExtractEvidenceResult {
        evidences: saved,
        ai_run_id,
        parse_error: None,
    })
}

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
              evaluated_context, confidence, status, created_by, source_ai_run_id, \
              created_at, updated_at) \
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)",
            rusqlite::params![
                id,
                args.strength_label.trim(),
                args.description.trim(),
                evidence_ids_json,
                reproducibility,
                evaluated_context,
                confidence,
                "accepted",
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

fn build_prompt(episodes: &[EpisodeRow]) -> (String, String) {
    let episodes_text = episodes
        .iter()
        .enumerate()
        .map(|(i, ep)| {
            format!(
                "### エピソード {}: {} (ID: {})\n\n背景: {}\n課題: {}\n行動: {}\n工夫: {}\n結果: {}\n再現性: {}\n外部評価: {}",
                i + 1,
                ep.title,
                ep.id,
                ep.background,
                ep.problem,
                ep.action,
                ep.ingenuity,
                ep.result,
                ep.reproducibility,
                ep.external_feedback,
            )
        })
        .collect::<Vec<_>>()
        .join("\n\n---\n\n");

    let system_prompt = format!(
        "あなたはキャリアコンサルタントのアシスタントです。\n\
        以下の業務エピソード {} 件から、応募者の再現性のある強み（SkillEvidence）を抽出してください。\n\n\
        ## 業務エピソード\n\n\
        {}\n\n\
        ## 指示\n\n\
        各エピソードを読み、以下の観点で強みの候補を 3〜5 個抽出してください：\n\
        - 繰り返し発揮されているパターンや行動\n\
        - 結果・成果に直結した行動や思考\n\
        - 特定の状況・役割に限らず再現できそうな特性\n\n\
        ## 出力形式\n\n\
        JSON オブジェクトで出力してください。以下の構造を持ちます：\n\n\
        {{\n\
          \"candidates\": [\n\
            {{\n\
              \"strengthLabel\": \"強みのラベル（10〜20文字）\",\n\
              \"description\": \"具体的な説明（2〜3文）\",\n\
              \"evidenceEpisodeIds\": [\"根拠となるエピソードの ID\"],\n\
              \"reproducibility\": \"どんな状況でも再現できるか（1〜2文）\",\n\
              \"evaluatedContext\": \"この強みが評価された文脈（1〜2文）\",\n\
              \"confidence\": \"確信度（low / medium / high のいずれか）\"\n\
            }}\n\
          ]\n\
        }}\n\n\
        JSON 以外のテキストは出力しないでください。",
        episodes.len(),
        episodes_text,
    );

    let user_prompt = format!(
        "上記 {} 件のエピソードから強みの候補を抽出してください。",
        episodes.len()
    );

    (system_prompt, user_prompt)
}

fn sha256_hex(text: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    // 本番は ring/sha2 が理想だが、依存を増やさず DefaultHasher で代替
    // （promptHash は再現性確認用であり暗号強度は不要）
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
