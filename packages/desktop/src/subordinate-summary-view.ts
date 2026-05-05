import type { SubordinateRow, SubordinateSummary } from '@episfolio/kernel';
import { toSubordinateSummaryMarkdown } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createSubordinateSummary,
  deleteSubordinateSummary,
  listSubordinateSummaries,
  updateSubordinateSummary,
} from './ipc/subordinate-summaries.js';
import { waitForTauri } from './ipc/tauri-ready.js';

type FormState = {
  title: string;
  subordinates: SubordinateRow[];
  memo: string;
};

function newRowId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function emptyRow(): SubordinateRow {
  return {
    id: newRowId(),
    name: '',
    strength: '',
    achievement: '',
    teamRole: '',
    challenge: '',
    guidance: '',
    change: '',
    futureCareer: '',
  };
}

function summaryToForm(s: SubordinateSummary): FormState {
  return {
    title: s.title,
    subordinates: s.subordinates.map((r) => ({ ...r })),
    memo: s.memo,
  };
}

class SubordinateSummaryView extends LitElement {
  static override properties = {
    summaries: { state: true },
    selectedId: { state: true },
    editMode: { state: true },
    form: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteId: { state: true },
    showPreview: { state: true },
    maskNamesInPreview: { state: true },
  };

  declare summaries: SubordinateSummary[];
  declare selectedId: string;
  declare editMode: boolean;
  declare form: FormState;
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteId: string;
  declare showPreview: boolean;
  declare maskNamesInPreview: boolean;

  constructor() {
    super();
    this.summaries = [];
    this.selectedId = '';
    this.editMode = false;
    this.form = this._emptyForm();
    this.saving = false;
    this.error = '';
    this.confirmDeleteId = '';
    this.showPreview = false;
    this.maskNamesInPreview = false;
  }

  _emptyForm(): FormState {
    return { title: '', subordinates: [], memo: '' };
  }

  override connectedCallback() {
    super.connectedCallback();
    void (async () => {
      if (!(await waitForTauri())) return;
      void this._load();
    })();
  }

  async _load() {
    try {
      this.summaries = await listSubordinateSummaries();
    } catch (e) {
      this.error = String(e);
    }
  }

  _startNew() {
    this.selectedId = '';
    this.form = this._emptyForm();
    this.editMode = true;
    this.showPreview = false;
    this.error = '';
    this.confirmDeleteId = '';
  }

  _select(s: SubordinateSummary) {
    this.selectedId = s.id;
    this.form = summaryToForm(s);
    this.editMode = false;
    this.showPreview = false;
    this.error = '';
    this.confirmDeleteId = '';
  }

  _addRow() {
    this.form = { ...this.form, subordinates: [...this.form.subordinates, emptyRow()] };
  }

  _updateRow(rowId: string, patch: Partial<SubordinateRow>) {
    this.form = {
      ...this.form,
      subordinates: this.form.subordinates.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
    };
  }

  _removeRow(rowId: string) {
    this.form = {
      ...this.form,
      subordinates: this.form.subordinates.filter((r) => r.id !== rowId),
    };
  }

  _moveRow(rowId: string, delta: -1 | 1) {
    const idx = this.form.subordinates.findIndex((r) => r.id === rowId);
    if (idx < 0) return;
    const target = idx + delta;
    if (target < 0 || target >= this.form.subordinates.length) return;
    const next = [...this.form.subordinates];
    [next[idx], next[target]] = [next[target] as SubordinateRow, next[idx] as SubordinateRow];
    this.form = { ...this.form, subordinates: next };
  }

