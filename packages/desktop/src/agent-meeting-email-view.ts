import type { AgentMeetingEmail, AgentTrackRecord } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createAgentMeetingEmail,
  deleteAgentMeetingEmail,
  listAgentMeetingEmails,
  updateAgentMeetingEmail,
} from './ipc/agent-meeting-emails.js';
import { listAgentTrackRecords } from './ipc/agent-track-records.js';
import { waitForTauri } from './ipc/tauri-ready.js';

type FormState = {
  agentTrackRecordId: string;
  subject: string;
  body: string;
  sentAt: string;
  memo: string;
};

function emptyForm(): FormState {
  return {
    agentTrackRecordId: '',
    subject: '',
    body: '',
    sentAt: '',
    memo: '',
  };
}

class AgentMeetingEmailView extends LitElement {
  static override properties = {
    emails: { state: true },
    agents: { state: true },
    form: { state: true },
    editingId: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteId: { state: true },
    copyFeedbackId: { state: true },
  };

  declare emails: AgentMeetingEmail[];
  declare agents: AgentTrackRecord[];
  declare form: FormState;
  declare editingId: string;
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteId: string;
  declare copyFeedbackId: string;

  constructor() {
    super();
    this.emails = [];
    this.agents = [];
    this.form = emptyForm();
    this.editingId = '';
    this.saving = false;
    this.error = '';
    this.confirmDeleteId = '';
    this.copyFeedbackId = '';
  }

  static override styles = css`
    :host { display: block; }
    .panel { padding: 2rem; }
    h1 { margin: 0 0 1.5rem; font-size: 1.4rem; }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem 1rem;
      margin-bottom: 1rem;
    }
    .form-grid .full { grid-column: 1 / -1; }
    label { font-size: 0.85rem; color: #555; display: block; margin-bottom: 0.25rem; }
    input, textarea, select {
      width: 100%;
      padding: 0.4rem 0.6rem;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      box-sizing: border-box;
    }
    textarea { min-height: 8rem; resize: vertical; font-family: inherit; }
    textarea.body-area { min-height: 12rem; }
    .actions { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; align-items: center; }
    button.save-btn {
      padding: 0.4rem 1rem;
      font-size: 0.9rem;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.save-btn:disabled { opacity: 0.5; cursor: default; }
    button.cancel-btn {
      padding: 0.4rem 0.9rem;
      font-size: 0.9rem;
      background: #eee;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    .error { color: #c00; font-size: 0.85rem; }
    .add-section {
      border: 1px dashed #ccc;
      border-radius: 0.4rem;
      padding: 1rem;
      margin-bottom: 2rem;
    }
    .add-section h2 { margin: 0 0 1rem; font-size: 1rem; color: #555; }
    .email-card {
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .email-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    .email-subject { font-size: 1rem; font-weight: bold; }
    .email-agent { font-size: 0.8rem; color: #888; margin-top: 0.15rem; }
    .sent-badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      font-size: 0.75rem;
      border-radius: 1rem;
      background: #e3f2fd;
      color: #1565c0;
    }
    .draft-badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      font-size: 0.75rem;
      border-radius: 1rem;
      background: #f5f5f5;
      color: #9e9e9e;
    }
    .card-actions { display: flex; gap: 0.4rem; margin-top: 0.25rem; flex-wrap: wrap; }
    button.edit-btn {
      padding: 0.3rem 0.8rem;
      font-size: 0.8rem;
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.copy-btn {
      padding: 0.3rem 0.8rem;
      font-size: 0.8rem;
      background: #fff;
      border: 1px solid #4caf50;
      color: #2e7d32;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.copy-btn.copied { background: #e8f5e9; }
    button.delete-btn {
      padding: 0.3rem 0.8rem;
      font-size: 0.8rem;
      background: #fff;
      color: #c00;
      border: 1px solid #fcc;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.confirm-delete-btn {
      padding: 0.3rem 0.8rem;
      font-size: 0.8rem;
      background: #c00;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    .body-preview {
      font-size: 0.85rem;
      color: #444;
      white-space: pre-wrap;
      margin-top: 0.5rem;
      background: #fafafa;
      border: 1px solid #eee;
      border-radius: 0.3rem;
      padding: 0.5rem 0.75rem;
      max-height: 8rem;
      overflow: hidden;
    }
    .memo-text { font-size: 0.85rem; color: #666; margin-top: 0.4rem; }
    .empty-state { color: #999; font-size: 0.9rem; padding: 1rem 0; }
    .sent-at { font-size: 0.8rem; color: #888; margin-top: 0.2rem; }
  `;

  override connectedCallback() {
    super.connectedCallback();
    void (async () => {
      if (!(await waitForTauri())) return;
      void this.loadAll();
    })();
  }

  private async loadAll() {
    try {
      const [emails, agents] = await Promise.all([
        listAgentMeetingEmails(),
        listAgentTrackRecords(),
      ]);
      this.emails = emails;
      this.agents = agents;
    } catch (e) {
      this.error = String(e);
    }
  }

  private agentName(id: string | null): string {
    if (!id) return '汎用テンプレ';
    const a = this.agents.find((a) => a.id === id);
    return a ? a.companyName : `削除済み (${id.slice(0, 6)})`;
  }

  private startEdit(e: AgentMeetingEmail) {
    this.editingId = e.id;
    this.form = {
      agentTrackRecordId: e.agentTrackRecordId ?? '',
      subject: e.subject,
      body: e.body,
      sentAt: e.sentAt ?? '',
      memo: e.memo,
    };
    this.error = '';
  }

  private cancelEdit() {
    this.editingId = '';
    this.form = emptyForm();
    this.error = '';
  }

