import type { StrengthArrow, StrengthArrowType } from '@episfolio/kernel';
import { toStrengthArrowMarkdown } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createStrengthArrow,
  deleteStrengthArrow,
  listStrengthArrows,
  updateStrengthArrow,
} from './ipc/strength-arrows.js';

type FormState = {
  type: StrengthArrowType;
  description: string;
  source: string;
  occurredAt: string;
  relatedEpisodeIds: string;
  note: string;
};

const TYPE_LABELS: Record<StrengthArrowType, string> = {
  interest: '興味（質問された）',
  evaluation: '評価（褒められた）',
  request: '依頼（頼まれた）',
};

const TYPE_PLACEHOLDERS: Record<StrengthArrowType, string> = {
  interest: '例: なぜそんなに詳しいんですか？と聞かれた',
  evaluation: '例: プレゼンが分かりやすいと褒められた',
  request: '例: 後輩への指導役を毎回頼まれる',
};

function emptyForm(): FormState {
  return {
    type: 'interest',
    description: '',
    source: '',
    occurredAt: '',
    relatedEpisodeIds: '',
    note: '',
  };
}

function arrowToForm(a: StrengthArrow): FormState {
  return {
    type: a.type,
    description: a.description,
    source: a.source,
    occurredAt: a.occurredAt ?? '',
    relatedEpisodeIds: a.relatedEpisodeIds.join(', '),
    note: a.note ?? '',
  };
}

