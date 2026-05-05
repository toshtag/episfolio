import type {
  ContactStatus,
  WeakConnection,
  WeakConnectionCategory,
  WeakConnectionUpdate,
} from '@episfolio/kernel';
import { toWeakConnectionMarkdown } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import { waitForTauri } from './ipc/tauri-ready.js';
import {
  createWeakConnection,
  deleteWeakConnection,
  listWeakConnection,
  updateWeakConnection,
} from './ipc/weak-connection.js';

type FormState = {
  name: string;
  category: WeakConnectionCategory;
  relation: string;
  contactStatus: ContactStatus;
  prospectNote: string;
  note: string;
};

const CATEGORY_LABELS: Record<WeakConnectionCategory, string> = {
  student_days: '学生時代の仲間（バイト・ゼミ・サークル）',
  family_network: '親族の仕事仲間',
  business_card: '名刺交換した顧客・取引先',
  hobby: '趣味のつながり',
  sns: 'SNS',
};

const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  not_contacted: '未連絡',
  contacted: '連絡済み',
  replied: '返信あり',
};

const CATEGORIES: WeakConnectionCategory[] = [
  'student_days',
  'family_network',
  'business_card',
  'hobby',
  'sns',
];

const CONTACT_STATUSES: ContactStatus[] = ['not_contacted', 'contacted', 'replied'];

function emptyForm(): FormState {
  return {
    name: '',
    category: 'student_days',
    relation: '',
    contactStatus: 'not_contacted',
    prospectNote: '',
    note: '',
  };
}

function recordToForm(r: WeakConnection): FormState {
  return {
    name: r.name,
    category: r.category,
    relation: r.relation,
    contactStatus: r.contactStatus,
    prospectNote: r.prospectNote,
    note: r.note ?? '',
  };
}

export class WeakConnectionView extends LitElement {
  static override properties = {
    _records: { state: true },
    _selectedId: { state: true },
    _form: { state: true },
    _saving: { state: true },
    _error: { state: true },
    _deleteConfirmId: { state: true },
    _showPreview: { state: true },
  };

  declare _records: WeakConnection[];
  declare _selectedId: string;
  declare _form: FormState;
  declare _saving: boolean;
  declare _error: string;
  declare _deleteConfirmId: string;
  declare _showPreview: boolean;

  constructor() {
    super();
    this._records = [];
    this._selectedId = '';
    this._form = emptyForm();
    this._saving = false;
    this._error = '';
    this._deleteConfirmId = '';
    this._showPreview = false;
  }

  static override styles = css`
    :host { display: block; font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; }
    .panel { padding: 2rem; max-width: 720px; }
    h1 { margin: 0 0 1.5rem; font-size: 1.4rem; }
    h2 { margin: 0 0 1rem; font-size: 1.1rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1rem; margin-bottom: 1rem; }
    .form-full { grid-column: 1 / -1; }
    label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 0.25rem; }
    input, select, textarea {
      width: 100%; box-sizing: border-box;
      padding: 0.4rem 0.7rem; font-size: 0.9rem;
      border: 1px solid #ccc; border-radius: 0.3rem;
    }
    textarea { resize: vertical; min-height: 5rem; }
    .actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
    button.primary {
      padding: 0.4rem 1rem; font-size: 0.9rem;
      background: #1a1a1a; color: #fff;
      border: none; border-radius: 0.3rem; cursor: pointer;
    }
    button.primary:disabled { opacity: 0.5; cursor: default; }
    button.secondary {
      padding: 0.4rem 0.9rem; font-size: 0.9rem;
      background: #f0f0f0; color: #333;
      border: 1px solid #ccc; border-radius: 0.3rem; cursor: pointer;
    }
    button.danger {
      padding: 0.4rem 0.9rem; font-size: 0.9rem;
      background: #c00; color: #fff;
      border: none; border-radius: 0.3rem; cursor: pointer;
    }
    .error { color: #c00; font-size: 0.85rem; margin: 0.5rem 0; }
    .divider { border: none; border-top: 1px solid #eee; margin: 1.5rem 0; }
    .record-list { list-style: none; margin: 0; padding: 0; }
    .record-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      border-bottom: 1px solid #eee; cursor: pointer;
    }
    .record-item:hover { background: #f6f6f6; }
    .record-item.selected { background: #eef4ff; }
    .record-name { font-weight: 600; font-size: 0.9rem; }
    .record-meta { font-size: 0.8rem; color: #666; }
    .badge {
      display: inline-block; padding: 0.1rem 0.5rem;
      border-radius: 0.25rem; font-size: 0.75rem; white-space: nowrap;
    }
    .badge-not_contacted { background: #f0f0f0; color: #555; }
    .badge-contacted { background: #fff3cd; color: #856404; }
    .badge-replied { background: #d4edda; color: #155724; }
    .preview { background: #f8f8f8; border: 1px solid #ddd; border-radius: 0.4rem; padding: 1rem; white-space: pre-wrap; font-size: 0.85rem; font-family: monospace; }
    .empty { color: #888; font-size: 0.9rem; }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    if (!(await waitForTauri())) return;
    await this._load();
  }

  private async _load() {
    try {
      this._records = await listWeakConnection();
    } catch (e) {
      this._error = String(e);
    }
  }

  private _selectRecord(r: WeakConnection) {
    this._selectedId = r.id;
    this._form = recordToForm(r);
    this._error = '';
    this._deleteConfirmId = '';
  }

  private _newRecord() {
    this._selectedId = '';
    this._form = emptyForm();
    this._error = '';
    this._deleteConfirmId = '';
  }

  private async _handleSave() {
    this._saving = true;
    this._error = '';
    try {
      const note = this._form.note.trim() !== '' ? this._form.note : null;
      if (this._selectedId) {
        const patch: WeakConnectionUpdate = {
          name: this._form.name,
          category: this._form.category,
          relation: this._form.relation,
          contactStatus: this._form.contactStatus,
          prospectNote: this._form.prospectNote,
          note,
        };
        await updateWeakConnection(this._selectedId, patch);
      } else {
        await createWeakConnection({
          name: this._form.name,
          category: this._form.category,
          relation: this._form.relation,
          contactStatus: this._form.contactStatus,
          prospectNote: this._form.prospectNote,
          note,
        });
        this._form = emptyForm();
        this._selectedId = '';
      }
      await this._load();
    } catch (e) {
      this._error = String(e);
    } finally {
      this._saving = false;
    }
  }

  private _requestDelete(id: string) {
    this._deleteConfirmId = id;
  }

  private _cancelDelete() {
    this._deleteConfirmId = '';
  }

  private async _confirmDelete(id: string) {
    this._saving = true;
    this._error = '';
    try {
      await deleteWeakConnection(id);
      this._selectedId = '';
      this._form = emptyForm();
      this._deleteConfirmId = '';
      await this._load();
    } catch (e) {
      this._error = String(e);
    } finally {
      this._saving = false;
    }
  }

  private _setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    this._form = { ...this._form, [key]: value };
  }

  override render() {
    return html`
      <div class="panel">
        <h1>弱いつながり</h1>

