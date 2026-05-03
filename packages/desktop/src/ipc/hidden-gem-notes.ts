import type { HiddenGemNote, HiddenGemNoteUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type RawRow = {
  id: string;
  jobTargetId: string;
  isGntListed: boolean;
  nicheKeywords: string | null;
  hasAntiMonsterMechanism: boolean;
  mechanismNote: string | null;
  isHiringOnJobSites: boolean;
  directContactNote: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

function rowToRecord(row: RawRow): HiddenGemNote {
  return { ...row };
}

type CreateArgs = {
  jobTargetId: string;
  isGntListed?: boolean;
  nicheKeywords?: string | null;
  hasAntiMonsterMechanism?: boolean;
  mechanismNote?: string | null;
  isHiringOnJobSites?: boolean;
  directContactNote?: string | null;
  note?: string | null;
};

export async function createHiddenGemNote(args: CreateArgs): Promise<HiddenGemNote> {
  const row = await invoke<RawRow>('create_hidden_gem_note', { args });
  return rowToRecord(row);
}

export async function listHiddenGemNotesByJobTarget(jobTargetId: string): Promise<HiddenGemNote[]> {
  const rows = await invoke<RawRow[]>('list_hidden_gem_notes_by_job_target', { jobTargetId });
  return rows.map(rowToRecord);
}

export async function getHiddenGemNote(id: string): Promise<HiddenGemNote | null> {
  const row = await invoke<RawRow | null>('get_hidden_gem_note', { id });
  return row ? rowToRecord(row) : null;
}

export async function updateHiddenGemNote(
  id: string,
  patch: HiddenGemNoteUpdate,
): Promise<HiddenGemNote> {
  const row = await invoke<RawRow>('update_hidden_gem_note', { id, patch });
  return rowToRecord(row);
}

export async function deleteHiddenGemNote(id: string): Promise<void> {
  return invoke<void>('delete_hidden_gem_note', { id });
}
