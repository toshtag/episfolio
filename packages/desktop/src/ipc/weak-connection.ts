import type {
  ContactStatus,
  WeakConnection,
  WeakConnectionCategory,
  WeakConnectionUpdate,
} from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type RawRow = {
  id: string;
  name: string;
  category: string;
  relation: string;
  contactStatus: string;
  prospectNote: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

function rowToRecord(row: RawRow): WeakConnection {
  return {
    ...row,
    category: row.category as WeakConnectionCategory,
    contactStatus: row.contactStatus as ContactStatus,
  };
}

type CreateArgs = {
  name?: string;
  category?: WeakConnectionCategory;
  relation?: string;
  contactStatus?: ContactStatus;
  prospectNote?: string;
  note?: string | null;
};

export async function createWeakConnection(args: CreateArgs): Promise<WeakConnection> {
  const row = await invoke<RawRow>('create_weak_connection', { args });
  return rowToRecord(row);
}

export async function listWeakConnection(): Promise<WeakConnection[]> {
  const rows = await invoke<RawRow[]>('list_weak_connection');
  return rows.map(rowToRecord);
}

export async function getWeakConnection(id: string): Promise<WeakConnection | null> {
  const row = await invoke<RawRow | null>('get_weak_connection', { id });
  return row ? rowToRecord(row) : null;
}

export async function updateWeakConnection(
  id: string,
  patch: WeakConnectionUpdate,
): Promise<WeakConnection> {
  const row = await invoke<RawRow>('update_weak_connection', { id, patch });
  return rowToRecord(row);
}

export async function deleteWeakConnection(id: string): Promise<void> {
  return invoke<void>('delete_weak_connection', { id });
}
