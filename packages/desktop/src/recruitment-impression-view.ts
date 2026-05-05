import type { JobTarget, RecruitmentImpression, SensoryObservation } from '@episfolio/kernel';
import { toRecruitmentImpressionMarkdown } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import { listJobTargets } from './ipc/job-targets.js';
import {
  createRecruitmentImpression,
  deleteRecruitmentImpression,
  listRecruitmentImpressionsByJobTarget,
  updateRecruitmentImpression,
} from './ipc/recruitment-impressions.js';
import { waitForTauri } from './ipc/tauri-ready.js';

type FormState = {
  selectionProcessNote: string;
  officeAtmosphere: string;
  sensoryObservations: SensoryObservation[];
  lifestyleCompatibilityNote: string;
  redFlagsNote: string;
  overallImpression: string;
};

function emptyForm(): FormState {
  return {
    selectionProcessNote: '',
    officeAtmosphere: '',
    sensoryObservations: [],
    lifestyleCompatibilityNote: '',
    redFlagsNote: '',
    overallImpression: '',
  };
}

function recordToForm(r: RecruitmentImpression): FormState {
  return {
    selectionProcessNote: r.selectionProcessNote ?? '',
    officeAtmosphere: r.officeAtmosphere ?? '',
    sensoryObservations: r.sensoryObservations,
    lifestyleCompatibilityNote: r.lifestyleCompatibilityNote ?? '',
    redFlagsNote: r.redFlagsNote ?? '',
    overallImpression: r.overallImpression ?? '',
  };
}

function nullable(s: string): string | null {
  return s.trim() !== '' ? s.trim() : null;
}

