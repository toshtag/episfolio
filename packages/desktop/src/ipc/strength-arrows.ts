import type { StrengthArrow, StrengthArrowType, StrengthArrowUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type RawStrengthArrowRow = {
  id: string;
  type: string;
  description: string;
  source: string;
  occurredAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

function rowToArrow(row: RawStrengthArrowRow): StrengthArrow {
  return {
    ...row,
    type: row.type as StrengthArrowType,
  };
}

type CreateStrengthArrowArgs = {
  type: StrengthArrowType;
  description?: string;
  source?: string;
  occurredAt?: string | null;
  note?: string | null;
};

export async function createStrengthArrow(args: CreateStrengthArrowArgs): Promise<StrengthArrow> {
  const row = await invoke<RawStrengthArrowRow>('create_strength_arrow', { args });
  return rowToArrow(row);
}

export async function listStrengthArrows(): Promise<StrengthArrow[]> {
  const rows = await invoke<RawStrengthArrowRow[]>('list_strength_arrows');
  return rows.map(rowToArrow);
}

export async function listStrengthArrowsByType(type: StrengthArrowType): Promise<StrengthArrow[]> {
  const rows = await invoke<RawStrengthArrowRow[]>('list_strength_arrows_by_type', {
    arrowType: type,
  });
  return rows.map(rowToArrow);
}

export async function getStrengthArrow(id: string): Promise<StrengthArrow | null> {
  const row = await invoke<RawStrengthArrowRow | null>('get_strength_arrow', { id });
  return row ? rowToArrow(row) : null;
}

export async function updateStrengthArrow(
  id: string,
  patch: StrengthArrowUpdate,
): Promise<StrengthArrow> {
  const row = await invoke<RawStrengthArrowRow>('update_strength_arrow', { id, patch });
  return rowToArrow(row);
}

export async function deleteStrengthArrow(id: string): Promise<void> {
  return invoke<void>('delete_strength_arrow', { id });
}
