import type { CompanyCertification, JobTarget } from '@episfolio/kernel';
import { toCompanyCertificationMarkdown } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createCompanyCertification,
  deleteCompanyCertification,
  listCompanyCertificationsByJobTarget,
  updateCompanyCertification,
} from './ipc/company-certifications.js';
import { listJobTargets } from './ipc/job-targets.js';

type FormState = {
  hasKurumin: boolean;
  hasPlatinumKurumin: boolean;
  hasTomoni: boolean;
  eruboshiLevel: '' | '1' | '2' | '3';
  hasPlatinumEruboshi: boolean;
  note: string;
};

function emptyForm(): FormState {
  return {
    hasKurumin: false,
    hasPlatinumKurumin: false,
    hasTomoni: false,
    eruboshiLevel: '',
    hasPlatinumEruboshi: false,
    note: '',
  };
}

function recordToForm(r: CompanyCertification): FormState {
  return {
    hasKurumin: r.hasKurumin,
    hasPlatinumKurumin: r.hasPlatinumKurumin,
    hasTomoni: r.hasTomoni,
    eruboshiLevel:
      r.eruboshiLevel === 1 ? '1' : r.eruboshiLevel === 2 ? '2' : r.eruboshiLevel === 3 ? '3' : '',
    hasPlatinumEruboshi: r.hasPlatinumEruboshi,
    note: r.note ?? '',
  };
}

function nullable(s: string): string | null {
  return s.trim() !== '' ? s.trim() : null;
}

function parseLevel(v: FormState['eruboshiLevel']): number | null {
  if (v === '1') return 1;
  if (v === '2') return 2;
  if (v === '3') return 3;
  return null;
}

export class CompanyCertificationView extends LitElement {
  static override properties = {
    _jobTargets: { state: true },
    _selectedJobTargetId: { state: true },
    _record: { state: true },
    _form: { state: true },
    _saving: { state: true },
    _error: { state: true },
    _deleteConfirmId: { state: true },
    _showPreview: { state: true },
  };

  declare _jobTargets: JobTarget[];
  declare _selectedJobTargetId: string;
  declare _record: CompanyCertification | null;
  declare _form: FormState;
  declare _saving: boolean;
  declare _error: string;
  declare _deleteConfirmId: string;
  declare _showPreview: boolean;

