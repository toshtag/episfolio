import type { JobTarget, MonsterCompanyCheck, ResignationEntry } from '@episfolio/kernel';
import { toMonsterCompanyCheckMarkdown } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import { listJobTargets } from './ipc/job-targets.js';
import {
  createMonsterCompanyCheck,
  deleteMonsterCompanyCheck,
  listMonsterCompanyChecksByJobTarget,
  updateMonsterCompanyCheck,
} from './ipc/monster-company-checks.js';
import { waitForTauri } from './ipc/tauri-ready.js';

type FormState = {
  mhlwCaseUrl: string;
  violationLaw: string;
  caseSummary: string;
  casePublicationDate: string;
  resignationEntries: ResignationEntry[];
  hiddenMonsterNote: string;
};

function emptyForm(): FormState {
  return {
    mhlwCaseUrl: '',
    violationLaw: '',
    caseSummary: '',
    casePublicationDate: '',
    resignationEntries: [],
    hiddenMonsterNote: '',
  };
}

function recordToForm(r: MonsterCompanyCheck): FormState {
  return {
    mhlwCaseUrl: r.mhlwCaseUrl ?? '',
    violationLaw: r.violationLaw ?? '',
    caseSummary: r.caseSummary ?? '',
    casePublicationDate: r.casePublicationDate ?? '',
    resignationEntries: r.resignationEntries,
    hiddenMonsterNote: r.hiddenMonsterNote ?? '',
  };
}

function nullable(s: string): string | null {
  return s.trim() !== '' ? s.trim() : null;
}

export class MonsterCompanyCheckView extends LitElement {
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
  declare _record: MonsterCompanyCheck | null;
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
    .entry-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .entry-label { font-size: 0.85rem; font-weight: 600; color: #555; }
    .preview { background: #f8f8f8; border: 1px solid #ddd; border-radius: 0.4rem; padding: 1rem; white-space: pre-wrap; font-size: 0.85rem; font-family: monospace; }
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
      const records = await listMonsterCompanyChecksByJobTarget(this._selectedJobTargetId);
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
      const entries = this._form.resignationEntries.filter(
        (e) => e.url.trim() !== '' || e.summary.trim() !== '',
      );
      if (this._record) {
        await updateMonsterCompanyCheck(this._record.id, {
          mhlwCaseUrl: nullable(this._form.mhlwCaseUrl),
          violationLaw: nullable(this._form.violationLaw),
          caseSummary: nullable(this._form.caseSummary),
          casePublicationDate: nullable(this._form.casePublicationDate),
          resignationEntries: entries,
          hiddenMonsterNote: nullable(this._form.hiddenMonsterNote),
        });
      } else {
        await createMonsterCompanyCheck({
          jobTargetId: this._selectedJobTargetId,
          mhlwCaseUrl: nullable(this._form.mhlwCaseUrl),
          violationLaw: nullable(this._form.violationLaw),
          caseSummary: nullable(this._form.caseSummary),
          casePublicationDate: nullable(this._form.casePublicationDate),
          resignationEntries: entries,
          hiddenMonsterNote: nullable(this._form.hiddenMonsterNote),
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
      await deleteMonsterCompanyCheck(this._record.id);
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

  private _addEntry() {
    this._form = {
      ...this._form,
      resignationEntries: [...this._form.resignationEntries, { url: '', summary: '' }],
    };
  }

  private _updateEntry(index: number, field: keyof ResignationEntry, value: string) {
    const entries = this._form.resignationEntries.map((e, i) =>
      i === index ? { ...e, [field]: value } : e,
    );
    this._form = { ...this._form, resignationEntries: entries };
  }

  private _removeEntry(index: number) {
    this._form = {
      ...this._form,
      resignationEntries: this._form.resignationEntries.filter((_, i) => i !== index),
    };
  }

  override render() {
    return html`
      <div class="panel">
        <h1>モンスター企業判定</h1>

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
              : html`<p style="margin:0 0 1rem;font-size:0.85rem;color:#888;">まだ記録がありません。保存すると新規作成されます。</p>`
          }

          <div class="form-grid">
            <div class="form-full">
              <label>厚労省公表事案 URL</label>
              <input
                .value=${this._form.mhlwCaseUrl}
                @input=${(e: Event) => this._setField('mhlwCaseUrl', (e.target as HTMLInputElement).value)}
                placeholder="https://www.mhlw.go.jp/..."
              />
            </div>
            <div>
              <label>違反法条</label>
              <input
                .value=${this._form.violationLaw}
                @input=${(e: Event) => this._setField('violationLaw', (e.target as HTMLInputElement).value)}
                placeholder="労働基準法第32条"
              />
            </div>
            <div>
              <label>公表日</label>
              <input
                type="date"
                .value=${this._form.casePublicationDate}
                @input=${(e: Event) => this._setField('casePublicationDate', (e.target as HTMLInputElement).value)}
              />
            </div>
            <div class="form-full">
              <label>事案概要</label>
              <textarea
                .value=${this._form.caseSummary}
                @input=${(e: Event) => this._setField('caseSummary', (e.target as HTMLTextAreaElement).value)}
                placeholder="時間外労働が月100時間を超える違反"
              ></textarea>
            </div>
          </div>

          <hr class="divider" />
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
            <h2 style="margin:0">退職エントリ（${this._form.resignationEntries.length} 件）</h2>
            <button class="secondary" @click=${this._addEntry}>＋ 追加</button>
          </div>

          ${
            this._form.resignationEntries.length === 0
              ? html`<p class="empty">退職エントリはまだありません</p>`
              : this._form.resignationEntries.map(
                  (entry, i) => html`
                    <div class="entry-row">
                      <div class="entry-header">
                        <span class="entry-label">退職エントリ ${i + 1}</span>
                        <button class="small" @click=${() => this._removeEntry(i)}>削除</button>
                      </div>
                      <label>URL</label>
                      <input
                        .value=${entry.url}
                        @input=${(e: Event) => this._updateEntry(i, 'url', (e.target as HTMLInputElement).value)}
                        placeholder="https://..."
                        style="margin-bottom:0.5rem"
                      />
                      <label>要約</label>
                      <textarea
                        .value=${entry.summary}
                        @input=${(e: Event) => this._updateEntry(i, 'summary', (e.target as HTMLTextAreaElement).value)}
                        placeholder="残業が多くて退職"
                        style="min-height:3rem"
                      ></textarea>
                    </div>
                  `,
                )
          }

          <hr class="divider" />
          <div>
            <label>隠れモンスター部署メモ（SNS・口コミ調査）</label>
            <textarea
              .value=${this._form.hiddenMonsterNote}
              @input=${(e: Event) => this._setField('hiddenMonsterNote', (e.target as HTMLTextAreaElement).value)}
              placeholder="開発部署のみ深夜残業常態化との口コミあり"
            ></textarea>
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
                <pre class="preview">${toMonsterCompanyCheckMarkdown(this._record)}</pre>
              `
              : ''
          }
        `
        }
      </div>
    `;
  }
}

customElements.define('monster-company-check-view', MonsterCompanyCheckView);
