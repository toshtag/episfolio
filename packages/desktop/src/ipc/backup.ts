import { invoke } from '@tauri-apps/api/core';

type TauriWindow = Window & { __TAURI_INTERNALS__?: unknown };

function isTauriReady(): boolean {
  return typeof window !== 'undefined' && !!(window as TauriWindow).__TAURI_INTERNALS__;
}

export async function backupIfNeeded(): Promise<boolean> {
  if (!isTauriReady()) return false;
  return invoke<boolean>('backup_if_needed');
}

export async function listBackups(): Promise<string[]> {
  return invoke<string[]>('list_backups');
}

export async function restoreBackup(filename: string): Promise<void> {
  return invoke<void>('restore_backup', { filename });
}
