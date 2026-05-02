import type { AgentTrackRecord } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createAgentTrackRecord,
  deleteAgentTrackRecord,
  listAgentTrackRecords,
  updateAgentTrackRecord,
} from './ipc/agent-track-records.js';

type FormState = {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  firstContactDate: string;
  memo: string;
  status: AgentTrackRecord['status'];
};

function emptyForm(): FormState {
  return {
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    firstContactDate: '',
    memo: '',
    status: 'active',
  };
}

class AgentTrackRecordView extends LitElement {
  static override properties = {
    records: { state: true },
    form: { state: true },
    editingId: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteId: { state: true },
    showArchived: { state: true },
  };

  declare records: AgentTrackRecord[];
  declare form: FormState;
  declare editingId: string;
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteId: string;
  declare showArchived: boolean;

  constructor() {
    super();
    this.records = [];
    this.form = emptyForm();
    this.editingId = '';
    this.saving = false;
    this.error = '';
    this.confirmDeleteId = '';
    this.showArchived = false;
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
    textarea { min-height: 4rem; resize: vertical; }
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
    .filter-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-size: 0.85rem;
      color: #555;
    }
    .record-card {
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .record-card.archived { opacity: 0.6; }
    .record-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    .company-name { font-size: 1rem; font-weight: bold; }
    .status-badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      font-size: 0.75rem;
      border-radius: 1rem;
      background: #e8f5e9;
      color: #2e7d32;
    }
    .status-badge.archived { background: #f5f5f5; color: #9e9e9e; }
    .card-actions { display: flex; gap: 0.4rem; margin-top: 0.25rem; }
    button.edit-btn {
      padding: 0.3rem 0.8rem;
      font-size: 0.8rem;
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      cursor: pointer;
    }
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
    .contact-row { font-size: 0.85rem; color: #555; margin-bottom: 0.25rem; }
    .memo-text { font-size: 0.85rem; color: #444; white-space: pre-wrap; margin-top: 0.5rem; }
    .first-contact { font-size: 0.8rem; color: #888; }
    .empty-state { color: #999; font-size: 0.9rem; padding: 1rem 0; }
  `;

  override connectedCallback() {
    super.connectedCallback();
    void this.loadRecords();
  }

  private async loadRecords() {
    try {
      this.records = await listAgentTrackRecords();
    } catch (e) {
      this.error = String(e);
    }
  }

  private startEdit(r: AgentTrackRecord) {
    this.editingId = r.id;
    this.form = {
      companyName: r.companyName,
      contactName: r.contactName,
      contactEmail: r.contactEmail,
      contactPhone: r.contactPhone,
      firstContactDate: r.firstContactDate ?? '',
      memo: r.memo,
      status: r.status,
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
    if (!this.form.companyName.trim()) {
      this.error = '会社名は必須です';
      return;
    }
    this.saving = true;
    this.error = '';
    try {
      const firstContactDate = this.form.firstContactDate.trim() || null;
      if (this.editingId) {
        await updateAgentTrackRecord(this.editingId, {
          companyName: this.form.companyName.trim(),
          contactName: this.form.contactName,
          contactEmail: this.form.contactEmail,
          contactPhone: this.form.contactPhone,
          firstContactDate,
          memo: this.form.memo,
          status: this.form.status,
        });
      } else {
        await createAgentTrackRecord({
          companyName: this.form.companyName.trim(),
          contactName: this.form.contactName,
          contactEmail: this.form.contactEmail,
          contactPhone: this.form.contactPhone,
          firstContactDate,
          memo: this.form.memo,
          status: this.form.status,
        });
      }
      this.editingId = '';
      this.form = emptyForm();
      await this.loadRecords();
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private async confirmDelete(id: string) {
    if (this.confirmDeleteId === id) {
      try {
        await deleteAgentTrackRecord(id);
        this.confirmDeleteId = '';
        await this.loadRecords();
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
        <h2>${this.editingId ? 'エージェント情報を編集' : 'エージェントを追加'}</h2>
        <div class="form-grid">
          <div class="full">
            <label>会社名 *</label>
            <input
              type="text"
              .value=${this.form.companyName}
              @input=${(e: Event) =>
                this.updateField('companyName', (e.target as HTMLInputElement).value)}
              placeholder="例: リクルートエージェント"
            />
          </div>
          <div>
            <label>担当者名</label>
            <input
              type="text"
              .value=${this.form.contactName}
              @input=${(e: Event) =>
                this.updateField('contactName', (e.target as HTMLInputElement).value)}
              placeholder="例: 田中 太郎"
            />
          </div>
          <div>
            <label>初回コンタクト日</label>
            <input
              type="date"
              .value=${this.form.firstContactDate}
              @input=${(e: Event) =>
                this.updateField('firstContactDate', (e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label>連絡先メール</label>
            <input
              type="email"
              .value=${this.form.contactEmail}
              @input=${(e: Event) =>
                this.updateField('contactEmail', (e.target as HTMLInputElement).value)}
              placeholder="例: tanaka@example.com"
            />
          </div>
          <div>
            <label>連絡先電話</label>
            <input
              type="tel"
              .value=${this.form.contactPhone}
              @input=${(e: Event) =>
                this.updateField('contactPhone', (e.target as HTMLInputElement).value)}
              placeholder="例: 03-0000-0000"
            />
          </div>
          <div>
            <label>ステータス</label>
            <select
              .value=${this.form.status}
              @change=${(e: Event) =>
                this.updateField(
                  'status',
                  (e.target as HTMLSelectElement).value as AgentTrackRecord['status'],
                )}
            >
              <option value="active" ?selected=${this.form.status === 'active'}>稼働中</option>
              <option value="archived" ?selected=${this.form.status === 'archived'}>アーカイブ</option>
            </select>
          </div>
          <div class="full">
            <label>メモ</label>
            <textarea
              .value=${this.form.memo}
              @input=${(e: Event) =>
                this.updateField('memo', (e.target as HTMLTextAreaElement).value)}
              placeholder="担当者の印象・特記事項など"
            ></textarea>
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

  private renderRecord(r: AgentTrackRecord) {
    if (this.editingId === r.id) return this.renderForm();

    return html`
      <div class="record-card ${r.status === 'archived' ? 'archived' : ''}">
        <div class="record-card-header">
          <div>
            <div class="company-name">${r.companyName}</div>
            ${
              r.firstContactDate
                ? html`<div class="first-contact">初回コンタクト: ${r.firstContactDate}</div>`
                : ''
            }
          </div>
          <div>
            <span class="status-badge ${r.status === 'archived' ? 'archived' : ''}">
              ${r.status === 'active' ? '稼働中' : 'アーカイブ'}
            </span>
            <div class="card-actions">
              <button class="edit-btn" @click=${() => this.startEdit(r)}>編集</button>
              <button
                class=${this.confirmDeleteId === r.id ? 'confirm-delete-btn' : 'delete-btn'}
                @click=${() => this.confirmDelete(r.id)}
              >
                ${this.confirmDeleteId === r.id ? '本当に削除' : '削除'}
              </button>
            </div>
          </div>
        </div>
        ${r.contactName ? html`<div class="contact-row">担当者: ${r.contactName}</div>` : ''}
        ${r.contactEmail ? html`<div class="contact-row">メール: ${r.contactEmail}</div>` : ''}
        ${r.contactPhone ? html`<div class="contact-row">電話: ${r.contactPhone}</div>` : ''}
        ${r.memo ? html`<div class="memo-text">${r.memo}</div>` : ''}
      </div>
    `;
  }

  override render() {
    const visible = this.showArchived
      ? this.records
      : this.records.filter((r) => r.status === 'active');
    const isAdding = !this.editingId;

    return html`
      <div class="panel">
        <h1>エージェント実績表</h1>

        ${isAdding ? this.renderForm() : ''}

        <div class="filter-row">
          <label>
            <input
              type="checkbox"
              .checked=${this.showArchived}
              @change=${(e: Event) => {
                this.showArchived = (e.target as HTMLInputElement).checked;
              }}
            />
            アーカイブ済みを表示
          </label>
        </div>

        ${
          visible.length === 0
            ? html`<div class="empty-state">エージェントがまだ登録されていません。上のフォームから追加してください。</div>`
            : visible.map((r) => this.renderRecord(r))
        }
      </div>
    `;
  }
}

customElements.define('agent-track-record-view', AgentTrackRecordView);