  async _save() {
    this.saving = true;
    this.error = '';
    try {
      const f = this.form;
      if (this.selectedId) {
        const updated = await updateSubordinateSummary(this.selectedId, {
          title: f.title,
          subordinates: f.subordinates,
          memo: f.memo,
        });
        this.summaries = this.summaries.map((s) => (s.id === updated.id ? updated : s));
        this._select(updated);
      } else {
        const created = await createSubordinateSummary({
          title: f.title,
          subordinates: f.subordinates,
          memo: f.memo,
        });
        this.summaries = [...this.summaries, created];
        this._select(created);
      }
      this.editMode = false;
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  async _delete(id: string) {
    if (this.confirmDeleteId !== id) {
      this.confirmDeleteId = id;
      return;
    }
    try {
      await deleteSubordinateSummary(id);
      this.summaries = this.summaries.filter((s) => s.id !== id);
      this.selectedId = '';
      this.editMode = false;
      this.confirmDeleteId = '';
      this.form = this._emptyForm();
    } catch (e) {
      this.error = String(e);
    }
  }

  _buildPreviewSummary(): SubordinateSummary | null {
    const base = this.selectedId ? this.summaries.find((s) => s.id === this.selectedId) : undefined;
    const f = this.form;
    return {
      id: base?.id ?? 'preview',
      title: f.title,
      subordinates: f.subordinates,
      memo: f.memo,
      createdAt: base?.createdAt ?? '',
      updatedAt: base?.updatedAt ?? '',
    };
  }

  _copyMarkdown() {
    const s = this._buildPreviewSummary();
    if (!s) return;
    const md = toSubordinateSummaryMarkdown(s, { maskNames: this.maskNamesInPreview });
    navigator.clipboard.writeText(md).catch(() => {});
  }

  static override styles = css`
    :host { display: block; }
    .layout { display: flex; gap: 1.5rem; padding: 1.5rem; }
    .sidebar { width: 240px; flex-shrink: 0; }
    .main { flex: 1; min-width: 0; max-width: 820px; }
    .list-item {
      padding: 0.5rem 0.7rem;
      border: 1px solid #e0e0e0;
      border-radius: 0.3rem;
      margin-bottom: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
    }
    .list-item.active { border-color: #1a1a1a; background: #f5f5f5; }
    .list-item-title { font-weight: 600; }
    .list-item-meta { font-size: 0.8rem; color: #777; }
    .btn-new {
      width: 100%;
      padding: 0.4rem;
      font-size: 0.875rem;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
      margin-bottom: 1rem;
    }
    h2 { margin: 0 0 1rem; font-size: 1.1rem; }
    .section {
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 1.2rem;
      margin-bottom: 1.5rem;
    }
    .section-title {
      font-weight: 600;
      font-size: 1rem;
      margin: 0 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 0.2rem; }
    input[type="text"], textarea {
      width: 100%;
      box-sizing: border-box;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      padding: 0.4rem 0.6rem;
      margin-bottom: 0.6rem;
    }
    textarea { resize: vertical; min-height: 60px; }
    .btn-row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
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
    button.edit-btn {
      padding: 0.4rem 1rem;
      font-size: 0.9rem;
      background: #555;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.del-btn {
      padding: 0.4rem 1rem;
      font-size: 0.9rem;
      background: #c00;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.copy-btn {
      padding: 0.4rem 1rem;
      font-size: 0.9rem;
      background: #0066cc;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.add-row-btn {
      padding: 0.3rem 0.8rem;
      font-size: 0.85rem;
      background: #fff;
      color: #1a1a1a;
      border: 1px dashed #1a1a1a;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.icon-btn {
      padding: 0.2rem 0.5rem;
      font-size: 0.8rem;
      background: #fff;
      color: #555;
      border: 1px solid #ccc;
      border-radius: 0.25rem;
      cursor: pointer;
      margin-left: 0.3rem;
    }
    button.icon-btn.del { color: #c00; border-color: #c00; }
    .row-card {
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 1rem;
      margin-bottom: 0.8rem;
      background: #fafafa;
    }
    .row-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.6rem;
    }
    .row-no { font-weight: 600; font-size: 0.95rem; }
    .row-actions { display: flex; gap: 0.2rem; }
    .three-col {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.6rem;
    }
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.8rem; }
    .preview-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
    }
    .preview-box {
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 0.3rem;
      padding: 0.7rem;
      font-size: 0.85rem;
      white-space: pre-wrap;
      word-break: break-word;
      min-height: 3rem;
    }
    .detail-row {
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 0.8rem;
      margin-bottom: 0.6rem;
      background: #fff;
    }
    .detail-row-name { font-weight: 600; margin-bottom: 0.4rem; }
    .detail-field { margin-bottom: 0.3rem; font-size: 0.9rem; }
    .detail-label { font-size: 0.78rem; color: #888; }
    .empty-hint { color: #888; font-size: 0.9rem; }
  `;

  override render() {
    return html`
      <div class="layout">
        <div class="sidebar">
          <button class="btn-new" @click=${this._startNew}>＋ 新規作成</button>
          ${this.summaries.map(
            (s) => html`
              <div
                class="list-item ${this.selectedId === s.id ? 'active' : ''}"
                @click=${() => this._select(s)}
              >
                <div class="list-item-title">${s.title || '（タイトル未入力）'}</div>
                <div class="list-item-meta">${s.subordinates.length} 名</div>
              </div>
            `,
          )}
        </div>
        <div class="main">
          ${this.error ? html`<div class="error">${this.error}</div>` : ''}
          ${this.editMode ? this._renderForm() : this._renderDetail()}
        </div>
      </div>
    `;
  }

  _renderDetail() {
    if (!this.selectedId) {
      return html`<p class="empty-hint">左のリストから選択するか、新規作成してください。</p>`;
    }
    const s = this.summaries.find((x) => x.id === this.selectedId);
    if (!s) return html``;

    return html`
      <h2>${s.title || '（タイトル未入力）'}</h2>
      <div class="btn-row">
        <button class="edit-btn" @click=${() => {
          this.editMode = true;
        }}>編集</button>
        <button class="copy-btn" @click=${() => {
          this.showPreview = !this.showPreview;
        }}>
          ${this.showPreview ? 'プレビュー非表示' : 'Markdown プレビュー'}
        </button>
        <button class="del-btn" @click=${() => this._delete(s.id)}>
          ${this.confirmDeleteId === s.id ? '本当に削除' : '削除'}
        </button>
      </div>
      ${
        s.subordinates.length === 0
          ? html`<p class="empty-hint">部下情報が登録されていません。「編集」から追加してください。</p>`
          : s.subordinates.map(
              (r, i) => html`
              <div class="detail-row">
                <div class="detail-row-name">${i + 1}. ${r.name || '（名前未入力）'}</div>
                <div class="detail-field"><span class="detail-label">強み: </span>${r.strength || '（未入力）'}</div>
                <div class="detail-field"><span class="detail-label">実績: </span>${r.achievement || '（未入力）'}</div>
                <div class="detail-field"><span class="detail-label">役割・性格: </span>${r.teamRole || '（未入力）'}</div>
                <div class="detail-field"><span class="detail-label">課題: </span>${r.challenge || '（未入力）'}</div>
                <div class="detail-field"><span class="detail-label">指導: </span>${r.guidance || '（未入力）'}</div>
                <div class="detail-field"><span class="detail-label">変化: </span>${r.change || '（未入力）'}</div>
                <div class="detail-field"><span class="detail-label">将来仕事: </span>${r.futureCareer || '（未入力）'}</div>
              </div>
            `,
            )
      }
      ${
        s.memo
          ? html`
        <div class="section">
          <div class="section-title">メモ</div>
          <div class="detail-field">${s.memo}</div>
        </div>
      `
          : ''
      }
      ${this.showPreview ? this._renderPreview() : ''}
    `;
  }

  _renderPreview() {
    const s = this._buildPreviewSummary();
    if (!s) return html``;
    const md = toSubordinateSummaryMarkdown(s, { maskNames: this.maskNamesInPreview });
    return html`
      <div class="section">
        <div class="section-title">
          <span>Markdown プレビュー</span>
          <span class="preview-controls">
            <label style="display:inline-flex;align-items:center;gap:0.3rem;font-size:0.85rem;color:#333;margin:0;">
              <input type="checkbox" ?checked=${this.maskNamesInPreview}
                @change=${(e: Event) => {
                  this.maskNamesInPreview = (e.target as HTMLInputElement).checked;
                }} />
              名前を伏字にする
            </label>
            <button class="copy-btn" @click=${this._copyMarkdown}>コピー</button>
          </span>
        </div>
        <div class="preview-box">${md}</div>
      </div>
    `;
  }

  _renderForm() {
    return html`
      <h2>${this.selectedId ? '編集' : '新規作成'} — 部下まとめシート</h2>
      <div class="section">
        <div class="section-title">基本情報</div>
        <label>タイトル</label>
        <input type="text" placeholder="例: 営業部 5 名のマネジメント実績" .value=${this.form.title}
          @input=${(e: Event) => {
            this.form = { ...this.form, title: (e.target as HTMLInputElement).value };
          }} />
        <label>メモ（任意）</label>
        <textarea placeholder="面接で補足したいことなど" .value=${this.form.memo}
          @input=${(e: Event) => {
            this.form = { ...this.form, memo: (e.target as HTMLTextAreaElement).value };
          }}></textarea>
      </div>
      <div class="section">
        <div class="section-title">
          <span>部下一覧（${this.form.subordinates.length} 名）</span>
          <button class="add-row-btn" @click=${this._addRow}>＋ 部下を追加</button>
        </div>
        ${this.form.subordinates.map((row, i) => this._renderRow(row, i))}
        ${
          this.form.subordinates.length === 0
            ? html`<p class="empty-hint">「＋ 部下を追加」から最初の 1 名を登録してください。</p>`
            : ''
        }
      </div>
      ${this.showPreview ? this._renderPreview() : ''}
      <div class="btn-row">
        <button class="save-btn" ?disabled=${this.saving} @click=${this._save}>
          ${this.saving ? '保存中…' : '保存'}
        </button>
        <button class="copy-btn" @click=${() => {
          this.showPreview = !this.showPreview;
        }}>
          ${this.showPreview ? 'プレビュー非表示' : 'Markdown プレビュー'}
        </button>
        ${
          this.selectedId
            ? html`
          <button class="edit-btn" @click=${() => {
            this.editMode = false;
            this.showPreview = false;
            const s = this.summaries.find((x) => x.id === this.selectedId);
            if (s) this.form = summaryToForm(s);
          }}>キャンセル</button>
        `
            : ''
        }
      </div>
    `;
  }

  _renderRow(row: SubordinateRow, index: number) {
    const update = (patch: Partial<SubordinateRow>) => this._updateRow(row.id, patch);
    return html`
      <div class="row-card">
        <div class="row-header">
          <span class="row-no">${index + 1}.</span>
          <span class="row-actions">
            <button class="icon-btn" ?disabled=${index === 0} @click=${() => this._moveRow(row.id, -1)}>↑</button>
            <button class="icon-btn" ?disabled=${index === this.form.subordinates.length - 1}
              @click=${() => this._moveRow(row.id, 1)}>↓</button>
            <button class="icon-btn del" @click=${() => this._removeRow(row.id)}>削除</button>
          </span>
        </div>
        <label>名前（提出時は伏字オプションあり）</label>
        <input type="text" placeholder="例: 田中太郎" .value=${row.name}
          @input=${(e: Event) => update({ name: (e.target as HTMLInputElement).value })} />
        <div class="three-col">
          <div>
            <label>強み</label>
            <textarea placeholder="例: 言語化能力に長けている" .value=${row.strength}
              @input=${(e: Event) => update({ strength: (e.target as HTMLTextAreaElement).value })}></textarea>
          </div>
          <div>
            <label>実績</label>
            <textarea placeholder="例: 自分のやり方をメンバーに共有してチームを底上げした" .value=${row.achievement}
              @input=${(e: Event) => update({ achievement: (e.target as HTMLTextAreaElement).value })}></textarea>
          </div>
          <div>
            <label>チーム内の役割・性格</label>
            <textarea placeholder="例: リーダー気質、先生ポジション" .value=${row.teamRole}
              @input=${(e: Event) => update({ teamRole: (e.target as HTMLTextAreaElement).value })}></textarea>
          </div>
        </div>
        <div class="three-col">
          <div>
            <label>課題</label>
            <textarea placeholder="例: 同僚の成績に目移りして自分の仕事を後回しにする" .value=${row.challenge}
              @input=${(e: Event) => update({ challenge: (e.target as HTMLTextAreaElement).value })}></textarea>
          </div>
          <div>
            <label>指導</label>
            <textarea placeholder="例: 「最大のリーダーシップは自分が実行すること」と伝えた" .value=${row.guidance}
              @input=${(e: Event) => update({ guidance: (e.target as HTMLTextAreaElement).value })}></textarea>
          </div>
          <div>
            <label>変化</label>
            <textarea placeholder="例: 上司や先輩にアドバイスを求めるようになった" .value=${row.change}
              @input=${(e: Event) => update({ change: (e.target as HTMLTextAreaElement).value })}></textarea>
          </div>
        </div>
        <label>将来的に進みたい仕事</label>
        <textarea placeholder="例: 研修担当・人事制度の構築" .value=${row.futureCareer}
          @input=${(e: Event) => update({ futureCareer: (e.target as HTMLTextAreaElement).value })}></textarea>
      </div>
    `;
  }
}

customElements.define('subordinate-summary-view', SubordinateSummaryView);

declare global {
  interface HTMLElementTagNameMap {
    'subordinate-summary-view': SubordinateSummaryView;
  }
}
