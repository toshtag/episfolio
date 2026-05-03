import type { BlankType, StrengthFromWeakness } from '@episfolio/kernel';
import { toStrengthFromWeaknessMarkdown } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createStrengthFromWeakness,
  deleteStrengthFromWeakness,
  listStrengthFromWeakness,
  updateStrengthFromWeakness,
} from './ipc/strength-from-weakness.js';

const BLANK_TYPE_LABELS: Record<BlankType, string> = {
  leave: '休職',
  unemployed: '無職期間',
  early_resign: '早期退職',
  other: 'その他',
};

type FormState = {
  weaknessLabel: string;
  blankType: BlankType | '';
  background: string;
  reframe: string;
  targetCompanyProfile: string;
  note: string;
};

function recordToForm(r: StrengthFromWeakness): FormState {
  return {
    weaknessLabel: r.weaknessLabel,
    blankType: r.blankType ?? '',
    background: r.background,
    reframe: r.reframe,
    targetCompanyProfile: r.targetCompanyProfile,
    note: r.note ?? '',
  };
}

function emptyForm(): FormState {
  return {
    weaknessLabel: '',
    blankType: '',
    background: '',
    reframe: '',
    targetCompanyProfile: '',
    note: '',
  };
}

class StrengthFromWeaknessView extends LitElement {
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

