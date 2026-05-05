import type { AgentTrackRecord, JobWishCompany, JobWishSheet } from '@episfolio/kernel';
import { toJobWishSheetMarkdown } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import { listAgentTrackRecords } from './ipc/agent-track-records.js';
import {
  createJobWishSheet,
  deleteJobWishSheet,
  listJobWishSheets,
  updateJobWishSheet,
} from './ipc/job-wish-sheets.js';
import { waitForTauri } from './ipc/tauri-ready.js';

type CompanyGroup = 'groupACompanies' | 'groupBCompanies' | 'groupCCompanies';

type FormState = {
  agentTrackRecordId: string;
  title: string;
  desiredIndustry: string;
  desiredRole: string;
  desiredSalary: string;
  desiredLocation: string;
  desiredWorkStyle: string;
  otherConditions: string;
  groupACompanies: JobWishCompany[];
  groupBCompanies: JobWishCompany[];
  groupCCompanies: JobWishCompany[];
  memo: string;
};

function emptyForm(): FormState {
  return {
    agentTrackRecordId: '',
    title: '',
    desiredIndustry: '',
    desiredRole: '',
    desiredSalary: '',
    desiredLocation: '',
    desiredWorkStyle: '',
    otherConditions: '',
    groupACompanies: [],
    groupBCompanies: [],
    groupCCompanies: [],
    memo: '',
  };
}

function newCompany(): JobWishCompany {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return { id, name: '', note: '' };
}

function sheetToForm(sheet: JobWishSheet): FormState {
  return {
    agentTrackRecordId: sheet.agentTrackRecordId ?? '',
    title: sheet.title,
    desiredIndustry: sheet.desiredIndustry,
    desiredRole: sheet.desiredRole,
    desiredSalary: sheet.desiredSalary,
    desiredLocation: sheet.desiredLocation,
    desiredWorkStyle: sheet.desiredWorkStyle,
    otherConditions: sheet.otherConditions,
    groupACompanies: sheet.groupACompanies,
    groupBCompanies: sheet.groupBCompanies,
    groupCCompanies: sheet.groupCCompanies,
    memo: sheet.memo,
  };
}

class JobWishSheetView extends LitElement {
  static override properties = {
    sheets: { state: true },
    agents: { state: true },
    form: { state: true },
    editingId: { state: true },
    showingForm: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteId: { state: true },
    copyState: { state: true },
  };

  declare sheets: JobWishSheet[];
  declare agents: AgentTrackRecord[];
  declare form: FormState;
  declare editingId: string;
  declare showingForm: boolean;
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteId: string;
  declare copyState: 'idle' | 'copied' | 'failed';

