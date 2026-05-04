import { describe, expect, it } from 'vitest';
import '../settings-view.js';

describe('settings-view', () => {
  it('カスタム要素として登録されている', () => {
    expect(customElements.get('settings-view')).toBeDefined();
  });

  it('DOM にマウントして h2 が描画される', async () => {
    const el = document.createElement('settings-view');
    document.body.appendChild(el);

    // Lit の非同期レンダリングを待つ
    await (el as unknown as { updateComplete: Promise<boolean> }).updateComplete;

    const shadowRoot = el.shadowRoot;
    expect(shadowRoot).not.toBeNull();
    expect(shadowRoot?.querySelector('h2')?.textContent?.trim()).toBe('設定');

    document.body.removeChild(el);
  });
});
