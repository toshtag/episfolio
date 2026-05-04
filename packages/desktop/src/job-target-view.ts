import type {
  ApplicationRoute,
  EmploymentType,
  JobTarget,
  SkillItem,
  WageType,
} from '@episfolio/kernel';
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

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'regular', label: '正社員' },
  { value: 'contract', label: '契約社員' },
  { value: 'dispatch', label: '派遣' },
  { value: 'other', label: 'その他' },
];

const WAGE_TYPES: { value: WageType; label: string }[] = [
  { value: 'monthly', label: '月給制' },
  { value: 'annual', label: '年俸制' },
  { value: 'commission', label: '完全歩合' },
  { value: 'other', label: 'その他' },
];

const APPLICATION_ROUTES: { value: ApplicationRoute; label: string }[] = [
  { value: 'direct', label: '直接応募' },
  { value: 'site', label: '求人サイト' },
  { value: 'agent', label: 'エージェント' },
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
  annualHolidays: string;
  workingHoursPerDay: string;
  commuteTimeMinutes: string;
  employmentType: EmploymentType | '';
  flexTimeAvailable: boolean | null;
  remoteWorkAvailable: boolean | null;
  averagePaidLeaveTaken: string;
  vacancyReason: string;
  currentTeamSize: string;
  applicationRoute: ApplicationRoute | '';
  wageType: WageType | '';
  basicSalary: string;
  fixedOvertimeHours: string;
  bonusBaseMonths: string;
  hasFutureRaisePromise: boolean | null;
  futureRaisePromiseInContract: boolean | null;
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
    annualHolidays: '',
    workingHoursPerDay: '',
    commuteTimeMinutes: '',
    employmentType: '',
    flexTimeAvailable: null,
    remoteWorkAvailable: null,
    averagePaidLeaveTaken: '',
    vacancyReason: '',
    currentTeamSize: '',
    applicationRoute: '',
    wageType: '',
    basicSalary: '',
    fixedOvertimeHours: '',
    bonusBaseMonths: '',
    hasFutureRaisePromise: null,
    futureRaisePromiseInContract: null,
  };
}

function formToTarget(form: FormState): Parameters<typeof createJobTarget>[0] {
  const parseNum = (v: string): number | null => {
    const n = Number(v);
    return v.trim() !== '' && !Number.isNaN(n) ? n : null;
  };
  return {
    companyName: form.companyName.trim(),
    jobTitle: form.jobTitle.trim(),
    jobDescription: form.jobDescription,
    status: form.status,
    requiredSkills: form.requiredSkills.filter((s) => s.text.trim() !== ''),
    preferredSkills: form.preferredSkills.filter((s) => s.text.trim() !== ''),
    concerns: form.concerns,
    appealPoints: form.appealPoints,
    annualHolidays: parseNum(form.annualHolidays),
    workingHoursPerDay: parseNum(form.workingHoursPerDay),
    commuteTimeMinutes: parseNum(form.commuteTimeMinutes),
    employmentType: form.employmentType || null,
    flexTimeAvailable: form.flexTimeAvailable,
    remoteWorkAvailable: form.remoteWorkAvailable,
    averagePaidLeaveTaken: parseNum(form.averagePaidLeaveTaken),
    vacancyReason: form.vacancyReason || null,
    currentTeamSize: parseNum(form.currentTeamSize),
    applicationRoute: form.applicationRoute || null,
    wageType: form.wageType || null,
    basicSalary: parseNum(form.basicSalary),
    fixedOvertimeHours: parseNum(form.fixedOvertimeHours),
    bonusBaseMonths: parseNum(form.bonusBaseMonths),
    hasFutureRaisePromise: form.hasFutureRaisePromise,
    futureRaisePromiseInContract: form.futureRaisePromiseInContract,
  };
}