function parseRelatedIds(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

class StrengthArrowView extends LitElement {
  static override properties = {
    arrows: { state: true },
    selectedId: { state: true },
    editMode: { state: true },
    form: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteId: { state: true },
    showPreview: { state: true },
    filterType: { state: true },
  };

  declare arrows: StrengthArrow[];
  declare selectedId: string;
  declare editMode: boolean;
  declare form: FormState;
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteId: string;
  declare showPreview: boolean;
  declare filterType: StrengthArrowType | 'all';

  constructor() {
    super();
    this.arrows = [];
    this.selectedId = '';
    this.editMode = false;
    this.form = emptyForm();
    this.saving = false;
    this.error = '';
    this.confirmDeleteId = '';
    this.showPreview = false;
    this.filterType = 'all';
  }

  override connectedCallback() {
    super.connectedCallback();
    this._load();
  }

  async _load() {
    try {
      this.arrows = await listStrengthArrows();
    } catch (e) {
      this.error = String(e);
    }
  }

  _startNew() {
    this.selectedId = '';
    this.form = emptyForm();
    this.editMode = true;
    this.showPreview = false;
    this.error = '';
    this.confirmDeleteId = '';
  }

  _select(a: StrengthArrow) {
    this.selectedId = a.id;
    this.form = arrowToForm(a);
    this.editMode = false;
    this.showPreview = false;
    this.error = '';
    this.confirmDeleteId = '';
  }

  async _save() {
    this.saving = true;
    this.error = '';
    try {
      const f = this.form;
      const relatedEpisodeIds = parseRelatedIds(f.relatedEpisodeIds);
      const occurredAt = f.occurredAt.trim() || null;
      const note = f.note.trim() || null;

      if (this.selectedId) {
        const updated = await updateStrengthArrow(this.selectedId, {
          type: f.type,
          description: f.description,
          source: f.source,
          occurredAt,
          relatedEpisodeIds,
          note,
        });
        this.arrows = this.arrows.map((a) => (a.id === updated.id ? updated : a));
        this._select(updated);
      } else {
        const created = await createStrengthArrow({
          type: f.type,
          description: f.description,
          source: f.source,
          occurredAt,
          relatedEpisodeIds,
          note,
        });
        this.arrows = [...this.arrows, created];
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
      await deleteStrengthArrow(id);
      this.arrows = this.arrows.filter((a) => a.id !== id);
      this.selectedId = '';
      this.editMode = false;
      this.confirmDeleteId = '';
      this.form = emptyForm();
    } catch (e) {
      this.error = String(e);
    }
  }

  _copyMarkdown() {
    const md = toStrengthArrowMarkdown(this.arrows);
    navigator.clipboard.writeText(md).catch(() => {});
  }

  _filteredArrows(): StrengthArrow[] {
    if (this.filterType === 'all') return this.arrows;
    return this.arrows.filter((a) => a.type === this.filterType);
  }

  static override styles = css`
    :host { display: block; }
    .layout { display: flex; gap: 1.5rem; padding: 1.5rem; }
    .sidebar { width: 260px; flex-shrink: 0; }
    .main { flex: 1; min-width: 0; max-width: 700px; }
    .btn-new {
      width: 100%;
      padding: 0.4rem;
      font-size: 0.875rem;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
      margin-bottom: 0.8rem;
    }
    .filter-tabs {
      display: flex;
      gap: 0.3rem;
      flex-wrap: wrap;
      margin-bottom: 0.8rem;
    }
    .filter-tab {
      padding: 0.25rem 0.6rem;
      font-size: 0.78rem;
      background: #fff;
      color: #555;
      border: 1px solid #ccc;
      border-radius: 0.25rem;
      cursor: pointer;
    }
    .filter-tab.active {
      background: #1a1a1a;
      color: #fff;
      border-color: #1a1a1a;
    }
    .list-item {
      padding: 0.5rem 0.7rem;
      border: 1px solid #e0e0e0;
      border-radius: 0.3rem;
      margin-bottom: 0.4rem;
      cursor: pointer;
      font-size: 0.875rem;
    }
    .list-item.active { border-color: #1a1a1a; background: #f5f5f5; }
    .list-item-type { font-size: 0.75rem; color: #888; margin-bottom: 0.2rem; }
    .list-item-desc { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .list-item-source { font-size: 0.8rem; color: #777; }
    h2 { margin: 0 0 1rem; font-size: 1.1rem; }
    .section {
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 1.2rem;
      margin-bottom: 1.2rem;
    }
    .section-title { font-weight: 600; font-size: 1rem; margin: 0 0 1rem; }
    label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 0.2rem; }
    input[type="text"], textarea, select {
      width: 100%;
      box-sizing: border-box;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      padding: 0.4rem 0.6rem;
      margin-bottom: 0.6rem;
    }
    textarea { resize: vertical; min-height: 56px; }
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
    .type-badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 0.6rem;
    }
    .type-badge.interest { background: #e8f4fd; color: #0066cc; }
    .type-badge.evaluation { background: #e8fde8; color: #006600; }
    .type-badge.request { background: #fdf3e8; color: #cc6600; }
    .detail-field { margin-bottom: 0.4rem; font-size: 0.9rem; }
    .detail-label { font-size: 0.78rem; color: #888; }
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
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.8rem; }
    .empty-hint { color: #888; font-size: 0.9rem; }
    .hint { font-size: 0.8rem; color: #888; margin-top: -0.4rem; margin-bottom: 0.6rem; }
  `;

  override render() {
    const filtered = this._filteredArrows();
    return html`
      <div class="layout">
        <div class="sidebar">
          <button class="btn-new" @click=${this._startNew}>＋ 新規追加</button>
          <div class="filter-tabs">
            ${(['all', 'interest', 'evaluation', 'request'] as const).map(
              (t) => html`
                <button
                  class="filter-tab ${this.filterType === t ? 'active' : ''}"
                  @click=${() => {
                    this.filterType = t;
                  }}
                >${t === 'all' ? 'すべて' : TYPE_LABELS[t].split('（')[0]}</button>
              `,
            )}
          </div>
          ${filtered.map(
            (a) => html`
              <div
                class="list-item ${this.selectedId === a.id ? 'active' : ''}"
                @click=${() => this._select(a)}
              >
                <div class="list-item-type">${TYPE_LABELS[a.type]}</div>
                <div class="list-item-desc">${a.description || '（未入力）'}</div>
                <div class="list-item-source">${a.source || ''}</div>
              </div>
            `,
          )}
          ${filtered.length === 0 ? html`<p class="empty-hint">矢印がありません</p>` : ''}
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
      return html`<p class="empty-hint">左のリストから選択するか、新規追加してください。</p>`;
    }
    const a = this.arrows.find((x) => x.id === this.selectedId);
    if (!a) return html``;

    return html`
      <h2>${a.description || '（説明未入力）'}</h2>
      <span class="type-badge ${a.type}">${TYPE_LABELS[a.type]}</span>
      <div class="btn-row">
        <button class="edit-btn" @click=${() => {
          this.editMode = true;
        }}>編集</button>
        <button class="copy-btn" @click=${() => {
          this.showPreview = !this.showPreview;
        }}>
          ${this.showPreview ? 'プレビュー非表示' : 'Markdown プレビュー（全件）'}
        </button>
        <button class="del-btn" @click=${() => this._delete(a.id)}>
          ${this.confirmDeleteId === a.id ? '本当に削除' : '削除'}
        </button>
      </div>
      <div class="section">
        <div class="section-title">詳細</div>
        <div class="detail-field"><span class="detail-label">相手: </span>${a.source || '（未入力）'}</div>
        ${a.occurredAt ? html`<div class="detail-field"><span class="detail-label">時期: </span>${a.occurredAt}</div>` : ''}
        ${
          a.relatedEpisodeIds.length > 0
            ? html`<div class="detail-field"><span class="detail-label">関連エピソード: </span>${a.relatedEpisodeIds.join(', ')}</div>`
            : ''
        }
        ${a.note ? html`<div class="detail-field"><span class="detail-label">メモ: </span>${a.note}</div>` : ''}
      </div>
      ${this.showPreview ? this._renderPreview() : ''}
    `;
  }

  _renderPreview() {
    const md = toStrengthArrowMarkdown(this.arrows);
    return html`
      <div class="section">
        <div class="section-title" style="display:flex;justify-content:space-between;align-items:center;">
          <span>Markdown プレビュー（全件）</span>
          <button class="copy-btn" @click=${this._copyMarkdown}>コピー</button>
        </div>
        <div class="preview-box">${md}</div>
      </div>
    `;
  }

  _renderForm() {
    const f = this.form;
    return html`
      <h2>${this.selectedId ? '編集' : '新規追加'} — 三つの矢印</h2>
      <div class="section">
        <div class="section-title">矢印の種類</div>
        <label>タイプ</label>
        <select .value=${f.type}
          @change=${(e: Event) => {
            this.form = { ...f, type: (e.target as HTMLSelectElement).value as StrengthArrowType };
          }}>
          <option value="interest">興味（質問された経験）</option>
          <option value="evaluation">評価（褒められた経験）</option>
          <option value="request">依頼（頼まれた経験）</option>
        </select>
        <label>内容（何を聞かれた・褒められた・頼まれたか）</label>
        <textarea
          placeholder=${TYPE_PLACEHOLDERS[f.type]}
          .value=${f.description}
          @input=${(e: Event) => {
            this.form = { ...f, description: (e.target as HTMLTextAreaElement).value };
          }}></textarea>
        <label>相手（誰から）</label>
        <input type="text" placeholder="例: 営業部の先輩" .value=${f.source}
          @input=${(e: Event) => {
            this.form = { ...f, source: (e.target as HTMLInputElement).value };
          }} />
        <label>時期（任意）</label>
        <input type="text" placeholder="例: 2024-03 または 入社 3 年目" .value=${f.occurredAt}
          @input=${(e: Event) => {
            this.form = { ...f, occurredAt: (e.target as HTMLInputElement).value };
          }} />
        <label>関連エピソード ID（任意・カンマ区切り）</label>
        <input type="text" placeholder="例: 01EP0001, 01EP0002" .value=${f.relatedEpisodeIds}
          @input=${(e: Event) => {
            this.form = { ...f, relatedEpisodeIds: (e.target as HTMLInputElement).value };
          }} />
        <p class="hint">エピソードタブの ID をカンマ区切りで入力してください</p>
        <label>メモ（任意）</label>
        <textarea placeholder="面接で補足したいことなど" .value=${f.note}
          @input=${(e: Event) => {
            this.form = { ...f, note: (e.target as HTMLTextAreaElement).value };
          }}></textarea>
      </div>
      <div class="btn-row">
        <button class="save-btn" ?disabled=${this.saving} @click=${this._save}>
          ${this.saving ? '保存中…' : '保存'}
        </button>
        ${
          this.selectedId
            ? html`
            <button class="edit-btn" @click=${() => {
              this.editMode = false;
              this.showPreview = false;
              const a = this.arrows.find((x) => x.id === this.selectedId);
              if (a) this.form = arrowToForm(a);
            }}>キャンセル</button>
          `
            : ''
        }
      </div>
    `;
  }
}

customElements.define('strength-arrow-view', StrengthArrowView);

declare global {
  interface HTMLElementTagNameMap {
    'strength-arrow-view': StrengthArrowView;
  }
}
