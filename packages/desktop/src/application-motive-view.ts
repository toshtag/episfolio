import type { ApplicationMotive, JobTarget, ResignationMotive, StandardApplicationMotive } from '@episfolio/kernel';
import { composeApplicationMotiveText } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createApplicationMotive,
  deleteApplicationMotive,
  listApplicationMotivesByJobTarget,
  updateApplicationMotive,
} from './ipc/application-motives.js';
import { listJobTargets } from './ipc/job-targets.js';
import {
  createResignationMotive,
  deleteResignationMotive,
  listResignationMotives,
  updateResignationMotive,
} from './ipc/resignation-motives.js';

class ApplicationMotiveView extends LitElement {
  static override properties = {
    resignationMotive: { state: true },
    jobTargets: { state: true },
    selectedJobTargetId: { state: true },
    applicationMotive: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteType: { state: true },
  };

  declare resignationMotive: ResignationMotive | null;
  declare jobTargets: JobTarget[];
  declare selectedJobTargetId: string;
  declare applicationMotive: ApplicationMotive | null;
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteType: 'resignation' | 'application' | null;

  constructor() {
    super();
    this.resignationMotive = null;
    this.jobTargets = [];
    this.selectedJobTargetId = '';
    this.applicationMotive = null;
    this.saving = false;
    this.error = '';
    this.confirmDeleteType = null;
  }

  static override styles = css`
    :host { display: block; }
    .panel { padding: 2rem; max-width: 720px; }
    h2 { margin: 0 0 0.5rem; font-size: 1.1rem; }
    .warning-badge {
      display: inline-block;
      background: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
      border-radius: 0.25rem;
      padding: 0.3rem 0.7rem;
      font-size: 0.8rem;
      margin-bottom: 1rem;
    }
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
    }
    label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 0.2rem; }
    textarea {
      width: 100%;
      box-sizing: border-box;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      padding: 0.4rem 0.6rem;
      resize: vertical;
      margin-bottom: 0.8rem;
      min-height: 56px;
    }
    .preview-box {
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 0.3rem;
      padding: 0.7rem;
      font-size: 0.9rem;
      white-space: pre-wrap;
      word-break: break-all;
      margin-bottom: 0.8rem;
      min-height: 3rem;
    }
    select {
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      padding: 0.4rem 0.6rem;
      margin-bottom: 1rem;
      width: 100%;
      box-sizing: border-box;
    }
    .btn-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
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
      background: #555;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .empty-note { color: #888; font-size: 0.9rem; }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    await this.load();
  }

  private async load() {
    const [motives, targets] = await Promise.all([listResignationMotives(), listJobTargets()]);
    this.resignationMotive = motives[0] ?? null;
    this.jobTargets = targets;
    if (this.selectedJobTargetId) {
      await this.loadApplicationMotive();
    }
  }

  private async loadApplicationMotive() {
    if (!this.selectedJobTargetId) {
      this.applicationMotive = null;
      return;
    }
    const list = await listApplicationMotivesByJobTarget(this.selectedJobTargetId);
    this.applicationMotive = list[0] ?? null;
  }

  private getResignationField(field: keyof ResignationMotive): string {
    if (!this.resignationMotive) return '';
    const v = this.resignationMotive[field];
    return typeof v === 'string' ? v : '';
  }

  private getApplicationField(field: keyof StandardApplicationMotive): string {
    if (!this.applicationMotive || this.applicationMotive.style !== 'standard') return '';
    const v = (this.applicationMotive as StandardApplicationMotive)[field];
    return typeof v === 'string' ? v : '';
  }

  private buildPreview(): string {
    if (!this.applicationMotive || this.applicationMotive.style !== 'standard') return '';
    return composeApplicationMotiveText(this.applicationMotive as StandardApplicationMotive);
  }

  private async handleSaveResignation() {
    this.saving = true;
    this.error = '';
    try {
      const shadow = this.shadowRoot;
      const get = (id: string) => (shadow?.getElementById(id) as HTMLTextAreaElement)?.value ?? '';
      const fields = {
        companyDissatisfaction: get('r-company'),
        jobDissatisfaction: get('r-job'),
        compensationDissatisfaction: get('r-compensation'),
        relationshipDissatisfaction: get('r-relationship'),
        resolutionIntent: get('r-intent'),
        note: get('r-note') || null,
      };
      if (this.resignationMotive) {
        this.resignationMotive = await updateResignationMotive(this.resignationMotive.id, fields);
      } else {
        this.resignationMotive = await createResignationMotive(fields);
      }
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private async handleSaveApplication() {
    if (!this.selectedJobTargetId) return;
    this.saving = true;
    this.error = '';
    try {
      const shadow = this.shadowRoot;
      const get = (id: string) => (shadow?.getElementById(id) as HTMLTextAreaElement)?.value ?? '';
      const companyFuture = get('a-future');
      const contributionAction = get('a-contribution');
      const leveragedExperience = get('a-experience');
      const formattedText =
        get('a-formatted') ||
        composeApplicationMotiveText({ companyFuture, contributionAction, leveragedExperience });
      const patch = { companyFuture, contributionAction, leveragedExperience, formattedText };
      if (this.applicationMotive) {
        this.applicationMotive = await updateApplicationMotive(this.applicationMotive.id, patch);
      } else {
        this.applicationMotive = await createApplicationMotive({
          jobTargetId: this.selectedJobTargetId,
          ...patch,
        });
      }
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private async handleDeleteResignation() {
    if (!this.resignationMotive) return;
    await deleteResignationMotive(this.resignationMotive.id);
    this.resignationMotive = null;
    this.confirmDeleteType = null;
  }

  private async handleDeleteApplication() {
    if (!this.applicationMotive) return;
    await deleteApplicationMotive(this.applicationMotive.id);
    this.applicationMotive = null;
    this.confirmDeleteType = null;
  }

  private async handleJobTargetChange(e: Event) {
    this.selectedJobTargetId = (e.target as HTMLSelectElement).value;
    await this.loadApplicationMotive();
  }

  private handleCopyFormatted() {
    const text =
      (this.shadowRoot?.getElementById('a-formatted') as HTMLTextAreaElement)?.value ||
      this.buildPreview();
    navigator.clipboard.writeText(text).catch(() => {});
  }

  override render() {
    const preview = this.buildPreview();
    return html`
      <div class="panel">
        <h2>志望動機</h2>

