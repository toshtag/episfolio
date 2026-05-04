import type { JobTarget, RecruitmentBackground, ResignationPlan } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import { listJobTargets } from './ipc/job-targets.js';
import {
  createResignationPlan,
  deleteResignationPlan,
  listResignationPlansByJobTarget,
  updateResignationPlan,
} from './ipc/resignation-plans.js';

const RECRUITMENT_BACKGROUND_OPTIONS: { value: RecruitmentBackground; label: string }[] = [
  { value: 'vacancy', label: '欠員補充' },
  { value: 'expansion', label: '増員' },
  { value: 'unknown', label: '不明' },
];

const MILESTONE_FIELDS: { key: keyof FormState; label: string }[] = [
  { key: 'finalInterviewAt', label: '最終面接日' },
  { key: 'offerNotifiedAt', label: '内定通知日' },
  { key: 'offerAcceptedAt', label: '内定受諾日' },
  { key: 'resignationNotifiedAt', label: '退職意思表示日' },
  { key: 'handoverStartedAt', label: '引継ぎ開始日' },
  { key: 'lastWorkingDayAt', label: '最終出社日' },
  { key: 'paidLeaveStartAt', label: '有給消化開始日' },
  { key: 'joinedAt', label: '入社日' },
];

type FormState = {
  annualSalary: string;
  annualHolidays: string;
  dailyWorkingHours: string;
  commuteMinutes: string;
  positionNote: string;
  recruitmentBackground: RecruitmentBackground | '';
  riskMemo: string;
  finalInterviewAt: string;
  offerNotifiedAt: string;
  offerAcceptedAt: string;
  resignationNotifiedAt: string;
  handoverStartedAt: string;
  lastWorkingDayAt: string;
  paidLeaveStartAt: string;
  joinedAt: string;
  availableDateFrom: string;
  availableDateTo: string;
  negotiationNote: string;
  samuraiLossNote: string;
  samuraiGainNote: string;
  nextExitPlan: string;
};

function emptyForm(): FormState {
  return {
    annualSalary: '',
    annualHolidays: '',
    dailyWorkingHours: '',
    commuteMinutes: '',
    positionNote: '',
    recruitmentBackground: '',
    riskMemo: '',
    finalInterviewAt: '',
    offerNotifiedAt: '',
    offerAcceptedAt: '',
    resignationNotifiedAt: '',
    handoverStartedAt: '',
    lastWorkingDayAt: '',
    paidLeaveStartAt: '',
    joinedAt: '',
    availableDateFrom: '',
    availableDateTo: '',
    negotiationNote: '',
    samuraiLossNote: '',
    samuraiGainNote: '',
    nextExitPlan: '',
  };
}

function recordToForm(r: ResignationPlan): FormState {
  return {
    annualSalary: r.annualSalary != null ? String(r.annualSalary) : '',
    annualHolidays: r.annualHolidays != null ? String(r.annualHolidays) : '',
    dailyWorkingHours: r.dailyWorkingHours != null ? String(r.dailyWorkingHours) : '',
    commuteMinutes: r.commuteMinutes != null ? String(r.commuteMinutes) : '',
    positionNote: r.positionNote,
    recruitmentBackground: r.recruitmentBackground ?? '',
    riskMemo: r.riskMemo,
    finalInterviewAt: r.finalInterviewAt ?? '',
    offerNotifiedAt: r.offerNotifiedAt ?? '',
    offerAcceptedAt: r.offerAcceptedAt ?? '',
    resignationNotifiedAt: r.resignationNotifiedAt ?? '',
    handoverStartedAt: r.handoverStartedAt ?? '',
    lastWorkingDayAt: r.lastWorkingDayAt ?? '',
    paidLeaveStartAt: r.paidLeaveStartAt ?? '',
    joinedAt: r.joinedAt ?? '',
    availableDateFrom: r.availableDateFrom ?? '',
    availableDateTo: r.availableDateTo ?? '',
    negotiationNote: r.negotiationNote,
    samuraiLossNote: r.samuraiLossNote,
    samuraiGainNote: r.samuraiGainNote,
    nextExitPlan: r.nextExitPlan,
  };
}

