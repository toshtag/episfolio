import type { ResultByType, ResultByTypeUpdate, ResultEntry } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type RawResultByTypeRow = {
  id: string;
  title: string;
  entries: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

function parseEntries(json: string): ResultEntry[] {
  try {
    return JSON.parse(json) as ResultEntry[];
  } catch {
    return [];
  }
}

function rowToResult(row: RawResultByTypeRow): ResultByType {
  return {
    ...row,
    entries: parseEntries(row.entries),
  };
}

type CreateResultByTypeArgs = {
  title?: string;
  entries?: ResultEntry[];
  memo?: string;
};

type RawCreateArgs = Omit<CreateResultByTypeArgs, 'entries'> & {
  entries?: string;
};

type RawUpdatePatch = Omit<ResultByTypeUpdate, 'entries'> & {
  entries?: string;
};

export async function createResultByType(args: CreateResultByTypeArgs): Promise<ResultByType> {
  const { entries, ...rest } = args;
  const raw: RawCreateArgs = { ...rest };
  if (entries !== undefined) raw.entries = JSON.stringify(entries);
  const row = await invoke<RawResultByTypeRow>('create_result_by_type', { args: raw });
  return rowToResult(row);
}

export async function listResultByType(): Promise<ResultByType[]> {
  const rows = await invoke<RawResultByTypeRow[]>('list_result_by_type');
  return rows.map(rowToResult);
}

export async function getResultByType(id: string): Promise<ResultByType | null> {
  const row = await invoke<RawResultByTypeRow | null>('get_result_by_type', { id });
  return row ? rowToResult(row) : null;
}

export async function updateResultByType(
  id: string,
  patch: ResultByTypeUpdate,
): Promise<ResultByType> {
  const { entries, ...rest } = patch;
  const raw: RawUpdatePatch = { ...rest };
  if (entries !== undefined) raw.entries = JSON.stringify(entries);
  const row = await invoke<RawResultByTypeRow>('update_result_by_type', { id, patch: raw });
  return rowToResult(row);
}

export async function deleteResultByType(id: string): Promise<void> {
  return invoke<void>('delete_result_by_type', { id });
}