        <div class="form-grid">
          <div>
            <label>名前</label>
            <input
              .value=${this._form.name}
              @input=${(e: Event) => this._setField('name', (e.target as HTMLInputElement).value)}
              placeholder="田中太郎"
            />
          </div>
          <div>
            <label>カテゴリ</label>
            <select
              .value=${this._form.category}
              @change=${(e: Event) =>
                this._setField(
                  'category',
                  (e.target as HTMLSelectElement).value as WeakConnectionCategory,
                )}
            >
              ${CATEGORIES.map(
                (cat) =>
                  html`<option value=${cat} ?selected=${this._form.category === cat}>${CATEGORY_LABELS[cat]}</option>`,
              )}
            </select>
          </div>
          <div class="form-full">
            <label>関係性</label>
            <input
              .value=${this._form.relation}
              @input=${(e: Event) => this._setField('relation', (e.target as HTMLInputElement).value)}
              placeholder="大学のゼミ仲間"
            />
          </div>
          <div>
            <label>連絡状況</label>
            <select
              .value=${this._form.contactStatus}
              @change=${(e: Event) =>
                this._setField(
                  'contactStatus',
                  (e.target as HTMLSelectElement).value as ContactStatus,
                )}
            >
              ${CONTACT_STATUSES.map(
                (s) =>
                  html`<option value=${s} ?selected=${this._form.contactStatus === s}>${CONTACT_STATUS_LABELS[s]}</option>`,
              )}
            </select>
          </div>
          <div class="form-full">
            <label>転職の糸口</label>
            <textarea
              .value=${this._form.prospectNote}
              @input=${(e: Event) =>
                this._setField('prospectNote', (e.target as HTMLTextAreaElement).value)}
              placeholder="IT 系の会社に勤めているので転職先の紹介を頼めるかも"
            ></textarea>
          </div>
          <div class="form-full">
            <label>メモ（任意）</label>
            <textarea
              .value=${this._form.note}
              @input=${(e: Event) =>
                this._setField('note', (e.target as HTMLTextAreaElement).value)}
              placeholder="退職から5カ月後に連絡予定"
            ></textarea>
          </div>
        </div>

        ${this._error ? html`<p class="error">${this._error}</p>` : ''}

        <div class="actions">
          <button class="primary" @click=${this._handleSave} ?disabled=${this._saving}>
            ${this._selectedId ? '更新' : '追加'}
          </button>
          ${
            this._selectedId
              ? html`
              <button class="secondary" @click=${this._newRecord}>新規</button>
              ${
                this._deleteConfirmId === this._selectedId
                  ? html`
                  <button class="danger" @click=${() => this._confirmDelete(this._selectedId)}>本当に削除</button>
                  <button class="secondary" @click=${this._cancelDelete}>キャンセル</button>
                `
                  : html`
                  <button class="secondary" @click=${() => this._requestDelete(this._selectedId)}>削除</button>
                `
              }
            `
              : ''
          }
        </div>

        <hr class="divider" />

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
          <h2 style="margin:0">一覧（${this._records.length} 件）</h2>
          <button class="secondary" @click=${() => {
            this._showPreview = !this._showPreview;
          }}>
            ${this._showPreview ? '一覧に戻る' : 'Markdown プレビュー'}
          </button>
        </div>

        ${
          this._showPreview
            ? html`<pre class="preview">${toWeakConnectionMarkdown(this._records)}</pre>`
            : this._records.length === 0
              ? html`<p class="empty">まだ登録がありません</p>`
              : html`
              <ul class="record-list">
                ${this._records.map(
                  (r) => html`
                    <li
                      class="record-item ${r.id === this._selectedId ? 'selected' : ''}"
                      @click=${() => this._selectRecord(r)}
                    >
                      <div style="flex:1">
                        <div class="record-name">${r.name || '（名前未入力）'}</div>
                        <div class="record-meta">${CATEGORY_LABELS[r.category]} — ${r.relation || '（関係性未入力）'}</div>
                      </div>
                      <span class="badge badge-${r.contactStatus}">${CONTACT_STATUS_LABELS[r.contactStatus]}</span>
                    </li>
                  `,
                )}
              </ul>
            `
        }
      </div>
    `;
  }
}

customElements.define('weak-connection-view', WeakConnectionView);
