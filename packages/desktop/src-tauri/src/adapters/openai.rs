use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    max_tokens: u32,
}

#[derive(Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
    usage: Usage,
}

#[derive(Deserialize)]
struct Choice {
    message: ResponseMessage,
}

#[derive(Deserialize)]
struct ResponseMessage {
    content: String,
}

#[derive(Deserialize)]
struct Usage {
    prompt_tokens: u32,
    completion_tokens: u32,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateResult {
    pub text: String,
    pub input_tokens: u32,
    pub output_tokens: u32,
}

pub async fn generate(
    api_key: &str,
    model: &str,
    system_prompt: Option<&str>,
    user_prompt: &str,
) -> Result<GenerateResult, String> {
    let client = Client::new();

    let mut messages = Vec::new();
    if let Some(sys) = system_prompt {
        messages.push(ChatMessage {
            role: "system".to_string(),
            content: sys.to_string(),
        });
    }
    messages.push(ChatMessage {
        role: "user".to_string(),
        content: user_prompt.to_string(),
    });

    let request = ChatRequest {
        model: model.to_string(),
        messages,
        max_tokens: 1024,
    };

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&request)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("{status}: {body}"));
    }

    let chat: ChatResponse = response.json().await.map_err(|e| e.to_string())?;
    let text = chat
        .choices
        .into_iter()
        .next()
        .map(|c| c.message.content)
        .unwrap_or_default();

    Ok(GenerateResult {
        text,
        input_tokens: chat.usage.prompt_tokens,
        output_tokens: chat.usage.completion_tokens,
    })
}

pub async fn test_connection(api_key: &str) -> Result<(), String> {
    generate(api_key, "gpt-4o-mini", None, "ping").await?;
    Ok(())
}
