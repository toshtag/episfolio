import { LitElement, css, html } from 'lit';
import { deleteApiKey, loadApiKey, saveApiKey, testOpenaiConnection } from './ipc/settings.js';

type Status = 'idle' | 'saving' | 'testing' | 'ok' | 'error';

class SettingsView extends LitElement {
  static override properties = {
    apiKey: { state: true },
    hasStoredKey: { state: true },
    status: { state: true },
    message: { state: true },
  };

  declare apiKey: string;
  declare hasStoredKey: boolean;
  declare status: Status;
  declare message: string;

  constructor() {
    super();
    this.apiKey = '';
    this.hasStoredKey = false;
    this.status = 'idle';
    this.message = '';
  }

  static override styles = css`
    :host {
      display: block;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
      color: #1a1a1a;
      max-width: 520px;
    }
    h2 { margin: 0 0 1.5rem; font-size: 1.2rem; }
    .field { margin-bottom: 1rem; }
    label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 0.3rem; }
    input[type="password"], input[type="text"] {
      width: 100%;
      box-sizing: border-box;
      padding: 0.4rem 0.7rem;
      font-size: 0.95rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      font-family: monospace;
    }
    .actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
    button {
      padding: 0.4rem 0.9rem;
      font-size: 0.9rem;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    .btn-primary { background: #1a1a1a; color: #fff; }
    .btn-secondary { background: #e5e5e5; color: #1a1a1a; }
    .btn-danger { background: #c00; color: #fff; }
    button:disabled { opacity: 0.5; cursor: default; }
    .message { margin-top: 0.75rem; font-size: 0.85rem; padding: 0.4rem 0.7rem; border-radius: 0.3rem; }
    .message.ok { background: #e6f4ea; color: #1e7e34; }
    .message.error { background: #fde; color: #c00; }
    .stored-badge {
      display: inline-block;
      font-size: 0.75rem;
      background: #e6f4ea;
      color: #1e7e34;
      padding: 0.15rem 0.5rem;
      border-radius: 0.25rem;
      margin-left: 0.5rem;
      vertical-align: middle;
    }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    try {
      const key = await loadApiKey();
      this.hasStoredKey = key !== null;
    } catch {
      this.hasStoredKey = false;
    }
  }

  private get busy() {
    return this.status === 'saving' || this.status === 'testing';
  }

  private async handleSave() {
    const key = this.apiKey.trim();
    if (!key) return;
    this.status = 'saving';
    this.message = '';
    try {
      await saveApiKey(key);
      this.hasStoredKey = true;
      this.apiKey = '';
      this.status = 'ok';
      this.message = 'API key を保存しました';
    } catch (e) {
      this.status = 'error';
      this.message = String(e);
    }
  }

  private async handleTest() {
    this.status = 'testing';
    this.message = '';
    try {
      await testOpenaiConnection();
      this.status = 'ok';
      this.message = 'OpenAI API への接続に成功しました';
    } catch (e) {
      this.status = 'error';
      this.message = String(e);
    }
  }

  private async handleDelete() {
    this.status = 'saving';
    this.message = '';
    try {
      await deleteApiKey();
      this.hasStoredKey = false;
      this.apiKey = '';
      this.status = 'ok';
      this.message = 'API key を削除しました';
    } catch (e) {
      this.status = 'error';
      this.message = String(e);
    }
  }

  override render() {
    return html`
      <h2>
        Settings
        ${this.hasStoredKey ? html`<span class="stored-badge">API key 設定済み</span>` : ''}
      </h2>

      <div class="field">
        <label>OpenAI API key</label>
        <input
          type="password"
          .value=${this.apiKey}
          @input=${(e: Event) => { this.apiKey = (e.target as HTMLInputElement).value; }}
          placeholder="${this.hasStoredKey ? '新しい key で上書きする場合は入力' : 'sk-...'}"
          ?disabled=${this.busy}
        />
      </div>

      <div class="actions">
        <button
          class="btn-primary"
          @click=${this.handleSave}
          ?disabled=${this.busy || !this.apiKey.trim()}
        >
          ${this.status === 'saving' ? '保存中...' : '保存'}
        </button>
        <button
          class="btn-secondary"
          @click=${this.handleTest}
          ?disabled=${this.busy || !this.hasStoredKey}
        >
          ${this.status === 'testing' ? '確認中...' : '接続テスト'}
        </button>
        ${this.hasStoredKey ? html`
          <button
            class="btn-danger"
            @click=${this.handleDelete}
            ?disabled=${this.busy}
          >
            削除
          </button>
        ` : ''}
      </div>

      ${this.message ? html`
        <div class="message ${this.status === 'ok' ? 'ok' : 'error'}">
          ${this.message}
        </div>
      ` : ''}
    `;
  }
}

customElements.define('settings-view', SettingsView);