  private updateField(field: keyof FormState, value: string) {
    this.form = { ...this.form, [field]: value };
  }

  private async save() {
    if (this.saving) return;
    this.saving = true;
    this.error = '';
    try {
      const agentTrackRecordId = this.form.agentTrackRecordId.trim() || null;
      const sentAt = this.form.sentAt.trim() || null;
      if (this.editingId) {
        await updateAgentMeetingEmail(this.editingId, {
          agentTrackRecordId,
          subject: this.form.subject,
          body: this.form.body,
          sentAt,
          memo: this.form.memo,
        });
      } else {
        await createAgentMeetingEmail({
          agentTrackRecordId,
          subject: this.form.subject,
          body: this.form.body,
          sentAt,
          memo: this.form.memo,
        });
      }
      this.editingId = '';
      this.form = emptyForm();
      await this.loadAll();
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private async copyBody(email: AgentMeetingEmail) {
    try {
      await navigator.clipboard.writeText(email.body);
      this.copyFeedbackId = email.id;
      setTimeout(() => {
        this.copyFeedbackId = '';
      }, 1500);
    } catch (e) {
      this.error = String(e);
    }
  }

  private async confirmDelete(id: string) {
    if (this.confirmDeleteId === id) {
      try {
        await deleteAgentMeetingEmail(id);
        this.confirmDeleteId = '';
        await this.loadAll();
      } catch (e) {
        this.error = String(e);
      }
    } else {
      this.confirmDeleteId = id;
    }
  }

  private renderForm() {
    return html`
      <div class="add-section">
        <h2>${this.editingId ? 'メールを編集' : 'メールを追加'}</h2>
        <div class="form-grid">
          <div class="full">
            <label>エージェント</label>
            <select
              .value=${this.form.agentTrackRecordId}
              @change=${(e: Event) =>
                this.updateField('agentTrackRecordId', (e.target as HTMLSelectElement).value)}
            >
              <option value="" ?selected=${!this.form.agentTrackRecordId}>汎用テンプレ（未紐付け）</option>
              ${this.agents.map(
                (a) =>
                  html`<option value=${a.id} ?selected=${this.form.agentTrackRecordId === a.id}
                    >${a.companyName}</option
                  >`,
              )}
            </select>
          </div>
          <div class="full">
            <label>件名</label>
            <input
              type="text"
              .value=${this.form.subject}
              @input=${(e: Event) =>
                this.updateField('subject', (e.target as HTMLInputElement).value)}
              placeholder="例: 面談のご依頼"
            />
          </div>
          <div class="full">
            <label>本文</label>
            <textarea
              class="body-area"
              .value=${this.form.body}
              @input=${(e: Event) =>
                this.updateField('body', (e.target as HTMLTextAreaElement).value)}
              placeholder="メール本文を入力してください"
            ></textarea>
          </div>
          <div>
            <label>送信日時（空白=下書き）</label>
            <input
              type="datetime-local"
              .value=${this.form.sentAt}
              @input=${(e: Event) =>
                this.updateField('sentAt', (e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label>メモ</label>
            <input
              type="text"
              .value=${this.form.memo}
              @input=${(e: Event) => this.updateField('memo', (e.target as HTMLInputElement).value)}
              placeholder="補足メモ"
            />
          </div>
        </div>
        <div class="actions">
          <button class="save-btn" ?disabled=${this.saving} @click=${this.save}>
            ${this.saving ? '保存中...' : '保存'}
          </button>
          ${
            this.editingId
              ? html`<button class="cancel-btn" @click=${this.cancelEdit}>キャンセル</button>`
              : ''
          }
          ${this.error ? html`<span class="error">${this.error}</span>` : ''}
        </div>
      </div>
    `;
  }

  private renderEmail(e: AgentMeetingEmail) {
    if (this.editingId === e.id) return this.renderForm();
    const isCopied = this.copyFeedbackId === e.id;

    return html`
      <div class="email-card">
        <div class="email-card-header">
          <div>
            <div class="email-subject">${e.subject || '（件名なし）'}</div>
            <div class="email-agent">${this.agentName(e.agentTrackRecordId)}</div>
            ${e.sentAt ? html`<div class="sent-at">送信: ${e.sentAt}</div>` : ''}
          </div>
          <div>
            ${
              e.sentAt
                ? html`<span class="sent-badge">送信済み</span>`
                : html`<span class="draft-badge">下書き</span>`
            }
            <div class="card-actions">
              <button
                class=${isCopied ? 'copy-btn copied' : 'copy-btn'}
                @click=${() => this.copyBody(e)}
              >
                ${isCopied ? 'コピー済み' : '本文コピー'}
              </button>
              <button class="edit-btn" @click=${() => this.startEdit(e)}>編集</button>
              <button
                class=${this.confirmDeleteId === e.id ? 'confirm-delete-btn' : 'delete-btn'}
                @click=${() => this.confirmDelete(e.id)}
              >
                ${this.confirmDeleteId === e.id ? '本当に削除' : '削除'}
              </button>
            </div>
          </div>
        </div>
        ${e.body ? html`<div class="body-preview">${e.body}</div>` : ''}
        ${e.memo ? html`<div class="memo-text">${e.memo}</div>` : ''}
      </div>
    `;
  }

  override render() {
    const isAdding = !this.editingId;

    return html`
      <div class="panel">
        <h1>面談メール</h1>

        ${isAdding ? this.renderForm() : ''}

        ${
          this.emails.length === 0
            ? html`<div class="empty-state">
              メールがまだ登録されていません。上のフォームから追加してください。
            </div>`
            : this.emails.map((e) => this.renderEmail(e))
        }
      </div>
    `;
  }
}

customElements.define('agent-meeting-email-view', AgentMeetingEmailView);
