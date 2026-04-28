import { invoke } from '@tauri-apps/api/core';
import type { Episode } from '@episfolio/kernel';

export async function createEpisode(title: string): Promise<Episode> {
  return invoke<Episode>('create_episode', { title });
}

export async function listEpisodes(): Promise<Episode[]> {
  return invoke<Episode[]>('list_episodes');
}
