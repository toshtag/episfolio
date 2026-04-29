import { css, html, LitElement } from 'lit';

class SettingsView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
      color: #1a1a1a;
      max-width: 520px;
    }
    h2 { margin: 0 0 1.5rem; font-size: 1.2rem; }
    .notice {
      font-size: 0.9rem;
      color: #555;
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 1rem 1.25rem;
    }
  `;

  override render() {
    // hidden in v0.1 — see ADR-0007. v0.2 で再設計予定
    return html`
      <h2>Settings</h2>
      <p class="notice">設定項目はありません（v0.2 で復活予定）</p>
    `;
  }
}

customElements.define('settings-view', SettingsView);