  constructor() {
    super();
    this.sheets = [];
    this.agents = [];
    this.form = emptyForm();
    this.editingId = '';
    this.showingForm = false;
    this.saving = false;
    this.error = '';
    this.confirmDeleteId = '';
    this.copyState = 'idle';
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
    input, textarea, select {
      width: 100%;
      padding: 0.4rem 0.6rem;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      box-sizing: border-box;
    }
    textarea { min-height: 5rem; resize: vertical; font-family: inherit; }
    .actions { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; align-items: center; }
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
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    .error { color: #c00; font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-top: 1rem; }
    th { text-align: left; border-bottom: 2px solid #ddd; padding: 0.5rem 0.4rem; }
    td { border-bottom: 1px solid #eee; padding: 0.5rem 0.4rem; vertical-align: top; }
    .row-actions { display: flex; gap: 0.4rem; }
    button.edit-btn {
      padding: 0.25rem 0.6rem; font-size: 0.8rem; background: #eee;
      border: 1px solid #ccc; border-radius: 0.25rem; cursor: pointer;
    }
    button.del-btn {
      padding: 0.25rem 0.6rem; font-size: 0.8rem; background: #fee;
      border: 1px solid #fcc; color: #c00; border-radius: 0.25rem; cursor: pointer;
    }
    button.del-confirm-btn {
      padding: 0.25rem 0.6rem; font-size: 0.8rem; background: #c00;
      border: none; color: #fff; border-radius: 0.25rem; cursor: pointer;
    }
    .section-title {
      font-size: 1rem; font-weight: bold; margin: 1.5rem 0 0.5rem;
      border-bottom: 1px solid #ddd; padding-bottom: 0.25rem;
    }
    .company-row { display: flex; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.4rem; }
    .company-row input { flex: 1; }
    button.company-add-btn {
      padding: 0.25rem 0.7rem; font-size: 0.85rem; background: #f5f5f5;
      border: 1px solid #ccc; border-radius: 0.25rem; cursor: pointer; margin-top: 0.25rem;
    }
    button.company-del-btn {
      padding: 0.25rem 0.5rem; font-size: 0.8rem; background: #fee;
      border: 1px solid #fcc; color: #c00; border-radius: 0.25rem; cursor: pointer; flex-shrink: 0;
    }
    .preview-box {
      background: #f9f9f9; border: 1px solid #ddd; border-radius: 0.4rem;
      padding: 1rem; font-family: monospace; font-size: 0.85rem;
      white-space: pre-wrap; word-break: break-word; margin-bottom: 0.75rem;
      min-height: 6rem;
    }
    .preview-actions { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1.5rem; }
    button.copy-btn {
      padding: 0.4rem 1rem; font-size: 0.9rem; background: #1a1a1a;
      color: #fff; border: none; border-radius: 0.3rem; cursor: pointer;
    }
    .copy-state { font-size: 0.8rem; color: #555; }
    .copy-state.copied { color: #2a7d2a; }
    .copy-state.failed { color: #c00; }
    .empty { color: #999; font-size: 0.9rem; }
  `;

  override connectedCallback() {
    super.connectedCallback();
    void (async () => {
      if (!(await waitForTauri())) return;
      void this.load();
    })();
  }

  private async load() {
    try {
      const [sheets, agents] = await Promise.all([listJobWishSheets(), listAgentTrackRecords()]);
      this.sheets = sheets;
      this.agents = agents;
    } catch (e) {
      this.error = String(e);
    }
  }

  private startNew() {
    this.editingId = '';
    this.form = emptyForm();
    this.showingForm = true;
    this.error = '';
  }

  private startEdit(sheet: JobWishSheet) {
    this.editingId = sheet.id;
    this.form = sheetToForm(sheet);
    this.showingForm = true;
    this.error = '';
  }

  private cancelEdit() {
    this.editingId = '';
    this.form = emptyForm();
    this.showingForm = false;
    this.error = '';
  }

  private setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    this.form = { ...this.form, [field]: value };
  }

  private addCompany(group: CompanyGroup) {
    this.form = { ...this.form, [group]: [...this.form[group], newCompany()] };
  }

  private updateCompanyName(group: CompanyGroup, index: number, name: string) {
    const next = this.form[group].map((c, i) => (i === index ? { ...c, name } : c));
    this.form = { ...this.form, [group]: next };
  }

  private updateCompanyNote(group: CompanyGroup, index: number, note: string) {
    const next = this.form[group].map((c, i) => (i === index ? { ...c, note } : c));
    this.form = { ...this.form, [group]: next };
  }

  private removeCompany(group: CompanyGroup, index: number) {
    this.form = {
      ...this.form,
      [group]: this.form[group].filter((_, i) => i !== index),
    };
  }

  private buildPreviewSheet(): JobWishSheet {
    return {
      id: this.editingId || 'preview',
      agentTrackRecordId: this.form.agentTrackRecordId || null,
      title: this.form.title,
      desiredIndustry: this.form.desiredIndustry,
      desiredRole: this.form.desiredRole,
      desiredSalary: this.form.desiredSalary,
      desiredLocation: this.form.desiredLocation,
      desiredWorkStyle: this.form.desiredWorkStyle,
      otherConditions: this.form.otherConditions,
      groupACompanies: this.form.groupACompanies,
      groupBCompanies: this.form.groupBCompanies,
      groupCCompanies: this.form.groupCCompanies,
      memo: this.form.memo,
      createdAt: '',
      updatedAt: '',
    };
  }

  private async handleCopy() {
    const md = toJobWishSheetMarkdown(this.buildPreviewSheet());
    if (!md) return;
    try {
      await navigator.clipboard.writeText(md);
      this.copyState = 'copied';
      setTimeout(() => {
        if (this.copyState === 'copied') this.copyState = 'idle';
      }, 2000);
    } catch (_e) {
      this.copyState = 'failed';
    }
  }

  private async handleSave() {
    this.saving = true;
    this.error = '';
    try {
      const agentId = this.form.agentTrackRecordId || null;

      if (this.editingId) {
        await updateJobWishSheet(this.editingId, {
          agentTrackRecordId: agentId,
          title: this.form.title,
          desiredIndustry: this.form.desiredIndustry,
          desiredRole: this.form.desiredRole,
          desiredSalary: this.form.desiredSalary,
          desiredLocation: this.form.desiredLocation,
          desiredWorkStyle: this.form.desiredWorkStyle,
          otherConditions: this.form.otherConditions,
          groupACompanies: this.form.groupACompanies,
          groupBCompanies: this.form.groupBCompanies,
          groupCCompanies: this.form.groupCCompanies,
          memo: this.form.memo,
        });
      } else {
        await createJobWishSheet({
          agentTrackRecordId: agentId,
          title: this.form.title,
          desiredIndustry: this.form.desiredIndustry,
          desiredRole: this.form.desiredRole,
          desiredSalary: this.form.desiredSalary,
          desiredLocation: this.form.desiredLocation,
          desiredWorkStyle: this.form.desiredWorkStyle,
          otherConditions: this.form.otherConditions,
          groupACompanies: this.form.groupACompanies,
          groupBCompanies: this.form.groupBCompanies,
          groupCCompanies: this.form.groupCCompanies,
          memo: this.form.memo,
        });
      }
      await this.load();
      this.editingId = '';
      this.form = emptyForm();
      this.showingForm = false;
      this.error = '';
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private async handleDelete(id: string) {
    try {
      await deleteJobWishSheet(id);
      await this.load();
      this.confirmDeleteId = '';
    } catch (e) {
      this.error = String(e);
    }
  }

  private renderCompanyGroup(group: CompanyGroup, label: string) {
    const companies = this.form[group];
    return html`
      <div class="section-title">${label}</div>
      ${companies.map(
        (c, i) => html`
          <div class="company-row">
            <input
              placeholder="会社名"
              .value=${c.name}
              @input=${(e: Event) =>
                this.updateCompanyName(group, i, (e.target as HTMLInputElement).value)}
            />
            <input
              placeholder="一言メモ（省略可）"
              .value=${c.note}
              @input=${(e: Event) =>
                this.updateCompanyNote(group, i, (e.target as HTMLInputElement).value)}
            />
            <button class="company-del-btn" @click=${() => this.removeCompany(group, i)}>
              削除
            </button>
          </div>
        `,
      )}
      <button class="company-add-btn" @click=${() => this.addCompany(group)}>
        + 企業を追加
      </button>
    `;
  }

  private renderForm() {
    return html`
      <div class="form-grid">
        <div class="full">
          <label>担当エージェント（任意）</label>
          <select
            .value=${this.form.agentTrackRecordId}
            @change=${(e: Event) =>
              this.setField('agentTrackRecordId', (e.target as HTMLSelectElement).value)}
          >
            <option value="">（未指定）</option>
            ${this.agents.map(
              (a) => html`
                <option value=${a.id} ?selected=${this.form.agentTrackRecordId === a.id}>
                  ${a.companyName}${a.contactName ? ` — ${a.contactName}` : ''}
                </option>
              `,
            )}
          </select>
        </div>
        <div class="full">
          <label>タイトル</label>
          <input
            placeholder="転職希望シート 2026"
            .value=${this.form.title}
            @input=${(e: Event) => this.setField('title', (e.target as HTMLInputElement).value)}
          />
        </div>
        <div>
          <label>希望業界</label>
          <input
            placeholder="IT・Web"
            .value=${this.form.desiredIndustry}
            @input=${(e: Event) =>
              this.setField('desiredIndustry', (e.target as HTMLInputElement).value)}
          />
        </div>
        <div>
          <label>希望職種</label>
          <input
            placeholder="プロダクトマネージャー"
            .value=${this.form.desiredRole}
            @input=${(e: Event) =>
              this.setField('desiredRole', (e.target as HTMLInputElement).value)}
          />
        </div>
        <div>
          <label>希望年収</label>
          <input
            placeholder="800万円以上"
            .value=${this.form.desiredSalary}
            @input=${(e: Event) =>
              this.setField('desiredSalary', (e.target as HTMLInputElement).value)}
          />
        </div>
        <div>
          <label>希望勤務地</label>
          <input
            placeholder="東京・リモート可"
            .value=${this.form.desiredLocation}
            @input=${(e: Event) =>
              this.setField('desiredLocation', (e.target as HTMLInputElement).value)}
          />
        </div>
        <div>
          <label>希望働き方</label>
          <input
            placeholder="フレックス・週3在宅"
            .value=${this.form.desiredWorkStyle}
            @input=${(e: Event) =>
              this.setField('desiredWorkStyle', (e.target as HTMLInputElement).value)}
          />
        </div>
        <div>
          <label>その他条件</label>
          <input
            placeholder="英語使用可能環境"
            .value=${this.form.otherConditions}
            @input=${(e: Event) =>
              this.setField('otherConditions', (e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      ${this.renderCompanyGroup('groupACompanies', '■ A グループ（最優先）')}
      ${this.renderCompanyGroup('groupBCompanies', '■ B グループ（興味あり）')}
      ${this.renderCompanyGroup('groupCCompanies', '■ C グループ（ストレッチ・保険）')}

      <div class="full" style="margin-top:1rem;">
        <label>メモ</label>
        <textarea
          .value=${this.form.memo}
          @input=${(e: Event) => this.setField('memo', (e.target as HTMLTextAreaElement).value)}
        ></textarea>
      </div>

      <h2>Markdown プレビュー</h2>
      <div class="preview-box">${toJobWishSheetMarkdown(this.buildPreviewSheet())}</div>
      <div class="preview-actions">
        <button class="copy-btn" @click=${this.handleCopy}>クリップボードにコピー</button>
        ${
          this.copyState === 'copied'
            ? html`<span class="copy-state copied">コピーしました</span>`
            : this.copyState === 'failed'
              ? html`<span class="copy-state failed">コピーに失敗しました</span>`
              : ''
        }
      </div>

      <div class="actions">
        <button class="save-btn" ?disabled=${this.saving} @click=${this.handleSave}>
          ${this.editingId ? '更新' : '保存'}
        </button>
        <button class="cancel-btn" @click=${this.cancelEdit}>キャンセル</button>
        ${this.error ? html`<span class="error">${this.error}</span>` : ''}
      </div>
    `;
  }

  private agentName(id: string | null): string {
    if (!id) return '（未指定）';
    const a = this.agents.find((ag) => ag.id === id);
    return a ? a.companyName : '（削除済み）';
  }

  override render() {
    return html`
      <div class="panel">
        <h1>転職希望シート</h1>
        ${this.error && !this.editingId ? html`<p class="error">${this.error}</p>` : ''}

        ${
          this.showingForm
            ? this.renderForm()
            : html`
              <button class="save-btn" @click=${this.startNew}>+ 新規作成</button>
              ${
                this.sheets.length === 0
                  ? html`<p class="empty" style="margin-top:1rem;">希望シートがありません</p>`
                  : html`
                    <table>
                      <thead>
                        <tr>
                          <th>タイトル</th>
                          <th>希望職種</th>
                          <th>担当エージェント</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${this.sheets.map(
                          (s) => html`
                            <tr>
                              <td>${s.title || '（無題）'}</td>
                              <td>${s.desiredRole || '—'}</td>
                              <td>${this.agentName(s.agentTrackRecordId)}</td>
                              <td>
                                <div class="row-actions">
                                  <button class="edit-btn" @click=${() => this.startEdit(s)}>
                                    編集
                                  </button>
                                  ${
                                    this.confirmDeleteId === s.id
                                      ? html`
                                        <button
                                          class="del-confirm-btn"
                                          @click=${() => this.handleDelete(s.id)}
                                        >
                                          削除確認
                                        </button>
                                        <button
                                          class="cancel-btn"
                                          @click=${() => (this.confirmDeleteId = '')}
                                        >
                                          取消
                                        </button>
                                      `
                                      : html`
                                        <button
                                          class="del-btn"
                                          @click=${() => (this.confirmDeleteId = s.id)}
                                        >
                                          削除
                                        </button>
                                      `
                                  }
                                </div>
                              </td>
                            </tr>
                          `,
                        )}
                      </tbody>
                    </table>
                  `
              }
            `
        }
      </div>
    `;
  }
}

customElements.define('job-wish-sheet-view', JobWishSheetView);
