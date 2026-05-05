import type { HiddenGemNote, JobTarget } from '@episfolio/kernel';
import { toHiddenGemNoteMarkdown } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createHiddenGemNote,
  deleteHiddenGemNote,
  listHiddenGemNotesByJobTarget,
  updateHiddenGemNote,
} from './ipc/hidden-gem-notes.js';
import { listJobTargets } from './ipc/job-targets.js';
import { waitForTauri } from './ipc/tauri-ready.js';

type FormState = {
  isGntListed: boolean;
  nicheKeywords: string;
  hasAntiMonsterMechanism: boolean;
  mechanismNote: string;
  isHiringOnJobSites: boolean;
  directContactNote: string;
  note: string;
};

function emptyForm(): FormState {
  return {
    isGntListed: false,
    nicheKeywords: '',
    hasAntiMonsterMechanism: false,
    mechanismNote: '',
    isHiringOnJobSites: false,
    directContactNote: '',
    note: '',
  };
}

function recordToForm(r: HiddenGemNote): FormState {
  return {
    isGntListed: r.isGntListed,
    nicheKeywords: r.nicheKeywords ?? '',
    hasAntiMonsterMechanism: r.hasAntiMonsterMechanism,
    mechanismNote: r.mechanismNote ?? '',
    isHiringOnJobSites: r.isHiringOnJobSites,
    directContactNote: r.directContactNote ?? '',
    note: r.note ?? '',
  };
}

function nullable(s: string): string | null {
  return s.trim() !== '' ? s.trim() : null;
}

export class HiddenGemNoteView extends LitElement {
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
  declare _record: HiddenGemNote | null;
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
    .empty { color: #888; font-size: 0.9rem; }
    .no-target { color: #888; font-size: 0.9rem; margin-top: 1rem; }
    .status-badge {
      display: inline-block; padding: 0.15rem 0.6rem;
      border-radius: 0.25rem; font-size: 0.75rem;
      background: #d4edda; color: #155724;
    }
    .checkbox-row {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0;
    }
    .checkbox-row input[type="checkbox"] {
      width: auto;
    }
    .checkbox-label { font-size: 0.9rem; color: #333; }
    .flag-section {
      border: 1px solid #e0e0e0; border-radius: 0.4rem;
      padding: 0.75rem 1rem; background: #fafafa;
    }
    .flag-section-title { font-size: 0.8rem; color: #888; margin-bottom: 0.5rem; font-weight: 600; }
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
      const records = await listHiddenGemNotesByJobTarget(this._selectedJobTargetId);
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
        isGntListed: this._form.isGntListed,
        nicheKeywords: nullable(this._form.nicheKeywords),
        hasAntiMonsterMechanism: this._form.hasAntiMonsterMechanism,
        mechanismNote: nullable(this._form.mechanismNote),
        isHiringOnJobSites: this._form.isHiringOnJobSites,
        directContactNote: nullable(this._form.directContactNote),
        note: nullable(this._form.note),
      };
      if (this._record) {
        await updateHiddenGemNote(this._record.id, payload);
      } else {
        await createHiddenGemNote({ jobTargetId: this._selectedJobTargetId, ...payload });
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
      await deleteHiddenGemNote(this._record.id);
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
        <h1>隠れた優良企業チェック</h1>

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
                <div class="flag-section-title">GNT企業100選（経産省）</div>
                <div class="checkbox-row">
                  <input
                    type="checkbox"
                    id="gnt-listed"
                    .checked=${this._form.isGntListed}
                    @change=${(e: Event) =>
                      this._setField('isGntListed', (e.target as HTMLInputElement).checked)}
                  />
                  <label for="gnt-listed" class="checkbox-label" style="margin:0;">
                    ✅ GNT企業100選に掲載されている
                  </label>
                </div>
              </div>
            </div>

            <div class="form-full">
              <label>検索キーワード（使ったキーワードを記録）</label>
              <input
                .value=${this._form.nicheKeywords}
                @input=${(e: Event) =>
                  this._setField('nicheKeywords', (e.target as HTMLInputElement).value)}
                placeholder="ニッチトップ シェアNO.1 独自技術 リーディングカンパニー"
              />
            </div>

            <div class="form-full">
              <div class="flag-section">
                <div class="flag-section-title">モンスター企業になりにくい仕組み</div>
                <div class="checkbox-row">
                  <input
                    type="checkbox"
                    id="anti-monster"
                    .checked=${this._form.hasAntiMonsterMechanism}
                    @change=${(e: Event) =>
                      this._setField(
                        'hasAntiMonsterMechanism',
                        (e.target as HTMLInputElement).checked,
                      )}
                  />
                  <label for="anti-monster" class="checkbox-label" style="margin:0;">
                    ✅ 独自商品・サービス→余裕ある経営→社員を大切にする好循環がある
                  </label>
                </div>
              </div>
            </div>

            <div class="form-full">
              <label>仕組みの具体的メモ</label>
              <textarea
                .value=${this._form.mechanismNote}
                @input=${(e: Event) =>
                  this._setField('mechanismNote', (e.target as HTMLTextAreaElement).value)}
                placeholder="他社に提供できない独自技術→価格競争に巻き込まれず余裕がある→…"
              ></textarea>
            </div>

            <div class="form-full">
              <div class="flag-section">
                <div class="flag-section-title">採用状況</div>
                <div class="checkbox-row">
                  <input
                    type="checkbox"
                    id="hiring-on-job-sites"
                    .checked=${this._form.isHiringOnJobSites}
                    @change=${(e: Event) =>
                      this._setField('isHiringOnJobSites', (e.target as HTMLInputElement).checked)}
                  />
                  <label for="hiring-on-job-sites" class="checkbox-label" style="margin:0;">
                    📋 転職サイトで採用募集中（チェックなし＝直接コンタクト要）
                  </label>
                </div>
              </div>
            </div>

            <div class="form-full">
              <label>直接コンタクトのメモ</label>
              <textarea
                .value=${this._form.directContactNote}
                @input=${(e: Event) =>
                  this._setField('directContactNote', (e.target as HTMLTextAreaElement).value)}
                placeholder="採用ページから直接応募。問い合わせフォームに送付。人事担当の名前：…"
              ></textarea>
            </div>

            <div class="form-full">
              <label>総合メモ</label>
              <textarea
                .value=${this._form.note}
                @input=${(e: Event) =>
                  this._setField('note', (e.target as HTMLTextAreaElement).value)}
                placeholder="GNT100選掲載。競合は国内2社のみ。モンスター化しにくい好循環が確認できた。…"
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
                <pre class="preview">${toHiddenGemNoteMarkdown(this._record)}</pre>
              `
              : ''
          }
        `
        }
      </div>
    `;
  }
}

customElements.define('hidden-gem-note-view', HiddenGemNoteView);
