import { invoke } from '@tauri-apps/api/core';

export async function saveApiKey(apiKey: string): Promise<void> {
  return invoke('save_api_key', { apiKey });
}

export async function loadApiKey(): Promise<string | null> {
  return invoke<string | null>('load_api_key');
}

export async function deleteApiKey(): Promise<void> {
  return invoke('delete_api_key');
}

export async function testOpenaiConnection(): Promise<void> {
  return invoke('test_openai_connection');
}