export class RecruitmentImpressionView extends LitElement {
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
  declare _record: RecruitmentImpression | null;
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
    button.small {
      padding: 0.2rem 0.6rem; font-size: 0.8rem;
      background: #f0f0f0; color: #333;
      border: 1px solid #ccc; border-radius: 0.25rem; cursor: pointer;
    }
    .error { color: #c00; font-size: 0.85rem; margin: 0.5rem 0; }
    .divider { border: none; border-top: 1px solid #eee; margin: 1.5rem 0; }
    .entry-row {
      border: 1px solid #eee; border-radius: 0.4rem;
      padding: 0.75rem; margin-bottom: 0.5rem;
    }
    .entry-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 0.5rem;
    }
    .entry-label { font-size: 0.85rem; font-weight: 600; color: #555; }
    .preview {
      background: #f8f8f8; border: 1px solid #ddd; border-radius: 0.4rem;
      padding: 1rem; white-space: pre-wrap; font-size: 0.85rem; font-family: monospace;
    }
    .empty { color: #888; font-size: 0.9rem; }
    .no-target { color: #888; font-size: 0.9rem; margin-top: 1rem; }
    .status-badge {
      display: inline-block; padding: 0.15rem 0.6rem;
      border-radius: 0.25rem; font-size: 0.75rem;
      background: #d4edda; color: #155724;
    }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    if (!(await waitForTauri())) return;
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
      const records = await listRecruitmentImpressionsByJobTarget(this._selectedJobTargetId);
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
      const observations = this._form.sensoryObservations.filter(
        (o) => o.category.trim() !== '' || o.note.trim() !== '',
      );
      if (this._record) {
        await updateRecruitmentImpression(this._record.id, {
          selectionProcessNote: nullable(this._form.selectionProcessNote),
          officeAtmosphere: nullable(this._form.officeAtmosphere),
          sensoryObservations: observations,
          lifestyleCompatibilityNote: nullable(this._form.lifestyleCompatibilityNote),
          redFlagsNote: nullable(this._form.redFlagsNote),
          overallImpression: nullable(this._form.overallImpression),
        });
      } else {
        await createRecruitmentImpression({
          jobTargetId: this._selectedJobTargetId,
          selectionProcessNote: nullable(this._form.selectionProcessNote),
          officeAtmosphere: nullable(this._form.officeAtmosphere),
          sensoryObservations: observations,
          lifestyleCompatibilityNote: nullable(this._form.lifestyleCompatibilityNote),
          redFlagsNote: nullable(this._form.redFlagsNote),
          overallImpression: nullable(this._form.overallImpression),
        });
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
      await deleteRecruitmentImpression(this._record.id);
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

  private _addObservation() {
    this._form = {
      ...this._form,
      sensoryObservations: [...this._form.sensoryObservations, { category: '', note: '' }],
    };
  }

  private _updateObservation(index: number, field: keyof SensoryObservation, value: string) {
    const observations = this._form.sensoryObservations.map((o, i) =>
      i === index ? { ...o, [field]: value } : o,
    );
    this._form = { ...this._form, sensoryObservations: observations };
  }

  private _removeObservation(index: number) {
    this._form = {
      ...this._form,
      sensoryObservations: this._form.sensoryObservations.filter((_, i) => i !== index),
    };
  }

  override render() {
    return html`
      <div class="panel">
        <h1>採用印象メモ</h1>

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
              <label>採用選考プロセス観察</label>
              <textarea
                .value=${this._form.selectionProcessNote}
                @input=${(e: Event) =>
                  this._setField('selectionProcessNote', (e.target as HTMLTextAreaElement).value)}
                placeholder="書類選考→一次面接（人事）→二次面接（現場）→最終面接（役員）の4段階。選考期間は約3週間とのこと。"
              ></textarea>
            </div>
            <div class="form-full">
              <label>オフィス・職場の雰囲気</label>
              <textarea
                .value=${this._form.officeAtmosphere}
                @input=${(e: Event) =>
                  this._setField('officeAtmosphere', (e.target as HTMLTextAreaElement).value)}
                placeholder="受付の対応が丁寧。待合室はガラス張りで開放的。スーツ着用者が多め。"
              ></textarea>
            </div>
          </div>

          <hr class="divider" />
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
            <h2 style="margin:0">五感観察メモ（${this._form.sensoryObservations.length} 件）</h2>
            <button class="secondary" @click=${this._addObservation}>＋ 追加</button>
          </div>

          ${
            this._form.sensoryObservations.length === 0
              ? html`<p class="empty">五感観察メモはまだありません</p>`
              : this._form.sensoryObservations.map(
                  (obs, i) => html`
                    <div class="entry-row">
                      <div class="entry-header">
                        <span class="entry-label">観察 ${i + 1}</span>
                        <button class="small" @click=${() => this._removeObservation(i)}>削除</button>
                      </div>
                      <label>カテゴリ（視覚・聴覚・嗅覚 など）</label>
                      <input
                        .value=${obs.category}
                        @input=${(e: Event) =>
                          this._updateObservation(
                            i,
                            'category',
                            (e.target as HTMLInputElement).value,
                          )}
                        placeholder="視覚"
                        style="margin-bottom:0.5rem"
                      />
                      <label>メモ</label>
                      <textarea
                        .value=${obs.note}
                        @input=${(e: Event) =>
                          this._updateObservation(
                            i,
                            'note',
                            (e.target as HTMLTextAreaElement).value,
                          )}
                        placeholder="オープンフロアでパーティションが低い。グリーンが多く配置されている。"
                        style="min-height:3rem"
                      ></textarea>
                    </div>
                  `,
                )
          }

          <hr class="divider" />
          <div class="form-grid">
            <div class="form-full">
              <label>ライフスタイル適合メモ</label>
              <textarea
                .value=${this._form.lifestyleCompatibilityNote}
                @input=${(e: Event) =>
                  this._setField(
                    'lifestyleCompatibilityNote',
                    (e.target as HTMLTextAreaElement).value,
                  )}
                placeholder="残業平均20時間/月、在宅週2回可。子育て世代が多いとのこと。"
              ></textarea>
            </div>
            <div class="form-full">
              <label>危険信号メモ（「ノリで仕事」「休日返上」など）</label>
              <textarea
                .value=${this._form.redFlagsNote}
                @input=${(e: Event) =>
                  this._setField('redFlagsNote', (e.target as HTMLTextAreaElement).value)}
                placeholder="面接官が終始時計を気にしていた。"
              ></textarea>
            </div>
            <div class="form-full">
              <label>総合印象</label>
              <textarea
                .value=${this._form.overallImpression}
                @input=${(e: Event) =>
                  this._setField('overallImpression', (e.target as HTMLTextAreaElement).value)}
                placeholder="面接官の対応が丁寧で、入社後のキャリアについて具体的に話してくれた。"
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
                <pre class="preview">${toRecruitmentImpressionMarkdown(this._record)}</pre>
              `
              : ''
          }
        `
        }
      </div>
    `;
  }
}

customElements.define('recruitment-impression-view', RecruitmentImpressionView);
