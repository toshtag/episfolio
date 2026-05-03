import type { InterviewReport, JobTarget } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createInterviewReport,
  deleteInterviewReport,
  listInterviewReportsByJobTarget,
  updateInterviewReport,
} from './ipc/interview-reports.js';
import { listJobTargets } from './ipc/job-targets.js';

const STAGES: { value: InterviewReport['stage']; label: string }[] = [
  { value: 'first', label: '一次面接' },
  { value: 'second', label: '二次面接' },
  { value: 'final', label: '最終面接' },
  { value: 'other', label: 'その他' },
];

type FormState = {
  stage: InterviewReport['stage'];
  interviewerNote: string;
  qaNote: string;
  motivationChangeNote: string;
  questionsToBringNote: string;
  conductedAt: string;
};

function emptyForm(): FormState {
  return {
    stage: 'first',
    interviewerNote: '',
    qaNote: '',
    motivationChangeNote: '',
    questionsToBringNote: '',
    conductedAt: '',
  };
}

function stageLabel(stage: InterviewReport['stage']): string {
  return STAGES.find((s) => s.value === stage)?.label ?? stage;
}

class InterviewReportView extends LitElement {
  static override properties = {
    jobTargets: { state: true },
    selectedJobTargetId: { state: true },
    reports: { state: true },
    form: { state: true },
    editingId: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteId: { state: true },
  };

  declare jobTargets: JobTarget[];
  declare selectedJobTargetId: string;
  declare reports: InterviewReport[];
  declare form: FormState;
  declare editingId: string;
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteId: string;