  declare records: StrengthFromWeakness[];
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
    this.form = emptyForm();
    this.saving = false;
    this.error = '';
    this.confirmDeleteId = '';
    this.showPreview = false;
  }

  static override styles = css`
    :host { display: block; font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; max-width: 720px; }
    .panel { padding: 2rem; }
    h1 { margin: 0 0 1.5rem; font-size: 1.4rem; }
    h2 { margin: 0 0 1rem; font-size: 1.1rem; }
    .toolbar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    button.new-btn { padding: 0.4rem 0.9rem; font-size: 0.9rem; background: #1a1a1a; color: #fff; border: none; border-radius: 0.3rem; cursor: pointer; }
    button.new-btn:hover { background: #333; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 2px solid #ddd; }
    td { padding: 0.4rem 0.5rem; border-bottom: 1px solid #eee; }
    tbody tr { cursor: pointer; }
    tbody tr:hover td { background: #f6f6f6; }
    .empty { color: #888; font-size: 0.9rem; }
    .form-grid { display: flex; flex-direction: column; gap: 1rem; }
    .field label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem; color: #555; }
    .field input, .field select, .field textarea {
      width: 100%; box-sizing: border-box;
      padding: 0.4rem 0.6rem; font-size: 0.9rem;
      border: 1px solid #ccc; border-radius: 0.3rem;
    }
    .field textarea { resize: vertical; min-height: 80px; }
    .actions { display: flex; gap: 0.5rem; margin-top: 1.5rem; }
    button.save-btn { padding: 0.4rem 0.9rem; background: #1a1a1a; color: #fff; border: none; border-radius: 0.3rem; cursor: pointer; font-size: 0.9rem; }
    button.save-btn:disabled { opacity: 0.5; cursor: default; }
    button.cancel-btn { padding: 0.4rem 0.9rem; background: #eee; color: #333; border: none; border-radius: 0.3rem; cursor: pointer; font-size: 0.9rem; }
    button.edit-btn { padding: 0.3rem 0.7rem; background: #f0f0f0; border: 1px solid #ccc; border-radius: 0.3rem; cursor: pointer; font-size: 0.85rem; }
    button.delete-btn { padding: 0.3rem 0.7rem; background: #fee; border: 1px solid #fcc; color: #c00; border-radius: 0.3rem; cursor: pointer; font-size: 0.85rem; }
    button.delete-confirm-btn { padding: 0.3rem 0.7rem; background: #c00; border: none; color: #fff; border-radius: 0.3rem; cursor: pointer; font-size: 0.85rem; }
    button.back-btn { padding: 0.3rem 0.7rem; background: #eee; border: none; border-radius: 0.3rem; cursor: pointer; font-size: 0.85rem; margin-bottom: 1rem; }
    button.preview-btn { padding: 0.3rem 0.7rem; background: #e8f0fe; border: 1px solid #aac; border-radius: 0.3rem; cursor: pointer; font-size: 0.85rem; }
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 0.3rem; font-size: 0.78rem; font-weight: 600; }
    .badge-leave { background: #e3f2fd; color: #1565c0; }
    .badge-unemployed { background: #f3e5f5; color: #6a1b9a; }
    .badge-early-resign { background: #fff3e0; color: #e65100; }
    .badge-other { background: #f1f8e9; color: #33691e; }
    .detail-section { margin-bottom: 1.5rem; }
    .detail-label { font-size: 0.82rem; font-weight: 600; color: #888; margin-bottom: 0.25rem; }
    .detail-value { font-size: 0.95rem; white-space: pre-wrap; }
    .preview-box { background: #f8f8f8; border: 1px solid #ddd; border-radius: 0.3rem; padding: 1rem; font-size: 0.85rem; white-space: pre-wrap; font-family: monospace; }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    await this.loadRecords();
  }

  private async loadRecords() {
    try {
      this.records = await listStrengthFromWeakness();
    } catch (e) {
      this.error = String(e);
    }
  }

  private handleNew() {
    this.selectedId = '';
    this.editMode = true;
    this.form = emptyForm();
    this.error = '';
  }

  private handleSelect(id: string) {
    this.selectedId = id;
    this.editMode = false;
    this.confirmDeleteId = '';
    this.showPreview = false;
  }

  private handleEdit() {
    const rec = this.records.find((r) => r.id === this.selectedId);
    if (!rec) return;
    this.form = recordToForm(rec);
    this.editMode = true;
    this.error = '';
  }

  private handleCancel() {
    if (this.selectedId) {
      this.editMode = false;
    } else {
      this.editMode = false;
    }
    this.error = '';
  }

  private async handleSave() {
    this.saving = true;
    this.error = '';
    const blankType = this.form.blankType !== '' ? (this.form.blankType as BlankType) : null;
    const note = this.form.note.trim() !== '' ? this.form.note.trim() : null;
    try {
      if (this.selectedId) {
        await updateStrengthFromWeakness(this.selectedId, {
          weaknessLabel: this.form.weaknessLabel,
          blankType,
          background: this.form.background,
          reframe: this.form.reframe,
          targetCompanyProfile: this.form.targetCompanyProfile,
          note,
        });
      } else {
        const created = await createStrengthFromWeakness({
          weaknessLabel: this.form.weaknessLabel,
          blankType,
          background: this.form.background,
          reframe: this.form.reframe,
          targetCompanyProfile: this.form.targetCompanyProfile,
          note,
        });
        this.selectedId = created.id;
      }
      await this.loadRecords();
      this.editMode = false;
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private handleDeleteRequest(id: string) {
    this.confirmDeleteId = id;
  }

  private async handleDeleteConfirm() {
    const id = this.confirmDeleteId;
    if (!id) return;
    try {
      await deleteStrengthFromWeakness(id);
      this.confirmDeleteId = '';
      this.selectedId = '';
      this.editMode = false;
      await this.loadRecords();
    } catch (e) {
      this.error = String(e);
    }
  }

  private handleDeleteCancel() {
    this.confirmDeleteId = '';
  }

  private badgeClass(blankType: BlankType | null): string {
    if (!blankType) return '';
    const map: Record<BlankType, string> = {
      leave: 'badge badge-leave',
      unemployed: 'badge badge-unemployed',
      early_resign: 'badge badge-early-resign',
      other: 'badge badge-other',
    };
    return map[blankType];
  }

  private renderList() {
    return html`
      <div class="panel">
        <h1>弱みを武器に変える</h1>
        <div class="toolbar">
          <button class="new-btn" @click=${this.handleNew}>＋ 新規追加</button>
        </div>
        ${this.error ? html`<p class="error">${this.error}</p>` : ''}
        ${
          this.records.length === 0
            ? html`<p class="empty">記録はまだありません</p>`
            : html`
            <table>
              <thead>
                <tr>
                  <th>弱みのラベル</th>
                  <th>種別</th>
                  <th>更新日</th>
                </tr>
              </thead>
              <tbody>
                ${this.records.map(
                  (r) => html`
                  <tr @click=${() => this.handleSelect(r.id)}>
                    <td>${r.weaknessLabel || '（未入力）'}</td>
                    <td>
                      ${
                        r.blankType
                          ? html`<span class=${this.badgeClass(r.blankType)}>${BLANK_TYPE_LABELS[r.blankType]}</span>`
                          : '—'
                      }
                    </td>
                    <td>${r.updatedAt.slice(0, 10)}</td>
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

  private renderForm() {
    const title = this.selectedId ? '編集' : '新規追加';
    return html`
      <div class="panel">
        <button class="back-btn" @click=${this.handleCancel}>← 戻る</button>
        <h1>${title}</h1>
        ${this.error ? html`<p class="error">${this.error}</p>` : ''}
        <div class="form-grid">
          <div class="field">
            <label>弱みのラベル</label>
            <input
              .value=${this.form.weaknessLabel}
              @input=${(e: Event) => {
                this.form = { ...this.form, weaknessLabel: (e.target as HTMLInputElement).value };
              }}
              placeholder="例: 1年での早期退職"
            />
          </div>
          <div class="field">
            <label>キャリアブランクの種別</label>
            <select
              .value=${this.form.blankType}
              @change=${(e: Event) => {
                this.form = {
                  ...this.form,
                  blankType: (e.target as HTMLSelectElement).value as BlankType | '',
                };
              }}
            >
              <option value="">（なし）</option>
              <option value="leave">休職</option>
              <option value="unemployed">無職期間</option>
              <option value="early_resign">早期退職</option>
              <option value="other">その他</option>
            </select>
          </div>
          <div class="field">
            <label>背景・状況</label>
            <textarea
              .value=${this.form.background}
              @input=${(e: Event) => {
                this.form = { ...this.form, background: (e.target as HTMLTextAreaElement).value };
              }}
              placeholder="その弱みが生まれた背景や状況を記入"
            ></textarea>
          </div>
          <div class="field">
            <label>発想転換後の言語化</label>
            <textarea
              .value=${this.form.reframe}
              @input=${(e: Event) => {
                this.form = { ...this.form, reframe: (e.target as HTMLTextAreaElement).value };
              }}
              placeholder="「弱み」を武器として語れる形に転換した言葉"
            ></textarea>
          </div>
          <div class="field">
            <label>受け入れてくれる会社像</label>
            <textarea
              .value=${this.form.targetCompanyProfile}
              @input=${(e: Event) => {
                this.form = {
                  ...this.form,
                  targetCompanyProfile: (e.target as HTMLTextAreaElement).value,
                };
              }}
              placeholder="この弱みを強みとして評価してくれる会社の特徴"
            ></textarea>
          </div>
          <div class="field">
            <label>メモ（任意）</label>
            <textarea
              .value=${this.form.note}
              @input=${(e: Event) => {
                this.form = { ...this.form, note: (e.target as HTMLTextAreaElement).value };
              }}
              placeholder="面接での補足など"
            ></textarea>
          </div>
        </div>
        <div class="actions">
          <button class="save-btn" @click=${this.handleSave} ?disabled=${this.saving}>
            ${this.saving ? '保存中…' : '保存'}
          </button>
          <button class="cancel-btn" @click=${this.handleCancel}>キャンセル</button>
        </div>
      </div>
    `;
  }

  private renderDetail() {
    const rec = this.records.find((r) => r.id === this.selectedId);
    if (!rec) return html`<div class="panel"><p class="empty">見つかりません</p></div>`;

    const md = toStrengthFromWeaknessMarkdown([rec]);
    return html`
      <div class="panel">
        <button class="back-btn" @click=${() => {
          this.selectedId = '';
        }}>← 一覧へ</button>
        <h1>${rec.weaknessLabel || '（未入力）'}</h1>
        <div style="display:flex;gap:0.5rem;margin-bottom:1rem;">
          <button class="edit-btn" @click=${this.handleEdit}>編集</button>
          ${
            this.confirmDeleteId === rec.id
              ? html`
              <button class="delete-confirm-btn" @click=${this.handleDeleteConfirm}>本当に削除</button>
              <button class="cancel-btn" @click=${this.handleDeleteCancel}>キャンセル</button>
            `
              : html`
              <button class="delete-btn" @click=${() => this.handleDeleteRequest(rec.id)}>削除</button>
            `
          }
          <button class="preview-btn" @click=${() => {
            this.showPreview = !this.showPreview;
          }}>
            ${this.showPreview ? 'プレビューを閉じる' : 'Markdown プレビュー'}
          </button>
        </div>
        ${this.error ? html`<p class="error">${this.error}</p>` : ''}

        ${
          this.showPreview
            ? html`<div class="preview-box">${md}</div>`
            : html`
            ${
              rec.blankType
                ? html`<div class="detail-section">
                  <div class="detail-label">種別</div>
                  <div><span class=${this.badgeClass(rec.blankType)}>${BLANK_TYPE_LABELS[rec.blankType]}</span></div>
                </div>`
                : ''
            }
            ${
              rec.background
                ? html`<div class="detail-section">
                  <div class="detail-label">背景・状況</div>
                  <div class="detail-value">${rec.background}</div>
                </div>`
                : ''
            }
            <div class="detail-section">
              <div class="detail-label">発想転換後の言語化</div>
              <div class="detail-value">${rec.reframe || '（未入力）'}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">受け入れてくれる会社像</div>
              <div class="detail-value">${rec.targetCompanyProfile || '（未入力）'}</div>
            </div>
            ${
              rec.note
                ? html`<div class="detail-section">
                  <div class="detail-label">メモ</div>
                  <div class="detail-value">${rec.note}</div>
                </div>`
                : ''
            }
          `
        }
      </div>
    `;
  }

  override render() {
    if (this.editMode) return this.renderForm();
    if (this.selectedId) return this.renderDetail();
    return this.renderList();
  }
}

customElements.define('strength-from-weakness-view', StrengthFromWeaknessView);
