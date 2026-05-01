import type { JobTarget, SkillItem } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createJobTarget,
  deleteJobTarget,
  listJobTargets,
  updateJobTarget,
} from './ipc/job-targets.js';

const STATUSES: { value: JobTarget['status']; label: string }[] = [
  { value: 'researching', label: '調査中' },
  { value: 'applying', label: '応募準備' },
  { value: 'interviewing', label: '面接中' },
  { value: 'offered', label: 'オファー' },
  { value: 'rejected', label: '不採用' },
  { value: 'withdrawn', label: '辞退' },
];

type FormState = {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  status: JobTarget['status'];
  requiredSkills: SkillItem[];
  preferredSkills: SkillItem[];
  concerns: string;
  appealPoints: string;
};

function emptyForm(): FormState {
  return {
    companyName: '',
    jobTitle: '',
    jobDescription: '',
    status: 'researching',
    requiredSkills: [],
    preferredSkills: [],
    concerns: '',
    appealPoints: '',
  };
}

function newSkillId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

class JobTargetView extends LitElement {
  static override properties = {
    targets: { state: true },
    form: { state: true },
    editingId: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteId: { state: true },
  };

  declare targets: JobTarget[];
  declare form: FormState;
  declare editingId: string;
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteId: string;

  constructor() {
    super();
    this.targets = [];
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
    h2 { margin: 0 0 0.75rem; font-size: 1rem; color: #555; }
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
    .skills-block {
      grid-column: 1 / -1;
      border: 1px solid #eee;
      border-radius: 0.3rem;
      padding: 0.6rem 0.8rem;
      margin-bottom: 0.5rem;
    }
    .skill-row {
      display: flex;
      gap: 0.4rem;
      margin-bottom: 0.4rem;
    }
    .skill-row input { flex: 1; }
    button.skill-del {
      padding: 0.2rem 0.6rem;
      font-size: 0.8rem;
      border: 1px solid #f5c0c0;
      background: #fff;
      color: #c00;
      border-radius: 0.25rem;
      cursor: pointer;
    }
    button.skill-add {
      padding: 0.3rem 0.7rem;
      font-size: 0.8rem;
      border: 1px dashed #aaa;
      background: #fafafa;
      color: #555;
      border-radius: 0.25rem;
      cursor: pointer;
    }
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
    .target-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .target-card {
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 0.75rem 1rem;
    }
    .target-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .target-meta { font-size: 0.8rem; color: #888; margin-bottom: 0.25rem; }
    .target-title { font-size: 0.95rem; font-weight: 600; }
    .target-detail { font-size: 0.85rem; color: #555; margin-top: 0.25rem; white-space: pre-wrap; }
    .skill-tags { display: flex; gap: 0.3rem; flex-wrap: wrap; margin-top: 0.4rem; }
    .skill-tag {
      background: #f0f0f0;
      border-radius: 999px;
      padding: 0.1rem 0.5rem;
      font-size: 0.75rem;
      color: #555;
    }
    .skill-tag.preferred { background: #e8f0fe; color: #1a56c4; }
    .target-btns { display: flex; gap: 0.4rem; flex-shrink: 0; }
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
    .status-badge {
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
      this.targets = await listJobTargets();
    } catch (e) {
      this.error = String(e);
    }
  }

  private get formValid(): boolean {
    return this.form.companyName.trim().length > 0 && this.form.jobTitle.trim().length > 0;
  }

  private setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    this.form = { ...this.form, [field]: value };
  }

  private addSkill(kind: 'requiredSkills' | 'preferredSkills') {
    this.form = {
      ...this.form,
      [kind]: [...this.form[kind], { id: newSkillId(), text: '' }],
    };
  }

  private updateSkillText(kind: 'requiredSkills' | 'preferredSkills', index: number, text: string) {
    const next = this.form[kind].map((s, i) => (i === index ? { ...s, text } : s));
    this.form = { ...this.form, [kind]: next };
  }

  private removeSkill(kind: 'requiredSkills' | 'preferredSkills', index: number) {
    this.form = {
      ...this.form,
      [kind]: this.form[kind].filter((_, i) => i !== index),
    };
  }

  private async handleSave() {
    if (!this.formValid) return;
    this.saving = true;
    this.error = '';
    try {
      const trimmedRequired = this.form.requiredSkills.filter((s) => s.text.trim() !== '');
      const trimmedPreferred = this.form.preferredSkills.filter((s) => s.text.trim() !== '');

      if (this.editingId) {
        await updateJobTarget(this.editingId, {
          companyName: this.form.companyName.trim(),
          jobTitle: this.form.jobTitle.trim(),
          jobDescription: this.form.jobDescription,
          status: this.form.status,
          requiredSkills: trimmedRequired,
          preferredSkills: trimmedPreferred,
          concerns: this.form.concerns,
          appealPoints: this.form.appealPoints,
        });
      } else {
        await createJobTarget({
          companyName: this.form.companyName.trim(),
          jobTitle: this.form.jobTitle.trim(),
          jobDescription: this.form.jobDescription,
          status: this.form.status,
          requiredSkills: trimmedRequired,
          preferredSkills: trimmedPreferred,
          concerns: this.form.concerns,
          appealPoints: this.form.appealPoints,
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

  private handleEdit(target: JobTarget) {
    this.editingId = target.id;
    this.form = {
      companyName: target.companyName,
      jobTitle: target.jobTitle,
      jobDescription: target.jobDescription,
      status: target.status,
      requiredSkills: target.requiredSkills.map((s) => ({ ...s })),
      preferredSkills: target.preferredSkills.map((s) => ({ ...s })),
      concerns: target.concerns,
      appealPoints: target.appealPoints,
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
      await deleteJobTarget(id);
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

  private statusLabel(value: string): string {
    return STATUSES.find((s) => s.value === value)?.label ?? value;
  }

  override render() {
    return html`
      <div class="panel">
        <h1>求人</h1>

        <div class="form-grid">
          <div>
            <label>会社名 *</label>
            <input
              type="text"
              .value=${this.form.companyName}
              @input=${(e: Event) => this.setField('companyName', (e.target as HTMLInputElement).value)}
              placeholder="例: Acme Corp"
            />
          </div>
          <div>
            <label>職種 *</label>
            <input
              type="text"
              .value=${this.form.jobTitle}
              @input=${(e: Event) => this.setField('jobTitle', (e.target as HTMLInputElement).value)}
              placeholder="例: シニアエンジニア"
            />
          </div>
          <div class="full">
            <label>求人説明</label>
            <textarea
              .value=${this.form.jobDescription}
              @input=${(e: Event) => this.setField('jobDescription', (e.target as HTMLTextAreaElement).value)}
              placeholder="求人票の本文を貼り付け"
            ></textarea>
          </div>
          <div>
            <label>ステータス</label>
            <select
              .value=${this.form.status}
              @change=${(e: Event) =>
                this.setField(
                  'status',
                  (e.target as HTMLSelectElement).value as JobTarget['status'],
                )}
            >
              ${STATUSES.map(
                (s) =>
                  html`<option value=${s.value} ?selected=${this.form.status === s.value}>${s.label}</option>`,
              )}
            </select>
          </div>
          <div></div>

          <div class="skills-block">
            <h2>必須要件</h2>
            ${this.form.requiredSkills.map(
              (s, i) => html`
              <div class="skill-row">
                <input
                  type="text"
                  .value=${s.text}
                  @input=${(e: Event) =>
                    this.updateSkillText('requiredSkills', i, (e.target as HTMLInputElement).value)}
                  placeholder="例: TypeScript 3 年以上"
                />
                <button class="skill-del" @click=${() => this.removeSkill('requiredSkills', i)}>削除</button>
              </div>
            `,
            )}
            <button class="skill-add" @click=${() => this.addSkill('requiredSkills')}>+ 必須要件を追加</button>
          </div>

          <div class="skills-block">
            <h2>歓迎要件</h2>
            ${this.form.preferredSkills.map(
              (s, i) => html`
              <div class="skill-row">
                <input
                  type="text"
                  .value=${s.text}
                  @input=${(e: Event) =>
                    this.updateSkillText(
                      'preferredSkills',
                      i,
                      (e.target as HTMLInputElement).value,
                    )}
                  placeholder="例: Tauri / Rust の知識"
                />
                <button class="skill-del" @click=${() => this.removeSkill('preferredSkills', i)}>削除</button>
              </div>
            `,
            )}
            <button class="skill-add" @click=${() => this.addSkill('preferredSkills')}>+ 歓迎要件を追加</button>
          </div>

          <div class="full">
            <label>気がかり</label>
            <textarea
              .value=${this.form.concerns}
              @input=${(e: Event) => this.setField('concerns', (e.target as HTMLTextAreaElement).value)}
              placeholder="自分の弱点や懸念点をメモ"
            ></textarea>
          </div>
          <div class="full">
            <label>アピールポイント</label>
            <textarea
              .value=${this.form.appealPoints}
              @input=${(e: Event) => this.setField('appealPoints', (e.target as HTMLTextAreaElement).value)}
              placeholder="この求人に向けて押し出したい強み"
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
          this.targets.length === 0
            ? html`<p class="empty">求人はまだ登録されていません</p>`
            : html`
            <div class="target-list">
              ${this.targets.map((t) => this.renderTarget(t))}
            </div>
          `
        }
      </div>
    `;
  }

  private renderTarget(target: JobTarget) {
    const isDeletingThis = this.confirmDeleteId === target.id;
    return html`
      <div class="target-card">
        <div class="target-header">
          <div>
            <div class="target-meta">
              <span class="status-badge">${this.statusLabel(target.status)}</span>
              ${target.companyName}
            </div>
            <div class="target-title">${target.jobTitle}</div>
            ${target.jobDescription ? html`<div class="target-detail">${target.jobDescription}</div>` : ''}
            ${
              target.requiredSkills.length > 0
                ? html`
                <div class="skill-tags">
                  ${target.requiredSkills.map((s) => html`<span class="skill-tag">必須: ${s.text}</span>`)}
                </div>
              `
                : ''
            }
            ${
              target.preferredSkills.length > 0
                ? html`
                <div class="skill-tags">
                  ${target.preferredSkills.map((s) => html`<span class="skill-tag preferred">歓迎: ${s.text}</span>`)}
                </div>
              `
                : ''
            }
          </div>
          <div class="target-btns">
            <button class="edit-btn" @click=${() => this.handleEdit(target)}>編集</button>
            <button
              class=${`del-btn${isDeletingThis ? ' confirm' : ''}`}
              @click=${() =>
                isDeletingThis
                  ? this.handleDeleteConfirm(target.id)
                  : this.handleDeleteClick(target.id)}
            >${isDeletingThis ? '本当に削除' : '削除'}</button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('job-target-view', JobTargetView);
