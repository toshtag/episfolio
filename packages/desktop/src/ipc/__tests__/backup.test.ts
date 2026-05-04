import { invoke } from '@tauri-apps/api/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { backupIfNeeded, listBackups, restoreBackup } from '../backup.js';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const invokeMock = vi.mocked(invoke);

describe('backup ipc', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('backupIfNeeded は command 名だけで呼び出す', async () => {
    invokeMock.mockResolvedValue(true);

    await expect(backupIfNeeded()).resolves.toBe(true);
    expect(invokeMock).toHaveBeenCalledWith('backup_if_needed');
  });

  it('listBackups は command 名だけで呼び出す', async () => {
    const backups = ['episfolio-2026-05-04.db'];
    invokeMock.mockResolvedValue(backups);

    await expect(listBackups()).resolves.toBe(backups);
    expect(invokeMock).toHaveBeenCalledWith('list_backups');
  });

  it('restoreBackup は filename payload を渡す', async () => {
    invokeMock.mockResolvedValue(undefined);

    await expect(restoreBackup('episfolio-2026-05-04.db')).resolves.toBeUndefined();
    expect(invokeMock).toHaveBeenCalledWith('restore_backup', {
      filename: 'episfolio-2026-05-04.db',
    });
  });
});
