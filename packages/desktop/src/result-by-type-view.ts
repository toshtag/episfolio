import type { ResultByType, ResultEntry, ResultType } from '@episfolio/kernel';
import { toResultByTypeMarkdown } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createResultByType,
  deleteResultByType,
  listResultByType,
  updateResultByType,
} from './ipc/result-by-type.js';
import { waitForTauri } from './ipc/tauri-ready.js';

type SkillType = 'outcome' | 'cause';

type FormState = {
  title: string;
  entries: ResultEntry[];
  memo: string;
};

const RESULT_TYPE_LABELS: Record<ResultType, string> = {
  revenue: '① 売上アップ',
  cost: '② コスト削減',
  both: '③ 両方に影響',
};

const SKILL_TYPE_LABELS: Record<SkillType, string> = {
  outcome: '成果スキル',
  cause: '原因スキル',
};

function newEntryId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function emptyEntry(): ResultEntry {
  return {
    id: newEntryId(),
    resultType: 'revenue',
    situation: '',
    action: '',
    result: '',
    quantification: null,
    skillType: 'outcome',
    note: null,
  };
}

function recordToForm(r: ResultByType): FormState {
  return {
    title: r.title,
    entries: r.entries.map((e) => ({ ...e })),
    memo: r.memo,
  };
}

class ResultByTypeView extends LitElement {
  static override properties = {
    records: { state: true },
    selectedId: { state: true },
    editMode: { state: true },
    form: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteId: { state: true },
    showPreview: { state: true },
  };

  declare records: ResultByType[];
  declare selectedId: string;
  declare editMode: boolean;
  declare form: FormState;
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteId: string;
  declare showPreview: boolean;

  constructor() {
    super();
    this.records = [];
    this.selectedId = '';
    this.editMode = false;
    this.form = this._emptyForm();
    this.saving = false;
    this.error = '';
    this.confirmDeleteId = '';
    this.showPreview = false;
  }

  private _emptyForm(): FormState {
    return { title: '', entries: [], memo: '' };
  }