  constructor() {
    super();
    this.jobTargets = [];
    this.selectedJobTargetId = '';
    this.reports = [];
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
    .target-select { margin-bottom: 1.5rem; }
    .target-select label { font-size: 0.85rem; color: #555; display: block; margin-bottom: 0.25rem; }
    select {
      width: 100%;
      padding: 0.4rem 0.6rem;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      box-sizing: border-box;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem 1rem;
      margin-bottom: 1rem;
    }
    .form-grid .full { grid-column: 1 / -1; }
    label { font-size: 0.85rem; color: #555; display: block; margin-bottom: 0.25rem; }
    input, textarea {
      width: 100%;
      padding: 0.4rem 0.6rem;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      box-sizing: border-box;
    }
    textarea { min-height: 4rem; resize: vertical; }
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
    .error { color: #c00; font-size: 0.85rem; }
    .section { margin-bottom: 2rem; }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e0e0e0;
    }
    .section-header h2 { margin: 0; font-size: 1.1rem; }
    .report-card {
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .report-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .stage-badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      font-size: 0.8rem;
      font-weight: bold;
      border-radius: 1rem;
      background: #f0f0f0;
      color: #333;
    }
    .conducted-at { font-size: 0.8rem; color: #888; }
    .card-actions { display: flex; gap: 0.4rem; }
    button.edit-btn {
      padding: 0.3rem 0.8rem;
      font-size: 0.8rem;
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.delete-btn {
      padding: 0.3rem 0.8rem;
      font-size: 0.8rem;
      background: #fff;
      color: #c00;
      border: 1px solid #fcc;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.confirm-delete-btn {
      padding: 0.3rem 0.8rem;
      font-size: 0.8rem;
      background: #c00;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    .note-section { margin-bottom: 0.75rem; }
    .note-label { font-size: 0.75rem; font-weight: bold; color: #666; margin-bottom: 0.25rem; }
    .note-body { font-size: 0.9rem; white-space: pre-wrap; color: #333; }
    .note-empty { font-size: 0.85rem; color: #aaa; font-style: italic; }
    .empty-state { color: #999; font-size: 0.9rem; padding: 1rem 0; }
    .add-section {
      border: 1px dashed #ccc;
      border-radius: 0.4rem;
      padding: 1rem;
      margin-bottom: 2rem;
    }
    .add-section h2 { margin: 0 0 1rem; font-size: 1rem; color: #555; }
  `;

  override connectedCallback() {
    super.connectedCallback();
    void this.loadJobTargets();
  }

  private async loadJobTargets() {
    try {
      this.jobTargets = await listJobTargets();
      if (this.jobTargets.length > 0 && !this.selectedJobTargetId) {
        this.selectedJobTargetId = this.jobTargets[0]?.id ?? '';
        await this.loadReports();
      }
    } catch (e) {
      this.error = String(e);
    }
  }

  private async loadReports() {
    if (!this.selectedJobTargetId) return;
    try {
      this.reports = await listInterviewReportsByJobTarget(this.selectedJobTargetId);
    } catch (e) {
      this.error = String(e);
    }
  }

  private onJobTargetChange(e: Event) {
    this.selectedJobTargetId = (e.target as HTMLSelectElement).value;
    this.reports = [];
    void this.loadReports();
  }

  private startEdit(r: InterviewReport) {
    this.editingId = r.id;
    this.form = {
      stage: r.stage,
      interviewerNote: r.interviewerNote,
      qaNote: r.qaNote,
      motivationChangeNote: r.motivationChangeNote,
      questionsToBringNote: r.questionsToBringNote,
      conductedAt: r.conductedAt ?? '',
    };
    this.error = '';
  }

  private cancelEdit() {
    this.editingId = '';
    this.form = emptyForm();
    this.error = '';
  }

  private updateField(field: keyof FormState, value: string) {
    this.form = { ...this.form, [field]: value };
  }

  private async save() {
    if (this.saving) return;
    this.saving = true;
    this.error = '';
    try {
      const conductedAt = this.form.conductedAt.trim() || null;
      if (this.editingId) {
        await updateInterviewReport(this.editingId, {
          stage: this.form.stage,
          interviewerNote: this.form.interviewerNote,
          qaNote: this.form.qaNote,
          motivationChangeNote: this.form.motivationChangeNote,
          questionsToBringNote: this.form.questionsToBringNote,
          conductedAt,
        });
      } else {
        await createInterviewReport({
          jobTargetId: this.selectedJobTargetId,
          stage: this.form.stage,
          interviewerNote: this.form.interviewerNote,
          qaNote: this.form.qaNote,
          motivationChangeNote: this.form.motivationChangeNote,
          questionsToBringNote: this.form.questionsToBringNote,
          conductedAt,
        });
      }
      this.editingId = '';
      this.form = emptyForm();
      await this.loadReports();
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private async confirmDelete(id: string) {
    if (this.confirmDeleteId === id) {
      try {
        await deleteInterviewReport(id);
        this.confirmDeleteId = '';
        await this.loadReports();
      } catch (e) {
        this.error = String(e);
      }
    } else {
      this.confirmDeleteId = id;
    }
  }

  private renderForm() {
    return html`
      <div class="add-section">
        <h2>${this.editingId ? '報告シートを編集' : '面接後報告シートを追加'}</h2>
        <div class="form-grid">
          <div>
            <label>面接段階</label>
            <select
              .value=${this.form.stage}
              @change=${(e: Event) =>
                this.updateField(
                  'stage',
                  (e.target as HTMLSelectElement).value as InterviewReport['stage'],
                )}
            >
              ${STAGES.map(
                (s) =>
                  html`<option value=${s.value} ?selected=${this.form.stage === s.value}>${s.label}</option>`,
              )}
            </select>
          </div>
          <div>
            <label>実施日（任意）</label>
            <input
              type="date"
              .value=${this.form.conductedAt}
              @input=${(e: Event) => this.updateField('conductedAt', (e.target as HTMLInputElement).value)}
            />
          </div>
          <div class="full">
            <label>面接官メモ</label>
            <textarea
              .value=${this.form.interviewerNote}
              @input=${(e: Event) => this.updateField('interviewerNote', (e.target as HTMLTextAreaElement).value)}
              placeholder="面接官の印象・特徴など"
            ></textarea>
          </div>
          <div class="full">
            <label>Q&amp;Aメモ</label>
            <textarea
              .value=${this.form.qaNote}
              @input=${(e: Event) => this.updateField('qaNote', (e.target as HTMLTextAreaElement).value)}
              placeholder="実際に聞かれた質問と自分の回答など"
            ></textarea>
          </div>
          <div class="full">
            <label>志望度変化メモ</label>
            <textarea
              .value=${this.form.motivationChangeNote}
              @input=${(e: Event) =>
                this.updateField('motivationChangeNote', (e.target as HTMLTextAreaElement).value)}
              placeholder="面接後の志望度変化・感想など"
            ></textarea>
          </div>
          <div class="full">
            <label>次回への持ち込み質問メモ</label>
            <textarea
              .value=${this.form.questionsToBringNote}
              @input=${(e: Event) =>
                this.updateField('questionsToBringNote', (e.target as HTMLTextAreaElement).value)}
              placeholder="次の面接で聞きたいことなど"
            ></textarea>
          </div>
        </div>
        <div class="actions">
          <button class="save-btn" ?disabled=${this.saving} @click=${this.save}>
            ${this.saving ? '保存中...' : '保存'}
          </button>
          ${
            this.editingId
              ? html`<button class="cancel-btn" @click=${this.cancelEdit}>キャンセル</button>`
              : ''
          }
          ${this.error ? html`<span class="error">${this.error}</span>` : ''}
        </div>
      </div>
    `;
  }

  private renderReport(r: InterviewReport) {
    const isEditing = this.editingId === r.id;
    if (isEditing) return this.renderForm();

    const notes: { label: string; value: string }[] = [
      { label: '面接官メモ', value: r.interviewerNote },
      { label: 'Q&Aメモ', value: r.qaNote },
      { label: '志望度変化メモ', value: r.motivationChangeNote },
      { label: '次回への持ち込み質問', value: r.questionsToBringNote },
    ];
    const hasAny = notes.some((n) => n.value.trim());

    return html`
      <div class="report-card">
        <div class="report-card-header">
          <div>
            <span class="stage-badge">${stageLabel(r.stage)}</span>
            ${r.conductedAt ? html`<span class="conducted-at">&nbsp;${r.conductedAt}</span>` : ''}
          </div>
          <div class="card-actions">
            <button class="edit-btn" @click=${() => this.startEdit(r)}>編集</button>
            <button
              class=${this.confirmDeleteId === r.id ? 'confirm-delete-btn' : 'delete-btn'}
              @click=${() => this.confirmDelete(r.id)}
            >
              ${this.confirmDeleteId === r.id ? '本当に削除' : '削除'}
            </button>
          </div>
        </div>
        ${
          hasAny
            ? notes
                .filter((n) => n.value.trim())
                .map(
                  (n) => html`
                  <div class="note-section">
                    <div class="note-label">${n.label}</div>
                    <div class="note-body">${n.value}</div>
                  </div>
                `,
                )
            : html`<div class="note-empty">メモはまだありません</div>`
        }
      </div>
    `;
  }

  override render() {
    const isAdding = !this.editingId;
    return html`
      <div class="panel">
        <h1>面接後報告シート</h1>
        <div class="target-select">
          <label>対象求人</label>
          <select @change=${this.onJobTargetChange}>
            ${this.jobTargets.map(
              (t) => html`
                <option value=${t.id} ?selected=${t.id === this.selectedJobTargetId}>
                  ${t.companyName} — ${t.jobTitle}
                </option>
              `,
            )}
          </select>
        </div>

        ${isAdding ? this.renderForm() : ''}

        <div class="section">
          ${
            this.reports.length === 0
              ? html`<div class="empty-state">報告シートがまだありません。上のフォームから追加してください。</div>`
              : this.reports.map((r) => this.renderReport(r))
          }
        </div>
      </div>
    `;
  }
}

customElements.define('interview-report-view', InterviewReportView);
