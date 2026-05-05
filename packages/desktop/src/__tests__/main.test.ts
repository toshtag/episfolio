import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { backupIfNeeded } from '../ipc/backup.js';
import '../main.js';

vi.mock('../ipc/tauri-ready.js', () => ({
  waitForTauri: vi.fn().mockResolvedValue(true),
}));

vi.mock('../ipc/backup.js', () => ({
  backupIfNeeded: vi.fn(),
}));

const backupIfNeededMock = vi.mocked(backupIfNeeded);

type TestEpisodeApp = HTMLElement & {
  updateComplete: Promise<boolean>;
};

async function mountApp(): Promise<TestEpisodeApp> {
  const el = document.createElement('episode-app') as TestEpisodeApp;
  document.body.appendChild(el);
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
  return el;
}

function buttonByText(el: TestEpisodeApp, selector: string, text: string): HTMLButtonElement {
  const button = Array.from(el.shadowRoot?.querySelectorAll(selector) ?? []).find(
    (node) => node.textContent?.trim() === text,
  );
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`button not found: ${text}`);
  }
  return button;
}

function tabLabels(el: TestEpisodeApp): string[] {
  return Array.from(el.shadowRoot?.querySelectorAll('.tab-nav button') ?? []).map(
    (node) => node.textContent?.trim() ?? '',
  );
}

describe('episode-app', () => {
  beforeEach(() => {
    backupIfNeededMock.mockResolvedValue(false);
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.clearAllMocks();
  });

  it('起動時バックアップが失敗したら画面上に通知する', async () => {
    backupIfNeededMock.mockRejectedValue(new Error('disk full'));
    const el = await mountApp();

    expect(el.shadowRoot?.textContent).toContain('バックアップに失敗しました');
    expect(el.shadowRoot?.textContent).toContain('disk full');
  });

  it('起動時バックアップが成功したら通知を出さない', async () => {
    const el = await mountApp();

    expect(el.shadowRoot?.querySelector('.backup-error')).toBeNull();
  });

  it('カテゴリ選択で表示する機能タブを切り替える', async () => {
    const el = await mountApp();

    expect(tabLabels(el)).toContain('年表');
    expect(tabLabels(el)).not.toContain('給料分析');

    buttonByText(el, '.group-nav button', '企業').click();
    await el.updateComplete;

    expect(tabLabels(el)).toContain('給料分析');
    expect(tabLabels(el)).not.toContain('年表');
  });
});
