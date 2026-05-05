import { css, html, LitElement } from 'lit';
import { listBackups, restoreBackup } from './ipc/backup.js';

class SettingsView extends LitElement {
  static override properties = {
    backups: { state: true },
    selected: { state: true },
    loading: { state: true },
    restoring: { state: true },
    error: { state: true },
    successMsg: { state: true },
    confirmTarget: { state: true },
  };

  declare backups: string[];
  declare selected: string;
  declare loading: boolean;
  declare restoring: boolean;
  declare error: string;
  declare successMsg: string;
  declare confirmTarget: string;

  constructor() {
    super();
    this.backups = [];
    this.selected = '';
    this.loading = false;
    this.restoring = false;
    this.error = '';
    this.successMsg = '';
    this.confirmTarget = '';
  }

  static override styles = css`
    :host {
      display: block;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
      color: #1a1a1a;
    }
    h2 { margin: 0 0 1.5rem; font-size: 1.2rem; }
    h3 { margin: 0 0 0.75rem; font-size: 1rem; }
    .section {
      background: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .desc {
      font-size: 0.85rem;
      color: #555;
      margin: 0 0 1rem;
    }
    select {
      width: 100%;
      padding: 0.4rem 0.6rem;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      margin-bottom: 0.75rem;
      background: #fff;
    }
    .btn-row { display: flex; gap: 0.5rem; }
    button.restore-btn {
      padding: 0.4rem 1rem;
      font-size: 0.9rem;
      background: #c00;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.restore-btn:disabled { opacity: 0.4; cursor: default; }
    button.cancel-btn {
      padding: 0.4rem 1rem;
      font-size: 0.9rem;
      background: #eee;
      color: #333;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    .confirm-box {
      background: #fff3cd;
      border: 1px solid #e6a817;
      border-radius: 0.3rem;
      padding: 0.8rem 1rem;
      font-size: 0.88rem;
      margin-bottom: 0.75rem;
    }
    .confirm-box strong { display: block; margin-bottom: 0.4rem; }
    .error { color: #c00; font-size: 0.85rem; margin-top: 0.5rem; }
    .success { color: #197a45; font-size: 0.85rem; margin-top: 0.5rem; }
    .empty { font-size: 0.88rem; color: #777; }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    await this.loadBackups();
  }

  private async loadBackups() {
    this.loading = true;
    this.error = '';
    try {
      this.backups = await listBackups();
      const first = this.backups[0];
      if (first !== undefined) {
        this.selected = first;
      }
    } catch (e) {
      this.error = String(e);
    } finally {
      this.loading = false;
    }
  }

  private handleSelect(e: Event) {
    this.selected = (e.target as HTMLSelectElement).value;
    this.confirmTarget = '';
    this.successMsg = '';
    this.error = '';
  }

  private handleRestoreClick() {
    if (!this.selected) return;
    this.confirmTarget = this.selected;
    this.error = '';
    this.successMsg = '';
  }

  private handleCancel() {
    this.confirmTarget = '';
  }

  private async handleConfirm() {
    if (!this.confirmTarget) return;
    this.restoring = true;
    this.error = '';
    try {
      await restoreBackup(this.confirmTarget);
      this.successMsg = `${this.confirmTarget} を復元しました。アプリを再起動してください。`;
      this.confirmTarget = '';
    } catch (e) {
      this.error = `復元に失敗しました: ${String(e)}`;
      this.confirmTarget = '';
    } finally {
      this.restoring = false;
    }
  }

  override render() {
    return html`
      <h2>設定</h2>

      <div class="section">
        <h3>バックアップから復元</h3>
        <p class="desc">
          アプリ起動時に日次で自動バックアップが作成されます（最大 7 世代）。<br>
          復元後はアプリを再起動してください。
        </p>

        ${
          this.loading
            ? html`<p class="empty">読み込み中...</p>`
            : this.backups.length === 0
              ? html`<p class="empty">バックアップがありません。</p>`
              : html`
                <select .value=${this.selected} @change=${this.handleSelect}>
                  ${this.backups.map((name) => html`<option value=${name}>${name}</option>`)}
                </select>

                ${
                  this.confirmTarget
                    ? html`
                      <div class="confirm-box">
                        <strong>本当に復元しますか？</strong>
                        現在のデータベースは <strong>${this.confirmTarget}</strong> の内容で上書きされます。
                        この操作は取り消せません。
                      </div>
                      <div class="btn-row">
                        <button
                          class="restore-btn"
                          ?disabled=${this.restoring}
                          @click=${this.handleConfirm}
                        >${this.restoring ? '復元中...' : '復元する'}</button>
                        <button class="cancel-btn" @click=${this.handleCancel}>キャンセル</button>
                      </div>
                    `
                    : html`
                      <div class="btn-row">
                        <button
                          class="restore-btn"
                          ?disabled=${!this.selected}
                          @click=${this.handleRestoreClick}
                        >このバックアップを復元</button>
                      </div>
                    `
                }
              `
        }

        ${this.error ? html`<p class="error">${this.error}</p>` : ''}
        ${this.successMsg ? html`<p class="success">${this.successMsg}</p>` : ''}
      </div>
    `;
  }
}

customElements.define('settings-view', SettingsView);
