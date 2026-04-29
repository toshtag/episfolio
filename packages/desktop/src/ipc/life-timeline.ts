import type {
  LifeTimelineEntry,
  LifeTimelineEntryUpdate,
} from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

export type CreateLifeTimelineEntryArgs = {
  ageRangeStart: number;
  ageRangeEnd: number;
  yearStart?: number | null;
  yearEnd?: number | null;
  category: string;
  summary: string;
  detail?: string;
  relatedEpisodeIds?: string[];
  tags?: string[];
};

export async function createLifeTimelineEntry(
  args: CreateLifeTimelineEntryArgs,
): Promise<LifeTimelineEntry> {
  return invoke<LifeTimelineEntry>('create_life_timeline_entry', { args });
}

export async function listLifeTimelineEntries(): Promise<LifeTimelineEntry[]> {
  return invoke<LifeTimelineEntry[]>('list_life_timeline_entries');
}

export async function getLifeTimelineEntry(
  id: string,
): Promise<LifeTimelineEntry | null> {
  return invoke<LifeTimelineEntry | null>('get_life_timeline_entry', { id });
}

export async function updateLifeTimelineEntry(
  id: string,
  patch: LifeTimelineEntryUpdate,
): Promise<LifeTimelineEntry> {
  return invoke<LifeTimelineEntry>('update_life_timeline_entry', { id, patch });
}

export async function deleteLifeTimelineEntry(id: string): Promise<void> {
  return invoke<void>('delete_life_timeline_entry', { id });
}
