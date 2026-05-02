import type {
  SubordinateRow,
  SubordinateSummary,
  SubordinateSummaryUpdate,
} from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type RawSubordinateSummaryRow = {
  id: string;
  title: string;
  subordinates: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

function parseSubordinates(json: string): SubordinateRow[] {
  try {
    return JSON.parse(json) as SubordinateRow[];
  } catch {
    return [];
  }
}

function rowToSummary(row: RawSubordinateSummaryRow): SubordinateSummary {
  return {
    ...row,
    subordinates: parseSubordinates(row.subordinates),
  };
}

type CreateSubordinateSummaryArgs = {
  title?: string;
  subordinates?: SubordinateRow[];
  memo?: string;
};

type RawCreateArgs = Omit<CreateSubordinateSummaryArgs, 'subordinates'> & {
  subordinates?: string;
};

type RawUpdatePatch = Omit<SubordinateSummaryUpdate, 'subordinates'> & {
  subordinates?: string;
};

export async function createSubordinateSummary(
  args: CreateSubordinateSummaryArgs,
): Promise<SubordinateSummary> {
  const { subordinates, ...rest } = args;
  const raw: RawCreateArgs = { ...rest };
  if (subordinates !== undefined) raw.subordinates = JSON.stringify(subordinates);
  const row = await invoke<RawSubordinateSummaryRow>('create_subordinate_summary', { args: raw });
  return rowToSummary(row);
}

export async function listSubordinateSummaries(): Promise<SubordinateSummary[]> {
  const rows = await invoke<RawSubordinateSummaryRow[]>('list_subordinate_summaries');
  return rows.map(rowToSummary);
}

export async function getSubordinateSummary(id: string): Promise<SubordinateSummary | null> {
  const row = await invoke<RawSubordinateSummaryRow | null>('get_subordinate_summary', { id });
  return row ? rowToSummary(row) : null;
}

export async function updateSubordinateSummary(
  id: string,
  patch: SubordinateSummaryUpdate,
): Promise<SubordinateSummary> {
  const { subordinates, ...rest } = patch;
  const raw: RawUpdatePatch = { ...rest };
  if (subordinates !== undefined) raw.subordinates = JSON.stringify(subordinates);
  const row = await invoke<RawSubordinateSummaryRow>('update_subordinate_summary', {
    id,
    patch: raw,
  });
  return rowToSummary(row);
}

export async function deleteSubordinateSummary(id: string): Promise<void> {
  return invoke<void>('delete_subordinate_summary', { id });
}
