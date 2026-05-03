import type {
  BlankType,
  StrengthFromWeakness,
  StrengthFromWeaknessUpdate,
} from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type RawRow = {
  id: string;
  weaknessLabel: string;
  blankType: BlankType | null;
  background: string;
  reframe: string;
  targetCompanyProfile: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

function rowToRecord(row: RawRow): StrengthFromWeakness {
  return row;
}

type CreateArgs = {
  weaknessLabel?: string;
  blankType?: BlankType | null;
  background?: string;
  reframe?: string;
  targetCompanyProfile?: string;
  note?: string | null;
};

export async function createStrengthFromWeakness(args: CreateArgs): Promise<StrengthFromWeakness> {
  const row = await invoke<RawRow>('create_strength_from_weakness', { args });
  return rowToRecord(row);
}

export async function listStrengthFromWeakness(): Promise<StrengthFromWeakness[]> {
  const rows = await invoke<RawRow[]>('list_strength_from_weakness');
  return rows.map(rowToRecord);
}

export async function getStrengthFromWeakness(id: string): Promise<StrengthFromWeakness | null> {
  const row = await invoke<RawRow | null>('get_strength_from_weakness', { id });
  return row ? rowToRecord(row) : null;
}

export async function updateStrengthFromWeakness(
  id: string,
  patch: StrengthFromWeaknessUpdate,
): Promise<StrengthFromWeakness> {
  const row = await invoke<RawRow>('update_strength_from_weakness', { id, patch });
  return rowToRecord(row);
}

export async function deleteStrengthFromWeakness(id: string): Promise<void> {
  return invoke<void>('delete_strength_from_weakness', { id });
}
