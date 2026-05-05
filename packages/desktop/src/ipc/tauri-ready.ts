type TauriWindow = Window & { __TAURI_INTERNALS__?: unknown };

/**
 * Tauri IPC ブリッジが確立されるまで待機する。
 * Tauri webview は HTML パース直後に JS を実行するため、
 * __TAURI_INTERNALS__ の注入が完了する前に invoke が呼ばれることがある。
 * 最大 2 秒・10ms 間隔でポーリングし、タイムアウトしたらそのまま返す
 * （非 Tauri 環境ではすぐに諦める）。
 */
export async function waitForTauri(): Promise<void> {
  if (typeof window === 'undefined') return;
  const win = window as TauriWindow;
  if (win.__TAURI_INTERNALS__) return;

  await new Promise<void>((resolve) => {
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 10;
      if (win.__TAURI_INTERNALS__ || elapsed >= 2000) {
        clearInterval(interval);
        resolve();
      }
    }, 10);
  });
}
