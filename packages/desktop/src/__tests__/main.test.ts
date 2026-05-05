import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { backupIfNeeded } from '../ipc/backup.js';
import { listEpisodes } from '../ipc/episodes.js';
import '../main.js';

vi.mock('../ipc/backup.js', () => ({
  backupIfNeeded: vi.fn(),
}));

vi.mock('../ipc/episodes.js', () => ({
  createEpisode: vi.fn(),
  listEpisodes: vi.fn(),
}));

const backupIfNeededMock = vi.mocked(backupIfNeeded);
const listEpisodesMock = vi.mocked(listEpisodes);

describe('episode-app', () => {
  beforeEach(() => {
    backupIfNeededMock.mockResolvedValue(false);
    listEpisodesMock.mockResolvedValue([]);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('起動時バックアップが失敗したら画面上に通知する', async () => {
    backupIfNeededMock.mockRejectedValue(new Error('disk full'));
    const el = document.createElement('episode-app') as HTMLElement & {
      updateComplete: Promise<boolean>;
    };

    document.body.appendChild(el);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;

    expect(el.shadowRoot?.textContent).toContain('バックアップに失敗しました');
    expect(el.shadowRoot?.textContent).toContain('disk full');
  });

  it('起動時バックアップが成功したら通知を出さない', async () => {
    const el = document.createElement('episode-app') as HTMLElement & {
      updateComplete: Promise<boolean>;
    };

    document.body.appendChild(el);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;

    expect(el.shadowRoot?.querySelector('.backup-error')).toBeNull();
  });
});
