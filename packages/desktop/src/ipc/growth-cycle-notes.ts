import type { GrowthCycleNote, GrowthCycleNoteUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type RawRow = {
  id: string;
  jobTargetId: string;
  growthStage: string | null;
  stageNote: string | null;
  isLongTermSuitable: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

function rowToRecord(row: RawRow): GrowthCycleNote {
  return {
    ...row,
    growthStage: (row.growthStage as GrowthCycleNote['growthStage']) ?? null,
  };
}

type CreateArgs = {
  jobTargetId: string;
  growthStage?: string | null;
  stageNote?: string | null;
  isLongTermSuitable?: boolean;
  note?: string | null;
};

export async function createGrowthCycleNote(args: CreateArgs): Promise<GrowthCycleNote> {
  const row = await invoke<RawRow>('create_growth_cycle_note', { args });
  return rowToRecord(row);
}

export async function listGrowthCycleNotesByJobTarget(
  jobTargetId: string,
): Promise<GrowthCycleNote[]> {
  const rows = await invoke<RawRow[]>('list_growth_cycle_notes_by_job_target', { jobTargetId });
  return rows.map(rowToRecord);
}

export async function getGrowthCycleNote(id: string): Promise<GrowthCycleNote | null> {
  const row = await invoke<RawRow | null>('get_growth_cycle_note', { id });
  return row ? rowToRecord(row) : null;
}

export async function updateGrowthCycleNote(
  id: string,
  patch: GrowthCycleNoteUpdate,
): Promise<GrowthCycleNote> {
  const row = await invoke<RawRow>('update_growth_cycle_note', { id, patch });
  return rowToRecord(row);
}

export async function deleteGrowthCycleNote(id: string): Promise<void> {
  return invoke<void>('delete_growth_cycle_note', { id });
}