function formToPayload(form: FormState) {
  const num = (s: string) => {
    const t = s.trim();
    return t !== '' ? Number(t) : null;
  };
  const dateOrNull = (s: string) => s.trim() || null;
  return {
    annualSalary: num(form.annualSalary),
    annualHolidays: num(form.annualHolidays),
    dailyWorkingHours: num(form.dailyWorkingHours),
    commuteMinutes: num(form.commuteMinutes),
    positionNote: form.positionNote,
    recruitmentBackground: (form.recruitmentBackground || null) as RecruitmentBackground | null,
    riskMemo: form.riskMemo,
    finalInterviewAt: dateOrNull(form.finalInterviewAt),
    offerNotifiedAt: dateOrNull(form.offerNotifiedAt),
    offerAcceptedAt: dateOrNull(form.offerAcceptedAt),
    resignationNotifiedAt: dateOrNull(form.resignationNotifiedAt),
    handoverStartedAt: dateOrNull(form.handoverStartedAt),
    lastWorkingDayAt: dateOrNull(form.lastWorkingDayAt),
    paidLeaveStartAt: dateOrNull(form.paidLeaveStartAt),
    joinedAt: dateOrNull(form.joinedAt),
    availableDateFrom: dateOrNull(form.availableDateFrom),
    availableDateTo: dateOrNull(form.availableDateTo),
    negotiationNote: form.negotiationNote,
    samuraiLossNote: form.samuraiLossNote,
    samuraiGainNote: form.samuraiGainNote,
    nextExitPlan: form.nextExitPlan,
  };
}

function bgLabel(v: RecruitmentBackground | null): string {
  return RECRUITMENT_BACKGROUND_OPTIONS.find((o) => o.value === v)?.label ?? '';
}

