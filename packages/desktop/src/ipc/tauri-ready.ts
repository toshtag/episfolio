type TauriWindow = Window & { __TAURI_INTERNALS__?: unknown };

function getTauriWindow(): TauriWindow | null {
  if (typeof window === 'undefined') return null;
  return window as TauriWindow;
}

/**
 * Tauri IPC ブリッジが確立されているかどうかを返す。
 * ブラウザ直起動（pnpm dev）では false になる。
 */
export function isTauriEnv(): boolean {
  return !!getTauriWindow()?.__TAURI_INTERNALS__;
}

/**
 * Tauri IPC ブリッジが確立されるまで待機する。
 * 最大 2 秒・10ms 間隔でポーリングし、タイムアウトしたら false を返す。
 * 非 Tauri 環境（ブラウザ直起動）では即 false を返す。
 */
export async function waitForTauri(): Promise<boolean> {
  const win = getTauriWindow();
  if (!win) return false;
  if (win.__TAURI_INTERNALS__) return true;

  return new Promise<boolean>((resolve) => {
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 10;
      if (win.__TAURI_INTERNALS__) {
        clearInterval(interval);
        resolve(true);
      } else if (elapsed >= 2000) {
        clearInterval(interval);
        resolve(false);
      }
    }, 10);
  });
}