        <!-- 本音の転職理由 -->
        <div class="section">
          <p class="section-title">本音の転職理由</p>
          <span class="warning-badge">⚠ 本音は企業には伝えないでください（書類・面接で使わない）</span>

          <label for="r-company">会社への不満</label>
          <textarea id="r-company" rows="2">${this.getResignationField('companyDissatisfaction')}</textarea>

          <label for="r-job">仕事への不満</label>
          <textarea id="r-job" rows="2">${this.getResignationField('jobDissatisfaction')}</textarea>

          <label for="r-compensation">待遇への不満</label>
          <textarea id="r-compensation" rows="2">${this.getResignationField('compensationDissatisfaction')}</textarea>

          <label for="r-relationship">人間関係への不満</label>
          <textarea id="r-relationship" rows="2">${this.getResignationField('relationshipDissatisfaction')}</textarea>

          <label for="r-intent">次の転職でどう解消したいか</label>
          <textarea id="r-intent" rows="2">${this.getResignationField('resolutionIntent')}</textarea>

          <label for="r-note">メモ（任意）</label>
          <textarea id="r-note" rows="2">${this.getResignationField('note')}</textarea>

          <div class="btn-row">
            <button class="save-btn" @click=${this.handleSaveResignation} ?disabled=${this.saving}>保存</button>
            ${
              this.resignationMotive
                ? this.confirmDeleteType === 'resignation'
                  ? html`
                  <button class="del-btn" @click=${this.handleDeleteResignation}>本当に削除する</button>
                  <button class="save-btn" @click=${() => {
                    this.confirmDeleteType = null;
                  }}>キャンセル</button>
                `
                  : html`<button class="del-btn" @click=${() => {
                      this.confirmDeleteType = 'resignation';
                    }}>削除</button>`
                : ''
            }
          </div>
        </div>

        <!-- 建前の志望動機 -->
        <div class="section">
          <p class="section-title">建前の志望動機（求人ごと）</p>

          <label for="jt-select">求人を選択</label>
          <select id="jt-select" @change=${this.handleJobTargetChange}>
            <option value="">— 選択してください —</option>
            ${this.jobTargets.map(
              (jt) =>
                html`<option value=${jt.id} ?selected=${jt.id === this.selectedJobTargetId}>${jt.companyName} — ${jt.jobTitle}</option>`,
            )}
          </select>

          ${
            this.selectedJobTargetId
              ? html`
              <label for="a-future">企業が描く未来（IR・中期経営計画・社長挨拶から）</label>
              <textarea id="a-future" rows="2">${this.getApplicationField('companyFuture')}</textarea>

              <label for="a-contribution">貢献行動（採用情報・中計に書いてある内容）</label>
              <textarea id="a-contribution" rows="2">${this.getApplicationField('contributionAction')}</textarea>

              <label for="a-experience">生かす経験（自分の経験から）</label>
              <textarea id="a-experience" rows="2">${this.getApplicationField('leveragedExperience')}</textarea>

              <label>プレビュー（書籍フォーマット）</label>
              <div class="preview-box">${preview || '（3 つのフィールドを入力するとプレビューが生成されます）'}</div>

              <label for="a-formatted">最終文（手動編集可）</label>
              <textarea id="a-formatted" rows="3">${this.getApplicationField('formattedText') || preview}</textarea>

              <div class="btn-row">
                <button class="save-btn" @click=${this.handleSaveApplication} ?disabled=${this.saving}>保存</button>
                <button class="copy-btn" @click=${this.handleCopyFormatted}>コピー</button>
                ${
                  this.applicationMotive
                    ? this.confirmDeleteType === 'application'
                      ? html`
                      <button class="del-btn" @click=${this.handleDeleteApplication}>本当に削除する</button>
                      <button class="save-btn" @click=${() => {
                        this.confirmDeleteType = null;
                      }}>キャンセル</button>
                    `
                      : html`<button class="del-btn" @click=${() => {
                          this.confirmDeleteType = 'application';
                        }}>削除</button>`
                    : ''
                }
              </div>
            `
              : html`<p class="empty-note">求人を選択すると入力フォームが表示されます</p>`
          }
        </div>

        ${this.error ? html`<p class="error">${this.error}</p>` : ''}
      </div>
    `;
  }
}

customElements.define('application-motive-view', ApplicationMotiveView);
