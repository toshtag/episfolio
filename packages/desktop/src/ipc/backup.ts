import { invoke } from '@tauri-apps/api/core';

export async function backupIfNeeded(): Promise<boolean> {
  return invoke<boolean>('backup_if_needed');
}