function targetToForm(target: JobTarget): FormState {
  return {
    companyName: target.companyName,
    jobTitle: target.jobTitle,
    jobDescription: target.jobDescription,
    status: target.status,
    requiredSkills: target.requiredSkills.map((s) => ({ ...s })),
    preferredSkills: target.preferredSkills.map((s) => ({ ...s })),
    concerns: target.concerns,
    appealPoints: target.appealPoints,
    annualHolidays: target.annualHolidays != null ? String(target.annualHolidays) : '',
    workingHoursPerDay: target.workingHoursPerDay != null ? String(target.workingHoursPerDay) : '',
    commuteTimeMinutes: target.commuteTimeMinutes != null ? String(target.commuteTimeMinutes) : '',
    employmentType: target.employmentType ?? '',
    flexTimeAvailable: target.flexTimeAvailable,
    remoteWorkAvailable: target.remoteWorkAvailable,
    averagePaidLeaveTaken:
      target.averagePaidLeaveTaken != null ? String(target.averagePaidLeaveTaken) : '',
    vacancyReason: target.vacancyReason ?? '',
    currentTeamSize: target.currentTeamSize != null ? String(target.currentTeamSize) : '',
    applicationRoute: target.applicationRoute ?? '',
    wageType: target.wageType ?? '',
    basicSalary: target.basicSalary != null ? String(target.basicSalary) : '',
    fixedOvertimeHours: target.fixedOvertimeHours != null ? String(target.fixedOvertimeHours) : '',
    bonusBaseMonths: target.bonusBaseMonths != null ? String(target.bonusBaseMonths) : '',
    hasFutureRaisePromise: target.hasFutureRaisePromise,
    futureRaisePromiseInContract: target.futureRaisePromiseInContract,
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
    h3 { margin: 1rem 0 0.5rem; font-size: 0.9rem; color: #333; border-bottom: 1px solid #eee; padding-bottom: 0.3rem; }
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
    .warn-badge {
      display: inline-block;
      font-size: 0.75rem;
      padding: 0.1rem 0.6rem;
      border-radius: 0.25rem;
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffe69c;
      margin-top: 0.4rem;
    }
    .section-divider {
      grid-column: 1 / -1;
      border: none;
      border-top: 1px solid #eee;
      margin: 0.5rem 0;
    }
    .tristate-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-top: 0.25rem;
    }
    .tristate-group button {
      padding: 0.25rem 0.6rem;
      font-size: 0.8rem;
      border: 1px solid #ccc;
      border-radius: 0.25rem;
      cursor: pointer;
      background: #fff;
      color: #555;
    }
    .tristate-group button.active-yes {
      background: #d1fae5;
      border-color: #6ee7b7;
      color: #065f46;
    }
    .tristate-group button.active-no {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #7f1d1d;
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
      const args = formToTarget(this.form);
      if (this.editingId) {
        await updateJobTarget(this.editingId, args);
      } else {
        await createJobTarget(args);
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
    this.form = targetToForm(target);
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

  private renderTristate(
    field:
      | 'flexTimeAvailable'
      | 'remoteWorkAvailable'
      | 'hasFutureRaisePromise'
      | 'futureRaisePromiseInContract',
    labelYes: string,
    labelNo: string,
  ) {
    const v = this.form[field];
    return html`
      <div class="tristate-group">
        <button
          class=${v === true ? 'active-yes' : ''}
          @click=${() => this.setField(field, v === true ? null : true)}
        >${labelYes}</button>
        <button
          class=${v === false ? 'active-no' : ''}
          @click=${() => this.setField(field, v === false ? null : false)}
        >${labelNo}</button>
        ${v !== null ? html`<button @click=${() => this.setField(field, null)}>クリア</button>` : ''}
      </div>
    `;
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
          <div>
            <label>応募経路</label>
            <select
              .value=${this.form.applicationRoute}
              @change=${(e: Event) =>
                this.setField(
                  'applicationRoute',
                  (e.target as HTMLSelectElement).value as ApplicationRoute | '',
                )}
            >
              <option value="">— 未選択 —</option>
              ${APPLICATION_ROUTES.map(
                (r) =>
                  html`<option value=${r.value} ?selected=${this.form.applicationRoute === r.value}>${r.label}</option>`,
              )}
            </select>
          </div>

          <hr class="section-divider" />
          <div class="full"><h3>求人票分析</h3></div>

          <div>
            <label>雇用形態</label>
            <select
              .value=${this.form.employmentType}
              @change=${(e: Event) =>
                this.setField(
                  'employmentType',
                  (e.target as HTMLSelectElement).value as EmploymentType | '',
                )}
            >
              <option value="">— 未選択 —</option>
              ${EMPLOYMENT_TYPES.map(
                (t) =>
                  html`<option value=${t.value} ?selected=${this.form.employmentType === t.value}>${t.label}</option>`,
              )}
            </select>
          </div>
          <div>
            <label>年間休日（日）</label>
            <input
              type="number"
              .value=${this.form.annualHolidays}
              @input=${(e: Event) =>
                this.setField('annualHolidays', (e.target as HTMLInputElement).value)}
              placeholder="例: 125"
              min="0"
            />
          </div>
          <div>
            <label>所定就業時間（h/日）</label>
            <input
              type="number"
              .value=${this.form.workingHoursPerDay}
              @input=${(e: Event) =>
                this.setField('workingHoursPerDay', (e.target as HTMLInputElement).value)}
              placeholder="例: 7.5"
              min="0"
              step="0.5"
            />
          </div>
          <div>
            <label>通勤時間・片道（分）</label>
            <input
              type="number"
              .value=${this.form.commuteTimeMinutes}
              @input=${(e: Event) =>
                this.setField('commuteTimeMinutes', (e.target as HTMLInputElement).value)}
              placeholder="例: 45"
              min="0"
            />
          </div>
          <div>
            <label>フレックスタイム</label>
            ${this.renderTristate('flexTimeAvailable', 'あり', 'なし')}
          </div>
          <div>
            <label>リモートワーク</label>
            ${this.renderTristate('remoteWorkAvailable', 'あり', 'なし')}
          </div>
          <div>
            <label>有給平均取得（日/年）</label>
            <input
              type="number"
              .value=${this.form.averagePaidLeaveTaken}
              @input=${(e: Event) =>
                this.setField('averagePaidLeaveTaken', (e.target as HTMLInputElement).value)}
              placeholder="例: 10"
              min="0"
              step="0.5"
            />
          </div>
          <div>
            <label>既存体制人数</label>
            <input
              type="number"
              .value=${this.form.currentTeamSize}
              @input=${(e: Event) =>
                this.setField('currentTeamSize', (e.target as HTMLInputElement).value)}
              placeholder="例: 8"
              min="1"
            />
          </div>
          <div class="full">
            <label>募集背景（前任退職理由・増員経緯）</label>
            <textarea
              .value=${this.form.vacancyReason}
              @input=${(e: Event) =>
                this.setField('vacancyReason', (e.target as HTMLTextAreaElement).value)}
              placeholder="前任者退職のため、増員など"
            ></textarea>
          </div>

          <hr class="section-divider" />
          <div class="full"><h3>給与・賞与</h3></div>

          <div>
            <label>賃金形態</label>
            <select
              .value=${this.form.wageType}
              @change=${(e: Event) =>
                this.setField('wageType', (e.target as HTMLSelectElement).value as WageType | '')}
            >
              <option value="">— 未選択 —</option>
              ${WAGE_TYPES.map(
                (w) =>
                  html`<option value=${w.value} ?selected=${this.form.wageType === w.value}>${w.label}</option>`,
              )}
            </select>
          </div>
          <div>
            <label>基本給（円/月）</label>
            <input
              type="number"
              .value=${this.form.basicSalary}
              @input=${(e: Event) =>
                this.setField('basicSalary', (e.target as HTMLInputElement).value)}
              placeholder="例: 300000"
              min="0"
            />
          </div>
          <div>
            <label>固定残業時間（h/月）</label>
            <input
              type="number"
              .value=${this.form.fixedOvertimeHours}
              @input=${(e: Event) =>
                this.setField('fixedOvertimeHours', (e.target as HTMLInputElement).value)}
              placeholder="例: 30"
              min="0"
              step="0.5"
            />
          </div>
          <div>
            <label>賞与算定基礎（月数）</label>
            <input
              type="number"
              .value=${this.form.bonusBaseMonths}
              @input=${(e: Event) =>
                this.setField('bonusBaseMonths', (e.target as HTMLInputElement).value)}
              placeholder="例: 4"
              min="0"
              step="0.5"
            />
          </div>
          <div>
            <label>「将来必ず上がる」言及あり</label>
            ${this.renderTristate('hasFutureRaisePromise', 'あり', 'なし')}
          </div>
          <div>
            <label>雇用契約書に記載あり</label>
            ${this.renderTristate('futureRaisePromiseInContract', 'あり', 'なし')}
          </div>

          <hr class="section-divider" />

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
              @input=${(e: Event) =>
                this.setField('concerns', (e.target as HTMLTextAreaElement).value)}
              placeholder="自分の弱点や懸念点をメモ"
            ></textarea>
          </div>
          <div class="full">
            <label>アピールポイント</label>
            <textarea
              .value=${this.form.appealPoints}
              @input=${(e: Event) =>
                this.setField('appealPoints', (e.target as HTMLTextAreaElement).value)}
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
              ${
                target.applicationRoute
                  ? html`<span style="margin-left:0.4rem;font-size:0.75rem;color:#888;">
                      ${APPLICATION_ROUTES.find((r) => r.value === target.applicationRoute)?.label ?? target.applicationRoute}
                    </span>`
                  : ''
              }
            </div>
            <div class="target-title">${target.jobTitle}</div>
            ${
              target.jobDescription
                ? html`<div class="target-detail">${target.jobDescription}</div>`
                : ''
            }
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
            ${
              target.hasFutureRaisePromise
                ? html`<div class="warn-badge">⚠ 「将来必ず上がる」言及あり${target.futureRaisePromiseInContract === false ? '（契約書記載なし）' : ''}</div>`
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
