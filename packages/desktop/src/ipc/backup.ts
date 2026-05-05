import { invoke } from '@tauri-apps/api/core';
import { waitForTauri } from './tauri-ready.js';

export async function backupIfNeeded(): Promise<boolean> {
  await waitForTauri();
  return invoke<boolean>('backup_if_needed');
}

export async function listBackups(): Promise<string[]> {
  return invoke<string[]>('list_backups');
}

export async function restoreBackup(filename: string): Promise<void> {
  return invoke<void>('restore_backup', { filename });
}
