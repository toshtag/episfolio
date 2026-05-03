import type { JobTarget, SalaryBenchmark } from '@episfolio/kernel';
import { toSalaryBenchmarkMarkdown } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import { listJobTargets } from './ipc/job-targets.js';
import {
  createSalaryBenchmark,
  deleteSalaryBenchmark,
  listSalaryBenchmarksByJobTarget,
  updateSalaryBenchmark,
} from './ipc/salary-benchmarks.js';

type FormState = {
  averageSalaryAtCompany: string;
  expectedSalaryRangeMin: string;
  expectedSalaryRangeMax: string;
  personalSalaryBenchmark: string;
  isMismatchedCompany: boolean;
  dataSource: string;
  note: string;
};

function emptyForm(): FormState {
  return {
    averageSalaryAtCompany: '',
    expectedSalaryRangeMin: '',
    expectedSalaryRangeMax: '',
    personalSalaryBenchmark: '',
    isMismatchedCompany: false,
    dataSource: '',
    note: '',
  };
}

function recordToForm(r: SalaryBenchmark): FormState {
  return {
    averageSalaryAtCompany:
      r.averageSalaryAtCompany != null ? String(r.averageSalaryAtCompany) : '',
    expectedSalaryRangeMin:
      r.expectedSalaryRangeMin != null ? String(r.expectedSalaryRangeMin) : '',
    expectedSalaryRangeMax:
      r.expectedSalaryRangeMax != null ? String(r.expectedSalaryRangeMax) : '',
    personalSalaryBenchmark:
      r.personalSalaryBenchmark != null ? String(r.personalSalaryBenchmark) : '',
    isMismatchedCompany: r.isMismatchedCompany,
    dataSource: r.dataSource ?? '',
    note: r.note ?? '',
  };
}

function parseIntOrNull(s: string): number | null {
  const trimmed = s.trim();
  if (trimmed === '') return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isNaN(n) ? null : n;
}

function nullable(s: string): string | null {
  return s.trim() !== '' ? s.trim() : null;
}

export class SalaryBenchmarkView extends LitElement {
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
  declare _record: SalaryBenchmark | null;
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
    .mismatch-badge {
      display: inline-block; padding: 0.15rem 0.6rem;
      border-radius: 0.25rem; font-size: 0.75rem;
      background: #f8d7da; color: #721c24;
    }
    .checkbox-row {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0;
    }
    .checkbox-row input[type="checkbox"] {
      width: auto; accent-color: #c00;
    }
    .unit { font-size: 0.85rem; color: #555; white-space: nowrap; }
    .input-with-unit {
      display: flex; align-items: center; gap: 0.4rem;
    }
    .input-with-unit input { flex: 1; }
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
      const records = await listSalaryBenchmarksByJobTarget(this._selectedJobTargetId);
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
        averageSalaryAtCompany: parseIntOrNull(this._form.averageSalaryAtCompany),
        expectedSalaryRangeMin: parseIntOrNull(this._form.expectedSalaryRangeMin),
        expectedSalaryRangeMax: parseIntOrNull(this._form.expectedSalaryRangeMax),
        personalSalaryBenchmark: parseIntOrNull(this._form.personalSalaryBenchmark),
        isMismatchedCompany: this._form.isMismatchedCompany,
        dataSource: nullable(this._form.dataSource),
        note: nullable(this._form.note),
      };
      if (this._record) {
        await updateSalaryBenchmark(this._record.id, payload);
      } else {
        await createSalaryBenchmark({ jobTargetId: this._selectedJobTargetId, ...payload });
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
      await deleteSalaryBenchmark(this._record.id);
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
        <h1>給料分析</h1>

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
                  ${this._record.isMismatchedCompany ? html`&nbsp;<span class="mismatch-badge">⚠️ 見合わない企業</span>` : ''}
                  　最終更新: ${this._record.updatedAt.replace('T', ' ').replace('Z', '')}
                </p>`
              : html`<p style="margin:0 0 1rem;font-size:0.85rem;color:#888;">
                  まだ記録がありません。保存すると新規作成されます。
                </p>`
          }

          <div class="form-grid">
            <div>
              <label>企業の平均年間給与（万円）</label>
              <div class="input-with-unit">
                <input
                  type="number"
                  min="0"
                  step="1"
                  .value=${this._form.averageSalaryAtCompany}
                  @input=${(e: Event) =>
                    this._setField('averageSalaryAtCompany', (e.target as HTMLInputElement).value)}
                  placeholder="620"
                />
                <span class="unit">万円</span>
              </div>
            </div>
            <div>
              <label>自分の給与相場（万円）</label>
              <div class="input-with-unit">
                <input
                  type="number"
                  min="0"
                  step="1"
                  .value=${this._form.personalSalaryBenchmark}
                  @input=${(e: Event) =>
                    this._setField('personalSalaryBenchmark', (e.target as HTMLInputElement).value)}
                  placeholder="550"
                />
                <span class="unit">万円</span>
              </div>
            </div>
            <div>
              <label>求人票の年収レンジ（下限 万円）</label>
              <div class="input-with-unit">
                <input
                  type="number"
                  min="0"
                  step="1"
                  .value=${this._form.expectedSalaryRangeMin}
                  @input=${(e: Event) =>
                    this._setField('expectedSalaryRangeMin', (e.target as HTMLInputElement).value)}
                  placeholder="450"
                />
                <span class="unit">万円</span>
              </div>
            </div>
            <div>
              <label>求人票の年収レンジ（上限 万円）</label>
              <div class="input-with-unit">
                <input
                  type="number"
                  min="0"
                  step="1"
                  .value=${this._form.expectedSalaryRangeMax}
                  @input=${(e: Event) =>
                    this._setField('expectedSalaryRangeMax', (e.target as HTMLInputElement).value)}
                  placeholder="700"
                />
                <span class="unit">万円</span>
              </div>
            </div>
            <div class="form-full">
              <label>参照情報源</label>
              <input
                .value=${this._form.dataSource}
                @input=${(e: Event) =>
                  this._setField('dataSource', (e.target as HTMLInputElement).value)}
                placeholder="EDINET 有価証券報告書 / 就職四季報 / OpenMoney"
              />
            </div>
            <div class="form-full">
              <div class="checkbox-row">
                <input
                  type="checkbox"
                  id="mismatch-flag"
                  .checked=${this._form.isMismatchedCompany}
                  @change=${(e: Event) =>
                    this._setField('isMismatchedCompany', (e.target as HTMLInputElement).checked)}
                />
                <label for="mismatch-flag" style="margin:0;color:#c00;font-weight:600;">
                  ⚠️「見合わない企業」フラグ（給与が自分の相場と大きく乖離している）
                </label>
              </div>
            </div>
            <div class="form-full">
              <label>メモ</label>
              <textarea
                .value=${this._form.note}
                @input=${(e: Event) =>
                  this._setField('note', (e.target as HTMLTextAreaElement).value)}
                placeholder="A業界35歳の平均は500万円。求人レンジは妥当範囲内。EDINET で調べた結果は…"
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
                <pre class="preview">${toSalaryBenchmarkMarkdown(this._record)}</pre>
              `
              : ''
          }
        `
        }
      </div>
    `;
  }
}

customElements.define('salary-benchmark-view', SalaryBenchmarkView);