  static override styles = css`
    :host { display: block; font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; }
    .panel { padding: 2rem; max-width: 720px; }
    h1 { margin: 0 0 1.5rem; font-size: 1.4rem; }
    h2 { margin: 0 0 1rem; font-size: 1.1rem; }
    h3 { margin: 1rem 0 0.5rem; font-size: 0.95rem; color: #555; }
    .form-row { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.8rem; }
    label { font-size: 0.85rem; font-weight: 600; color: #555; }
    input, textarea, select {
      padding: 0.4rem 0.7rem;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      font-family: inherit;
    }
    textarea { resize: vertical; min-height: 4rem; }
    .btn {
      padding: 0.4rem 0.9rem;
      font-size: 0.9rem;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    .btn-primary { background: #1a1a1a; color: #fff; }
    .btn-primary:disabled { opacity: 0.5; cursor: default; }
    .btn-secondary { background: #eee; color: #333; }
    .btn-danger { background: #c00; color: #fff; }
    .btn-small { padding: 0.25rem 0.6rem; font-size: 0.8rem; }
    .actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 2px solid #ddd; }
    td { padding: 0.4rem 0.5rem; border-bottom: 1px solid #eee; }
    tbody tr { cursor: pointer; }
    tbody tr:hover td { background: #f6f6f6; }
    .empty { color: #888; font-size: 0.9rem; }
    .entry-card {
      border: 1px solid #ddd;
      border-radius: 0.4rem;
      padding: 0.8rem;
      margin-bottom: 0.8rem;
      background: #fafafa;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.6rem;
    }
    .entry-badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-revenue { background: #e8f4fd; color: #1a6dad; }
    .badge-cost { background: #e8fdf0; color: #1a7a3a; }
    .badge-both { background: #fdf3e8; color: #a05c00; }
    .badge-outcome { background: #f0e8fd; color: #6a1aad; }
    .badge-cause { background: #fde8f0; color: #ad1a6a; }
    .preview-box {
      background: #f6f6f6;
      border: 1px solid #ddd;
      border-radius: 0.3rem;
      padding: 1rem;
      font-size: 0.85rem;
      white-space: pre-wrap;
      font-family: monospace;
      max-height: 400px;
      overflow-y: auto;
    }
    .detail-field { margin-bottom: 0.6rem; font-size: 0.9rem; }
    .detail-label { font-weight: 600; color: #555; font-size: 0.8rem; }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    if (!(await waitForTauri())) return;
    await this._load();
  }

  private async _load() {
    try {
      this.records = await listResultByType();
    } catch (e) {
      this.error = String(e);
    }
  }

  private _selectRecord(id: string) {
    this.selectedId = id;
    this.editMode = false;
    this.confirmDeleteId = '';
    this.showPreview = false;
    this.error = '';
  }

  private _startCreate() {
    this.selectedId = '';
    this.editMode = true;
    this.form = this._emptyForm();
    this.error = '';
  }

  private _startEdit(r: ResultByType) {
    this.form = recordToForm(r);
    this.editMode = true;
    this.error = '';
  }

  private _cancelEdit() {
    this.editMode = false;
    this.error = '';
    if (!this.selectedId) {
      this.form = this._emptyForm();
    }
  }

  private async _save() {
    this.saving = true;
    this.error = '';
    try {
      const { title, entries, memo } = this.form;
      if (!this.selectedId) {
        const created = await createResultByType({ title, entries, memo });
        this.selectedId = created.id;
      } else {
        await updateResultByType(this.selectedId, { title, entries, memo });
      }
      await this._load();
      this.editMode = false;
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private async _delete(id: string) {
    if (this.confirmDeleteId !== id) {
      this.confirmDeleteId = id;
      return;
    }
    try {
      await deleteResultByType(id);
      this.selectedId = '';
      this.confirmDeleteId = '';
      this.editMode = false;
      await this._load();
    } catch (e) {
      this.error = String(e);
    }
  }

  private _addEntry() {
    this.form = { ...this.form, entries: [...this.form.entries, emptyEntry()] };
  }

  private _removeEntry(idx: number) {
    const entries = [...this.form.entries];
    entries.splice(idx, 1);
    this.form = { ...this.form, entries };
  }

  private _updateEntry(idx: number, field: keyof ResultEntry, value: string) {
    const entries = this.form.entries.map((e, i) => {
      if (i !== idx) return e;
      if (field === 'quantification' || field === 'note') {
        return { ...e, [field]: value === '' ? null : value };
      }
      return { ...e, [field]: value };
    });
    this.form = { ...this.form, entries };
  }

  private _renderBadgeResult(type: ResultType) {
    const cls = `entry-badge badge-${type}`;
    return html`<span class=${cls}>${RESULT_TYPE_LABELS[type]}</span>`;
  }

  private _renderBadgeSkill(type: SkillType) {
    const cls = `entry-badge badge-${type}`;
    return html`<span class=${cls}>${SKILL_TYPE_LABELS[type]}</span>`;
  }

  private _renderList() {
    return html`
      <div class="panel">
        <h1>3 タイプの実績</h1>
        <div class="actions">
          <button class="btn btn-primary" @click=${this._startCreate}>+ 新規作成</button>
        </div>
        ${this.error ? html`<p class="error">${this.error}</p>` : ''}
        ${
          this.records.length === 0
            ? html`<p class="empty">記録はまだありません</p>`
            : html`
            <table>
              <thead><tr><th>タイトル</th><th>エントリ数</th><th>作成日時</th></tr></thead>
              <tbody>
                ${this.records.map(
                  (r) => html`
                  <tr @click=${() => this._selectRecord(r.id)}>
                    <td>${r.title || '（タイトルなし）'}</td>
                    <td>${r.entries.length}</td>
                    <td>${r.createdAt.replace('T', ' ').replace('Z', '')}</td>
                  </tr>
                `,
                )}
              </tbody>
            </table>
          `
        }
      </div>
    `;
  }

  private _renderEntryForm(entry: ResultEntry, idx: number) {
    return html`
      <div class="entry-card">
        <div class="entry-header">
          <span>エントリ ${idx + 1}</span>
          <button class="btn btn-secondary btn-small" @click=${() => this._removeEntry(idx)}>削除</button>
        </div>
        <div class="form-row">
          <label>タイプ</label>
          <select
            .value=${entry.resultType}
            @change=${(e: Event) => this._updateEntry(idx, 'resultType', (e.target as HTMLSelectElement).value)}
          >
            <option value="revenue">① 売上アップ</option>
            <option value="cost">② コスト削減</option>
            <option value="both">③ 両方に影響</option>
          </select>
        </div>
        <div class="form-row">
          <label>スキル種別</label>
          <select
            .value=${entry.skillType}
            @change=${(e: Event) => this._updateEntry(idx, 'skillType', (e.target as HTMLSelectElement).value)}
          >
            <option value="outcome">成果スキル（説明しやすい成果）</option>
            <option value="cause">原因スキル（成果を生んだ要因）</option>
          </select>
        </div>
        <div class="form-row">
          <label>状況（任意）</label>
          <textarea
            .value=${entry.situation}
            @input=${(e: Event) => this._updateEntry(idx, 'situation', (e.target as HTMLTextAreaElement).value)}
            placeholder="どんな状況・課題があったか"
          ></textarea>
        </div>
        <div class="form-row">
          <label>行動</label>
          <textarea
            .value=${entry.action}
            @input=${(e: Event) => this._updateEntry(idx, 'action', (e.target as HTMLTextAreaElement).value)}
            placeholder="具体的にどんな行動・工夫をしたか"
          ></textarea>
        </div>
        <div class="form-row">
          <label>結果</label>
          <textarea
            .value=${entry.result}
            @input=${(e: Event) => this._updateEntry(idx, 'result', (e.target as HTMLTextAreaElement).value)}
            placeholder="どんな成果・変化が生まれたか"
          ></textarea>
        </div>
        <div class="form-row">
          <label>数値化（任意）</label>
          <input
            type="text"
            .value=${entry.quantification ?? ''}
            @input=${(e: Event) => this._updateEntry(idx, 'quantification', (e.target as HTMLInputElement).value)}
            placeholder="例: 受注率 20% 向上、コスト月 30 万削減"
          />
        </div>
        <div class="form-row">
          <label>メモ（任意）</label>
          <input
            type="text"
            .value=${entry.note ?? ''}
            @input=${(e: Event) => this._updateEntry(idx, 'note', (e.target as HTMLInputElement).value)}
            placeholder="補足・コンテキスト"
          />
        </div>
      </div>
    `;
  }

  private _renderForm() {
    const isNew = !this.selectedId;
    return html`
      <div class="panel">
        <h1>${isNew ? '新規作成' : '編集'}</h1>
        ${this.error ? html`<p class="error">${this.error}</p>` : ''}
        <div class="form-row">
          <label>タイトル</label>
          <input
            type="text"
            .value=${this.form.title}
            @input=${(e: Event) => {
              this.form = { ...this.form, title: (e.target as HTMLInputElement).value };
            }}
            placeholder="例: 営業職での実績"
          />
        </div>
        <h3>エントリ一覧</h3>
        ${this.form.entries.map((entry, idx) => this._renderEntryForm(entry, idx))}
        <button class="btn btn-secondary" @click=${this._addEntry}>+ エントリを追加</button>
        <div class="form-row" style="margin-top: 1rem;">
          <label>メモ（任意）</label>
          <textarea
            .value=${this.form.memo}
            @input=${(e: Event) => {
              this.form = { ...this.form, memo: (e.target as HTMLTextAreaElement).value };
            }}
            placeholder="シート全体への補足"
          ></textarea>
        </div>
        <div class="actions">
          <button class="btn btn-primary" @click=${this._save} ?disabled=${this.saving}>
            ${this.saving ? '保存中…' : '保存'}
          </button>
          <button class="btn btn-secondary" @click=${this._cancelEdit}>キャンセル</button>
        </div>
      </div>
    `;
  }

  private _renderDetail(r: ResultByType) {
    const grouped: Record<ResultType, ResultEntry[]> = { revenue: [], cost: [], both: [] };
    for (const e of r.entries) {
      grouped[e.resultType].push(e);
    }
    const typeOrder: ResultType[] = ['revenue', 'cost', 'both'];
    return html`
      <div class="panel">
        <div class="actions">
          <button class="btn btn-secondary" @click=${() => {
            this.selectedId = '';
            this.showPreview = false;
          }}>← 一覧へ</button>
          <button class="btn btn-secondary" @click=${() => this._startEdit(r)}>編集</button>
          <button
            class="btn ${this.confirmDeleteId === r.id ? 'btn-danger' : 'btn-secondary'}"
            @click=${() => this._delete(r.id)}
          >
            ${this.confirmDeleteId === r.id ? '本当に削除' : '削除'}
          </button>
          <button class="btn btn-secondary" @click=${() => {
            this.showPreview = !this.showPreview;
          }}>
            ${this.showPreview ? 'プレビューを閉じる' : 'Markdown プレビュー'}
          </button>
        </div>
        ${this.error ? html`<p class="error">${this.error}</p>` : ''}
        <h2>${r.title || '（タイトルなし）'}</h2>
        ${typeOrder.map((type) => {
          const entries = grouped[type];
          if (entries.length === 0) return '';
          return html`
            <h3>${RESULT_TYPE_LABELS[type]}</h3>
            ${entries.map(
              (entry) => html`
              <div class="entry-card">
                <div class="entry-header">
                  ${this._renderBadgeResult(entry.resultType)}
                  ${this._renderBadgeSkill(entry.skillType as SkillType)}
                </div>
                ${entry.situation ? html`<div class="detail-field"><span class="detail-label">状況：</span>${entry.situation}</div>` : ''}
                <div class="detail-field"><span class="detail-label">行動：</span>${entry.action || '（未記入）'}</div>
                <div class="detail-field"><span class="detail-label">結果：</span>${entry.result || '（未記入）'}</div>
                ${entry.quantification ? html`<div class="detail-field"><span class="detail-label">数値化：</span>${entry.quantification}</div>` : ''}
                ${entry.note ? html`<div class="detail-field"><span class="detail-label">メモ：</span>${entry.note}</div>` : ''}
              </div>
            `,
            )}
          `;
        })}
        ${r.memo ? html`<div class="detail-field"><span class="detail-label">メモ：</span>${r.memo}</div>` : ''}
        ${
          this.showPreview
            ? html`<div class="preview-box">${toResultByTypeMarkdown([r])}</div>`
            : ''
        }
      </div>
    `;
  }

  override render() {
    if (this.editMode) return this._renderForm();
    if (this.selectedId) {
      const r = this.records.find((x) => x.id === this.selectedId);
      if (r) return this._renderDetail(r);
    }
    return this._renderList();
  }
}

customElements.define('result-by-type-view', ResultByTypeView);