  constructor() {
    super();
    this._jobTargets = [];
    this._selectedJobTargetId = '';
    this._record = null;
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
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1rem; margin-bottom: 1rem; }
    .form-full { grid-column: 1 / -1; }
    label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 0.25rem; }
    input, select, textarea {
      width: 100%; box-sizing: border-box;
      padding: 0.4rem 0.7rem; font-size: 0.9rem;
      border: 1px solid #ccc; border-radius: 0.3rem;
    }
    textarea { resize: vertical; min-height: 4rem; }
    .actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
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
    .preview {
      background: #f8f8f8; border: 1px solid #ddd; border-radius: 0.4rem;
      padding: 1rem; white-space: pre-wrap; font-size: 0.85rem; font-family: monospace;
    }
    .no-target { color: #888; font-size: 0.9rem; margin-top: 1rem; }
    .status-badge {
      display: inline-block; padding: 0.15rem 0.6rem;
      border-radius: 0.25rem; font-size: 0.75rem;
      background: #d4edda; color: #155724;
    }
    .checkbox-row {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0;
    }
    .checkbox-row input[type="checkbox"] { width: auto; }
    .checkbox-label { font-size: 0.9rem; color: #333; }
    .flag-section {
      border: 1px solid #e0e0e0; border-radius: 0.4rem;
      padding: 0.75rem 1rem; background: #fafafa;
    }
    .flag-section-title { font-size: 0.8rem; color: #888; margin-bottom: 0.5rem; font-weight: 600; }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    await this._loadJobTargets();
  }

  private async _loadJobTargets() {
    try {
      this._jobTargets = await listJobTargets();
    } catch (e) {
      this._error = String(e);
    }
  }

  private async _onJobTargetChange(e: Event) {
    this._selectedJobTargetId = (e.target as HTMLSelectElement).value;
    this._record = null;
    this._form = emptyForm();
    this._deleteConfirmId = '';
    this._showPreview = false;
    this._error = '';
    if (this._selectedJobTargetId) {
      await this._loadRecord();
    }
  }

  private async _loadRecord() {
    try {
      const records = await listCompanyCertificationsByJobTarget(this._selectedJobTargetId);
      if (records.length > 0) {
        const first = records[0];
        if (first) {
          this._record = first;
          this._form = recordToForm(first);
        }
      }
    } catch (e) {
      this._error = String(e);
    }
  }

  private async _handleSave() {
    if (!this._selectedJobTargetId) return;
    this._saving = true;
    this._error = '';
    try {
      const payload = {
        hasKurumin: this._form.hasKurumin,
        hasPlatinumKurumin: this._form.hasPlatinumKurumin,
        hasTomoni: this._form.hasTomoni,
        eruboshiLevel: parseLevel(this._form.eruboshiLevel),
        hasPlatinumEruboshi: this._form.hasPlatinumEruboshi,
        note: nullable(this._form.note),
      };
      if (this._record) {
        await updateCompanyCertification(this._record.id, payload);
      } else {
        await createCompanyCertification({ jobTargetId: this._selectedJobTargetId, ...payload });
      }
      await this._loadRecord();
    } catch (e) {
      this._error = String(e);
    } finally {
      this._saving = false;
    }
  }

  private _requestDelete() {
    if (this._record) this._deleteConfirmId = this._record.id;
  }

  private _cancelDelete() {
    this._deleteConfirmId = '';
  }

  private async _confirmDelete() {
    if (!this._record) return;
    this._saving = true;
    this._error = '';
    try {
      await deleteCompanyCertification(this._record.id);
      this._record = null;
      this._form = emptyForm();
      this._deleteConfirmId = '';
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
        <h1>認定・認証チェック</h1>

        <div>
          <label>対象求人</label>
          <select @change=${this._onJobTargetChange}>
            <option value="">― 求人を選択 ―</option>
            ${this._jobTargets.map(
              (t) => html`
                <option value=${t.id} ?selected=${t.id === this._selectedJobTargetId}>
                  ${t.companyName} — ${t.jobTitle}
                </option>
              `,
            )}
          </select>
        </div>

        ${
          !this._selectedJobTargetId
            ? html`<p class="no-target">求人を選択してください</p>`
            : html`
          <hr class="divider" />

          ${
            this._record
              ? html`<p style="margin:0 0 1rem;font-size:0.85rem;color:#555;">
                  <span class="status-badge">記録あり</span>
                  　最終更新: ${this._record.updatedAt.replace('T', ' ').replace('Z', '')}
                </p>`
              : html`<p style="margin:0 0 1rem;font-size:0.85rem;color:#888;">
                  まだ記録がありません。保存すると新規作成されます。
                </p>`
          }

          <div class="form-grid">
            <div class="form-full">
              <div class="flag-section">
                <div class="flag-section-title">くるみん認定（厚生労働省・子育て支援）</div>
                <div class="checkbox-row">
                  <input
                    type="checkbox"
                    id="kurumin"
                    .checked=${this._form.hasKurumin}
                    @change=${(e: Event) =>
                      this._setField('hasKurumin', (e.target as HTMLInputElement).checked)}
                  />
                  <label for="kurumin" class="checkbox-label" style="margin:0;">
                    🌸 くるみん認定取得
                  </label>
                </div>
                <div class="checkbox-row">
                  <input
                    type="checkbox"
                    id="platinum-kurumin"
                    .checked=${this._form.hasPlatinumKurumin}
                    @change=${(e: Event) =>
                      this._setField('hasPlatinumKurumin', (e.target as HTMLInputElement).checked)}
                  />
                  <label for="platinum-kurumin" class="checkbox-label" style="margin:0;">
                    🌸 プラチナくるみん認定取得（より高い基準）
                  </label>
                </div>
              </div>
            </div>

            <div class="form-full">
              <div class="flag-section">
                <div class="flag-section-title">トモニンマーク（厚生労働省・介護支援）</div>
                <div class="checkbox-row">
                  <input
                    type="checkbox"
                    id="tomoni"
                    .checked=${this._form.hasTomoni}
                    @change=${(e: Event) =>
                      this._setField('hasTomoni', (e.target as HTMLInputElement).checked)}
                  />
                  <label for="tomoni" class="checkbox-label" style="margin:0;">
                    🤝 トモニンマーク取得（介護しながら働ける職場）
                  </label>
                </div>
              </div>
            </div>

            <div class="form-full">
              <div class="flag-section">
                <div class="flag-section-title">えるぼし認定（女性活躍推進法）</div>
                <div style="margin-bottom:0.5rem;">
                  <label style="margin:0 0 0.25rem;">認定レベル</label>
                  <select
                    .value=${this._form.eruboshiLevel}
                    @change=${(e: Event) =>
                      this._setField(
                        'eruboshiLevel',
                        (e.target as HTMLSelectElement).value as FormState['eruboshiLevel'],
                      )}
                  >
                    <option value="">― 未認定 ―</option>
                    <option value="1">⭐ レベル1（5項目中1〜2項目達成）</option>
                    <option value="2">⭐⭐ レベル2（5項目中3〜4項目達成）</option>
                    <option value="3">⭐⭐⭐ レベル3（5項目全て達成）</option>
                  </select>
                </div>
                <div class="checkbox-row">
                  <input
                    type="checkbox"
                    id="platinum-eruboshi"
                    .checked=${this._form.hasPlatinumEruboshi}
                    @change=${(e: Event) =>
                      this._setField('hasPlatinumEruboshi', (e.target as HTMLInputElement).checked)}
                  />
                  <label for="platinum-eruboshi" class="checkbox-label" style="margin:0;">
                    ⭐⭐⭐⭐ プラチナえるぼし認定（最高水準）
                  </label>
                </div>
              </div>
            </div>

            <div class="form-full">
              <label>総合メモ</label>
              <textarea
                .value=${this._form.note}
                @input=${(e: Event) =>
                  this._setField('note', (e.target as HTMLTextAreaElement).value)}
                placeholder="くるみん・えるぼし認定状況と、面接時にどう活用するか…"
              ></textarea>
            </div>
          </div>

          ${this._error ? html`<p class="error">${this._error}</p>` : ''}

          <div class="actions">
            <button class="primary" @click=${this._handleSave} ?disabled=${this._saving}>
              ${this._record ? '更新' : '保存'}
            </button>
            ${
              this._record
                ? this._deleteConfirmId === this._record.id
                  ? html`
                    <button class="danger" @click=${this._confirmDelete}>本当に削除</button>
                    <button class="secondary" @click=${this._cancelDelete}>キャンセル</button>
                  `
                  : html`<button class="secondary" @click=${this._requestDelete}>削除</button>`
                : ''
            }
            ${
              this._record
                ? html`
                  <button class="secondary" @click=${() => {
                    this._showPreview = !this._showPreview;
                  }}>
                    ${this._showPreview ? '編集に戻る' : 'Markdown プレビュー'}
                  </button>
                `
                : ''
            }
          </div>

          ${
            this._showPreview && this._record
              ? html`
                <hr class="divider" />
                <pre class="preview">${toCompanyCertificationMarkdown(this._record)}</pre>
              `
              : ''
          }
        `
        }
      </div>
    `;
  }
}

customElements.define('company-certification-view', CompanyCertificationView);
