import type { LifeTimelineEntry } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createLifeTimelineEntry,
  deleteLifeTimelineEntry,
  listLifeTimelineEntries,
  updateLifeTimelineEntry,
} from './ipc/life-timeline.js';

const CATEGORIES = [
  { value: 'education', label: '学業' },
  { value: 'work', label: '仕事' },
  { value: 'family', label: '家族' },
  { value: 'health', label: '健康' },
  { value: 'hobby', label: '趣味' },
  { value: 'other', label: 'その他' },
] as const;

type FormState = {
  ageRangeStart: string;
  ageRangeEnd: string;
  yearStart: string;
  yearEnd: string;
  category: string;
  summary: string;
  detail: string;
  tags: string;
};

function emptyForm(): FormState {
  return {
    ageRangeStart: '',
    ageRangeEnd: '',
    yearStart: '',
    yearEnd: '',
    category: 'other',
    summary: '',
    detail: '',
    tags: '',
  };
}

class LifeTimelineView extends LitElement {
  static override properties = {
    entries: { state: true },
    form: { state: true },
    editingId: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteId: { state: true },
  };

  declare entries: LifeTimelineEntry[];
  declare form: FormState;
  declare editingId: string;
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteId: string;

  constructor() {
    super();
    this.entries = [];
    this.form = emptyForm();
    this.editingId = '';
    this.saving = false;
    this.error = '';
    this.confirmDeleteId = '';
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
    input, select, textarea {
      width: 100%;
      padding: 0.4rem 0.6rem;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      box-sizing: border-box;
    }
    textarea { min-height: 5rem; resize: vertical; }
    .actions { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
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
      color: #333;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .entry-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .entry-card {
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 0.75rem 1rem;
    }
    .entry-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .entry-meta { font-size: 0.8rem; color: #888; margin-bottom: 0.25rem; }
    .entry-summary { font-size: 0.95rem; font-weight: 600; }
    .entry-detail { font-size: 0.85rem; color: #555; margin-top: 0.25rem; white-space: pre-wrap; }
    .entry-tags { display: flex; gap: 0.3rem; flex-wrap: wrap; margin-top: 0.4rem; }
    .tag {
      background: #f0f0f0;
      border-radius: 999px;
      padding: 0.1rem 0.5rem;
      font-size: 0.75rem;
      color: #555;
    }
    .entry-btns { display: flex; gap: 0.4rem; flex-shrink: 0; }
    button.edit-btn, button.del-btn {
      font-size: 0.8rem;
      padding: 0.2rem 0.6rem;
      border: 1px solid #ccc;
      border-radius: 0.25rem;
      cursor: pointer;
      background: #fff;
    }
    button.del-btn { color: #c00; border-color: #f5c0c0; }
    button.del-btn.confirm { background: #c00; color: #fff; border-color: #c00; }
    .empty { color: #888; font-size: 0.9rem; }
    .category-badge {
      display: inline-block;
      font-size: 0.75rem;
      padding: 0.1rem 0.5rem;
      border-radius: 0.25rem;
      background: #e8f0fe;
      color: #1a56c4;
      margin-right: 0.4rem;
    }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    await this.load();
  }

  private async load() {
    try {
      this.entries = await listLifeTimelineEntries();
    } catch (e) {
      this.error = String(e);
    }
  }

  private get formValid(): boolean {
    return (
      this.form.summary.trim().length > 0 &&
      this.form.ageRangeStart !== '' &&
      this.form.ageRangeEnd !== ''
    );
  }

  private async handleSave() {
    if (!this.formValid) return;
    this.saving = true;
    this.error = '';
    try {
      const ageStart = Number(this.form.ageRangeStart);
      const ageEnd = Number(this.form.ageRangeEnd);
      const yearStart = this.form.yearStart !== '' ? Number(this.form.yearStart) : null;
      const yearEnd = this.form.yearEnd !== '' ? Number(this.form.yearEnd) : null;
      const tags = this.form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (this.editingId) {
        await updateLifeTimelineEntry(this.editingId, {
          ageRangeStart: ageStart,
          ageRangeEnd: ageEnd,
          yearStart,
          yearEnd,
          category: this.form.category as LifeTimelineEntry['category'],
          summary: this.form.summary.trim(),
          detail: this.form.detail,
          tags,
        });
      } else {
        await createLifeTimelineEntry({
          ageRangeStart: ageStart,
          ageRangeEnd: ageEnd,
          yearStart,
          yearEnd,
          category: this.form.category,
          summary: this.form.summary.trim(),
          detail: this.form.detail,
          tags,
        });
      }

      this.form = emptyForm();
      this.editingId = '';
      await this.load();
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private handleEdit(entry: LifeTimelineEntry) {
    this.editingId = entry.id;
    this.form = {
      ageRangeStart: String(entry.ageRangeStart),
      ageRangeEnd: String(entry.ageRangeEnd),
      yearStart: entry.yearStart != null ? String(entry.yearStart) : '',
      yearEnd: entry.yearEnd != null ? String(entry.yearEnd) : '',
      category: entry.category,
      summary: entry.summary,
      detail: entry.detail,
      tags: entry.tags.join(', '),
    };
    this.confirmDeleteId = '';
  }

  private handleCancel() {
    this.form = emptyForm();
    this.editingId = '';
    this.error = '';
  }

  private handleDeleteClick(id: string) {
    this.confirmDeleteId = this.confirmDeleteId === id ? '' : id;
  }

  private async handleDeleteConfirm(id: string) {
    this.error = '';
    try {
      await deleteLifeTimelineEntry(id);
      this.confirmDeleteId = '';
      if (this.editingId === id) {
        this.form = emptyForm();
        this.editingId = '';
      }
      await this.load();
    } catch (e) {
      this.error = String(e);
    }
  }

  private setField(field: keyof FormState, value: string) {
    this.form = { ...this.form, [field]: value };
  }

  private categoryLabel(value: string): string {
    return CATEGORIES.find((c) => c.value === value)?.label ?? value;
  }

  override render() {
    return html`
      <div class="panel">
        <h1>人生年表</h1>

        <div class="form-grid">
          <div>
            <label>開始年齢 *</label>
            <input
              type="number"
              min="0"
              .value=${this.form.ageRangeStart}
              @input=${(e: Event) => this.setField('ageRangeStart', (e.target as HTMLInputElement).value)}
              placeholder="例: 22"
            />
          </div>
          <div>
            <label>終了年齢 *</label>
            <input
              type="number"
              min="0"
              .value=${this.form.ageRangeEnd}
              @input=${(e: Event) => this.setField('ageRangeEnd', (e.target as HTMLInputElement).value)}
              placeholder="例: 25"
            />
          </div>
          <div>
            <label>開始年（任意）</label>
            <input
              type="number"
              .value=${this.form.yearStart}
              @input=${(e: Event) => this.setField('yearStart', (e.target as HTMLInputElement).value)}
              placeholder="例: 2010"
            />
          </div>
          <div>
            <label>終了年（任意）</label>
            <input
              type="number"
              .value=${this.form.yearEnd}
              @input=${(e: Event) => this.setField('yearEnd', (e.target as HTMLInputElement).value)}
              placeholder="例: 2013"
            />
          </div>
          <div>
            <label>カテゴリ *</label>
            <select
              .value=${this.form.category}
              @change=${(e: Event) => this.setField('category', (e.target as HTMLSelectElement).value)}
            >
              ${CATEGORIES.map(
                (c) =>
                  html`<option value=${c.value} ?selected=${this.form.category === c.value}>${c.label}</option>`,
              )}
            </select>
          </div>
          <div>
            <label>タグ（カンマ区切り）</label>
            <input
              type="text"
              .value=${this.form.tags}
              @input=${(e: Event) => this.setField('tags', (e.target as HTMLInputElement).value)}
              placeholder="例: 転職, 留学"
            />
          </div>
          <div class="full">
            <label>概要 *</label>
            <input
              type="text"
              .value=${this.form.summary}
              @input=${(e: Event) => this.setField('summary', (e.target as HTMLInputElement).value)}
              placeholder="この時期を一言で"
            />
          </div>
          <div class="full">
            <label>詳細</label>
            <textarea
              .value=${this.form.detail}
              @input=${(e: Event) => this.setField('detail', (e.target as HTMLTextAreaElement).value)}
              placeholder="出来事の詳細・気づきなど"
            ></textarea>
          </div>
        </div>

        ${this.error ? html`<p class="error">${this.error}</p>` : ''}

        <div class="actions">
          <button
            class="save-btn"
            @click=${this.handleSave}
            ?disabled=${this.saving || !this.formValid}
          >${this.editingId ? '更新' : '追加'}</button>
          ${
            this.editingId
              ? html`<button class="cancel-btn" @click=${this.handleCancel}>キャンセル</button>`
              : ''
          }
        </div>

        ${
          this.entries.length === 0
            ? html`<p class="empty">年表エントリはまだありません</p>`
            : html`
            <div class="entry-list">
              ${this.entries.map((entry) => this.renderEntry(entry))}
            </div>
          `
        }
      </div>
    `;
  }

  private renderEntry(entry: LifeTimelineEntry) {
    const isDeletingThis = this.confirmDeleteId === entry.id;
    return html`
      <div class="entry-card">
        <div class="entry-header">
          <div>
            <div class="entry-meta">
              <span class="category-badge">${this.categoryLabel(entry.category)}</span>
              ${entry.ageRangeStart}〜${entry.ageRangeEnd}歳
              ${entry.yearStart != null ? html` (${entry.yearStart}${entry.yearEnd != null ? `〜${entry.yearEnd}` : ''}年)` : ''}
            </div>
            <div class="entry-summary">${entry.summary}</div>
            ${entry.detail ? html`<div class="entry-detail">${entry.detail}</div>` : ''}
            ${
              entry.tags.length > 0
                ? html`
                <div class="entry-tags">
                  ${entry.tags.map((t) => html`<span class="tag">${t}</span>`)}
                </div>
              `
                : ''
            }
          </div>
          <div class="entry-btns">
            <button class="edit-btn" @click=${() => this.handleEdit(entry)}>編集</button>
            <button
              class=${`del-btn${isDeletingThis ? ' confirm' : ''}`}
              @click=${() => (isDeletingThis ? this.handleDeleteConfirm(entry.id) : this.handleDeleteClick(entry.id))}
            >${isDeletingThis ? '本当に削除' : '削除'}</button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('life-timeline-view', LifeTimelineView);
