import type { Episode, EpisodeUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

export async function createEpisode(title: string): Promise<Episode> {
  return invoke<Episode>('create_episode', { title });
}

export async function listEpisodes(): Promise<Episode[]> {
  return invoke<Episode[]>('list_episodes');
}

export async function getEpisode(id: string): Promise<Episode | null> {
  return invoke<Episode | null>('get_episode', { id });
}

export async function updateEpisode(id: string, patch: EpisodeUpdate): Promise<Episode> {
  return invoke<Episode>('update_episode', { id, patch });
}

export async function deleteEpisode(id: string): Promise<void> {
  return invoke<void>('delete_episode', { id });
}