function dateLabel(iso: string | null): string {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

class ResignationPlanView extends LitElement {
  static override properties = {
    jobTargets: { state: true },
    selectedJobTargetId: { state: true },
    plans: { state: true },
    form: { state: true },
    editingId: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteId: { state: true },
  };

  declare jobTargets: JobTarget[];
  declare selectedJobTargetId: string;
  declare plans: ResignationPlan[];
  declare form: FormState;
  declare editingId: string;
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteId: string;

  constructor() {
    super();
    this.jobTargets = [];
    this.selectedJobTargetId = '';
    this.plans = [];
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
    .section-divider {
      grid-column: 1 / -1;
      margin: 0.5rem 0 0.25rem;
      font-size: 0.8rem;
      font-weight: bold;
      color: #777;
      border-bottom: 1px solid #e8e8e8;
      padding-bottom: 0.25rem;
    }
    .btn-row {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    button {
      padding: 0.4rem 1rem;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      cursor: pointer;
      background: #fff;
    }
    button.primary {
      background: #2563eb;
      color: #fff;
      border-color: #2563eb;
    }
    button.danger { color: #dc2626; border-color: #dc2626; }
    button:disabled { opacity: 0.5; cursor: default; }
    .error { color: #dc2626; font-size: 0.85rem; margin-top: 0.5rem; }
    .card-list { margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem; }
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
      background: #fafafa;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    .card-title { font-weight: bold; font-size: 0.95rem; }
    .card-actions { display: flex; gap: 0.5rem; }
    .meta-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem; }
    .chip {
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      border: 1px solid #d1d5db;
      background: #f3f4f6;
    }
    .chip.milestone { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
    .chip.warn { background: #fff7ed; border-color: #fed7aa; color: #c2410c; }
    .milestone-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.25rem 1rem;
      margin-top: 0.5rem;
      font-size: 0.82rem;
    }
    .milestone-row { display: flex; justify-content: space-between; }
    .milestone-row .label { color: #6b7280; }
    .confirm-msg { font-size: 0.85rem; color: #dc2626; margin-right: 0.5rem; }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.loadJobTargets();
  }

  private async loadJobTargets() {
    try {
      this.jobTargets = await listJobTargets();
    } catch (e) {
      this.error = String(e);
    }
  }

  private async loadPlans() {
    if (!this.selectedJobTargetId) {
      this.plans = [];
      return;
    }
    try {
      this.plans = await listResignationPlansByJobTarget(this.selectedJobTargetId);
    } catch (e) {
      this.error = String(e);
    }
  }

  private onJobTargetChange(e: Event) {
    this.selectedJobTargetId = (e.target as HTMLSelectElement).value;
    this.editingId = '';
    this.form = emptyForm();
    this.error = '';
    this.loadPlans();
  }

  private setField(key: keyof FormState, value: string) {
    this.form = { ...this.form, [key]: value };
  }

  private startEdit(plan: ResignationPlan) {
    this.editingId = plan.id;
    this.form = recordToForm(plan);
    this.error = '';
    this.confirmDeleteId = '';
  }

  private cancelEdit() {
    this.editingId = '';
    this.form = emptyForm();
    this.error = '';
  }

  private async save() {
    if (!this.selectedJobTargetId) return;
    this.saving = true;
    this.error = '';
    try {
      const payload = formToPayload(this.form);
      if (this.editingId) {
        await updateResignationPlan(this.editingId, payload);
      } else {
        await createResignationPlan({ jobTargetId: this.selectedJobTargetId, ...payload });
      }
      this.editingId = '';
      this.form = emptyForm();
      await this.loadPlans();
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private requestDelete(id: string) {
    this.confirmDeleteId = id;
  }

  private cancelDelete() {
    this.confirmDeleteId = '';
  }

  private async confirmDelete(id: string) {
    this.saving = true;
    this.error = '';
    try {
      await deleteResignationPlan(id);
      if (this.editingId === id) {
        this.editingId = '';
        this.form = emptyForm();
      }
      this.confirmDeleteId = '';
      await this.loadPlans();
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private renderForm() {
    const f = this.form;
    return html`
      <div class="form-grid">
        <!-- 内定比較表 -->
        <div class="section-divider">内定比較表</div>
        <div>
          <label>年収（万円）</label>
          <input type="number" min="0" .value=${f.annualSalary}
            @input=${(e: InputEvent) => this.setField('annualSalary', (e.target as HTMLInputElement).value)} />
        </div>
        <div>
          <label>年間休日（日）</label>
          <input type="number" min="0" max="366" .value=${f.annualHolidays}
            @input=${(e: InputEvent) => this.setField('annualHolidays', (e.target as HTMLInputElement).value)} />
        </div>
        <div>
          <label>所定就業時間（時間）</label>
          <input type="number" min="0" max="24" step="0.5" .value=${f.dailyWorkingHours}
            @input=${(e: InputEvent) => this.setField('dailyWorkingHours', (e.target as HTMLInputElement).value)} />
        </div>
        <div>
          <label>通勤時間（分）</label>
          <input type="number" min="0" .value=${f.commuteMinutes}
            @input=${(e: InputEvent) => this.setField('commuteMinutes', (e.target as HTMLInputElement).value)} />
        </div>
        <div class="full">
          <label>ポジション・職位見通し</label>
          <input type="text" .value=${f.positionNote}
            @input=${(e: InputEvent) => this.setField('positionNote', (e.target as HTMLInputElement).value)} />
        </div>
        <div>
          <label>募集背景</label>
          <select .value=${f.recruitmentBackground}
            @change=${(e: Event) => this.setField('recruitmentBackground', (e.target as HTMLSelectElement).value)}>
            <option value="">— 未設定 —</option>
            ${RECRUITMENT_BACKGROUND_OPTIONS.map(
              (o) =>
                html`<option value=${o.value} ?selected=${f.recruitmentBackground === o.value}>${o.label}</option>`,
            )}
          </select>
        </div>
        <div class="full">
          <label>リスクメモ（★〜★★★など）</label>
          <textarea .value=${f.riskMemo}
            @input=${(e: InputEvent) => this.setField('riskMemo', (e.target as HTMLTextAreaElement).value)}></textarea>
        </div>

        <!-- 退職シーケンス -->
        <div class="section-divider">退職シーケンス 9 マイルストーン</div>
        ${MILESTONE_FIELDS.map(
          ({ key, label }) => html`
            <div>
              <label>${label}</label>
              <input type="date" .value=${(f[key] as string).slice(0, 10)}
                @input=${(e: InputEvent) => {
                  const v = (e.target as HTMLInputElement).value;
                  this.setField(key, v ? `${v}T00:00:00Z` : '');
                }} />
            </div>
          `,
        )}

        <!-- 退職交渉 -->
        <div class="section-divider">退職交渉</div>
        <div>
          <label>入社可能日（最速）</label>
          <input type="date" .value=${f.availableDateFrom.slice(0, 10)}
            @input=${(e: InputEvent) => {
              const v = (e.target as HTMLInputElement).value;
              this.setField('availableDateFrom', v ? `${v}T00:00:00Z` : '');
            }} />
        </div>
        <div>
          <label>入社可能日（最遅）</label>
          <input type="date" .value=${f.availableDateTo.slice(0, 10)}
            @input=${(e: InputEvent) => {
              const v = (e.target as HTMLInputElement).value;
              this.setField('availableDateTo', v ? `${v}T00:00:00Z` : '');
            }} />
        </div>
        <div class="full">
          <label>交渉メモ（提示文・注意点など）</label>
          <textarea .value=${f.negotiationNote}
            @input=${(e: InputEvent) => this.setField('negotiationNote', (e.target as HTMLTextAreaElement).value)}></textarea>
        </div>

        <!-- 藩士意識 -->
        <div class="section-divider">藩士意識（失うもの・得るもの・次の出口）</div>
        <div class="full">
          <label>転職で失うもの（無条件の人脈・信頼残高など）</label>
          <textarea .value=${f.samuraiLossNote}
            @input=${(e: InputEvent) => this.setField('samuraiLossNote', (e.target as HTMLTextAreaElement).value)}></textarea>
        </div>
        <div class="full">
          <label>転職で得るもの（担当領域・報酬・新技術など）</label>
          <textarea .value=${f.samuraiGainNote}
            @input=${(e: InputEvent) => this.setField('samuraiGainNote', (e.target as HTMLTextAreaElement).value)}></textarea>
        </div>
        <div class="full">
          <label>次の出口戦略（X 年後の想定・有事の撤退基準）</label>
          <textarea .value=${f.nextExitPlan}
            @input=${(e: InputEvent) => this.setField('nextExitPlan', (e.target as HTMLTextAreaElement).value)}></textarea>
        </div>
      </div>

      <div class="btn-row">
        <button class="primary" ?disabled=${this.saving} @click=${this.save}>
          ${this.saving ? '保存中…' : this.editingId ? '更新' : '追加'}
        </button>
        ${this.editingId ? html`<button @click=${this.cancelEdit}>キャンセル</button>` : ''}
      </div>
      ${this.error ? html`<div class="error">${this.error}</div>` : ''}
    `;
  }

  private renderCard(plan: ResignationPlan) {
    const isConfirm = this.confirmDeleteId === plan.id;
    const salary =
      plan.annualSalary != null ? `年収 ${plan.annualSalary.toLocaleString()} 万円` : null;
    const holidays = plan.annualHolidays != null ? `年間休日 ${plan.annualHolidays} 日` : null;
    const bg = plan.recruitmentBackground ? bgLabel(plan.recruitmentBackground) : null;
    const joined = plan.joinedAt ? `入社 ${dateLabel(plan.joinedAt)}` : null;
    const offer = plan.offerNotifiedAt ? `内定 ${dateLabel(plan.offerNotifiedAt)}` : null;

    return html`
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${plan.positionNote || '（ポジション未記入）'}</div>
            <div class="meta-chips">
              ${salary ? html`<span class="chip">${salary}</span>` : ''}
              ${holidays ? html`<span class="chip">${holidays}</span>` : ''}
              ${bg ? html`<span class="chip warn">${bg}</span>` : ''}
              ${offer ? html`<span class="chip milestone">${offer}</span>` : ''}
              ${joined ? html`<span class="chip milestone">${joined}</span>` : ''}
            </div>
          </div>
          <div class="card-actions">
            <button @click=${() => this.startEdit(plan)}>編集</button>
            ${
              isConfirm
                ? html`
                  <span class="confirm-msg">本当に削除しますか？</span>
                  <button class="danger" ?disabled=${this.saving} @click=${() => this.confirmDelete(plan.id)}>削除確定</button>
                  <button @click=${this.cancelDelete}>キャンセル</button>
                `
                : html`<button class="danger" @click=${() => this.requestDelete(plan.id)}>削除</button>`
            }
          </div>
        </div>
        ${
          plan.offerNotifiedAt || plan.joinedAt
            ? html`
              <div class="milestone-grid">
                ${MILESTONE_FIELDS.filter(({ key }) => {
                  const v = plan[key as keyof ResignationPlan] as string | null;
                  return !!v;
                }).map(
                  ({ key, label }) => html`
                    <div class="milestone-row">
                      <span class="label">${label}</span>
                      <span>${dateLabel(plan[key as keyof ResignationPlan] as string | null)}</span>
                    </div>
                  `,
                )}
              </div>
            `
            : ''
        }
        ${
          plan.riskMemo
            ? html`<div style="margin-top:0.5rem;font-size:0.82rem;color:#92400e;">${plan.riskMemo}</div>`
            : ''
        }
      </div>
    `;
  }

  override render() {
    return html`
      <div class="panel">
        <h1>退職交渉</h1>
        <div class="target-select">
          <label>内定先求人</label>
          <select @change=${this.onJobTargetChange}>
            <option value="">— 求人を選択 —</option>
            ${this.jobTargets.map(
              (jt) =>
                html`<option value=${jt.id} ?selected=${this.selectedJobTargetId === jt.id}>${jt.companyName} — ${jt.jobTitle}</option>`,
            )}
          </select>
        </div>

        ${this.selectedJobTargetId ? this.renderForm() : ''}

        ${
          this.plans.length > 0
            ? html`<div class="card-list">${this.plans.map((p) => this.renderCard(p))}</div>`
            : this.selectedJobTargetId
              ? html`<p style="color:#888;font-size:0.9rem;">まだ退職交渉プランがありません。上のフォームから追加してください。</p>`
              : ''
        }
      </div>
    `;
  }
}

customElements.define('resignation-plan-view', ResignationPlanView);

declare global {
  interface HTMLElementTagNameMap {
    'resignation-plan-view': ResignationPlanView;
  }
}
