import type { InterviewQA, JobTarget } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createInterviewQA,
  deleteInterviewQA,
  listInterviewQAsByJobTarget,
  reorderInterviewQAs,
  updateInterviewQA,
} from './ipc/interview-qas.js';
import { listJobTargets } from './ipc/job-targets.js';
import { waitForTauri } from './ipc/tauri-ready.js';

const CATEGORIES: { value: InterviewQA['category']; label: string }[] = [
  { value: 'self-introduction', label: '自己紹介' },
  { value: 'motivation', label: '志望動機' },
  { value: 'post-hire', label: '入社後' },
  { value: 'other', label: 'その他' },
];

type FormState = {
  category: InterviewQA['category'];
  questionAsked: string;
  recommendedAnswer: string;
  answerToAvoid: string;
  questionIntent: string;
};

function emptyForm(): FormState {
  return {
    category: 'other',
    questionAsked: '',
    recommendedAnswer: '',
    answerToAvoid: '',
    questionIntent: '',
  };
}

function toMarkdown(qas: InterviewQA[], target: JobTarget | undefined): string {
  const header = target ? `# ${target.companyName} — ${target.jobTitle} 面接の赤本\n\n` : '';
  if (qas.length === 0) return `${header}Q&A はまだありません。\n`;

  const grouped = CATEGORIES.reduce<Record<string, InterviewQA[]>>(
    (acc, c) => {
      acc[c.value] = qas.filter((q) => q.category === c.value);
      return acc;
    },
    {} as Record<string, InterviewQA[]>,
  );

  const sections = CATEGORIES.filter((c) => (grouped[c.value]?.length ?? 0) > 0)
    .map((c) => {
      const items = (grouped[c.value] ?? [])
        .map((q, i) => {
          const lines = [`## Q${i + 1}. ${q.questionAsked}`];
          if (q.questionIntent) lines.push(`\n> **意図**: ${q.questionIntent}`);
          if (q.recommendedAnswer) lines.push(`\n**推奨回答**\n\n${q.recommendedAnswer}`);
          if (q.answerToAvoid) lines.push(`\n**避けるべき回答**\n\n${q.answerToAvoid}`);
          return lines.join('\n');
        })
        .join('\n\n---\n\n');
      return `# ${c.label}\n\n${items}`;
    })
    .join('\n\n');

  return `${header}${sections}\n`;
}

class InterviewQAView extends LitElement {
  static override properties = {
    jobTargets: { state: true },
    selectedJobTargetId: { state: true },
    qas: { state: true },
    form: { state: true },
    editingId: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteId: { state: true },
    copyState: { state: true },
  };

  declare jobTargets: JobTarget[];
  declare selectedJobTargetId: string;
  declare qas: InterviewQA[];
  declare form: FormState;
  declare editingId: string;
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteId: string;
  declare copyState: 'idle' | 'copied' | 'failed';

  constructor() {
    super();
    this.jobTargets = [];
    this.selectedJobTargetId = '';
    this.qas = [];
    this.form = emptyForm();
    this.editingId = '';
    this.saving = false;
    this.error = '';
    this.confirmDeleteId = '';
    this.copyState = 'idle';
  }

  static override styles = css`
    :host { display: block; }
    .panel { padding: 2rem; }
    h1 { margin: 0 0 1.5rem; font-size: 1.4rem; }
    h2 { margin: 0 0 0.5rem; font-size: 1rem; color: #555; }
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
      color: #333;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.copy-btn {
      padding: 0.4rem 0.9rem;
      font-size: 0.85rem;
      background: #f5f5f5;
      color: #333;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      cursor: pointer;
      margin-left: auto;
    }
    .copy-state { font-size: 0.8rem; color: #555; }
    .copy-state.copied { color: #2a7d2a; }
    .copy-state.failed { color: #c00; }
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 1.5rem 0 0.75rem;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.4rem;
    }
    .section-title { font-size: 1rem; font-weight: 600; margin: 0; }
    .section-count {
      font-size: 0.75rem;
      color: #888;
      background: #f0f0f0;
      border-radius: 999px;
      padding: 0.1rem 0.5rem;
    }
    .qa-list { display: flex; flex-direction: column; gap: 0.6rem; }
    .qa-card {
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 0.75rem 1rem;
    }
    .qa-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
    .qa-question { font-size: 0.95rem; font-weight: 600; flex: 1; }
    .qa-intent { font-size: 0.8rem; color: #888; margin-top: 0.2rem; }
    .qa-field { margin-top: 0.5rem; }
    .qa-field-label { font-size: 0.75rem; color: #555; font-weight: 600; margin-bottom: 0.15rem; }
    .qa-field-value { font-size: 0.85rem; color: #333; white-space: pre-wrap; }
    .qa-field-value.avoid { color: #c44; }
    .qa-btns { display: flex; gap: 0.4rem; flex-shrink: 0; }
    .order-btns { display: flex; flex-direction: column; gap: 0.2rem; }
    button.order-btn {
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      border: 1px solid #ddd;
      border-radius: 0.2rem;
      cursor: pointer;
      background: #fafafa;
      color: #555;
    }
    button.order-btn:disabled { opacity: 0.3; cursor: default; }
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
    .source-badge {
      display: inline-block;
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      border-radius: 0.2rem;
      background: #f0f0f0;
      color: #666;
      margin-left: 0.4rem;
    }
    .empty { color: #888; font-size: 0.9rem; }
    .no-target { color: #888; font-size: 0.9rem; text-align: center; padding: 2rem 0; }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    if (!(await waitForTauri())) return;
    await this.loadTargets();
  }

  private async loadTargets() {
    try {
      this.jobTargets = await listJobTargets();
      if (this.jobTargets.length > 0 && !this.selectedJobTargetId) {
        this.selectedJobTargetId = this.jobTargets[0]?.id ?? '';
        await this.loadQAs();
      }
    } catch (e) {
      this.error = String(e);
    }
  }

  private async loadQAs() {
    if (!this.selectedJobTargetId) {
      this.qas = [];
      return;
    }
    try {
      this.qas = await listInterviewQAsByJobTarget(this.selectedJobTargetId, 'order');
    } catch (e) {
      this.error = String(e);
    }
  }

  private get selectedTarget(): JobTarget | undefined {
    return this.jobTargets.find((t) => t.id === this.selectedJobTargetId);
  }

  private get formValid(): boolean {
    return this.form.questionAsked.trim().length > 0 && this.selectedJobTargetId.length > 0;
  }

  private setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    this.form = { ...this.form, [field]: value };
  }

  private async handleTargetChange(e: Event) {
    this.selectedJobTargetId = (e.target as HTMLSelectElement).value;
    this.form = emptyForm();
    this.editingId = '';
    this.error = '';
    await this.loadQAs();
  }

  private async handleSave() {
    if (!this.formValid) return;
    this.saving = true;
    this.error = '';
    try {
      const patch = {
        category: this.form.category,
        questionAsked: this.form.questionAsked.trim(),
        recommendedAnswer: this.form.recommendedAnswer.trim() || null,
        answerToAvoid: this.form.answerToAvoid.trim() || null,
        questionIntent: this.form.questionIntent.trim() || null,
      };

      if (this.editingId) {
        await updateInterviewQA(this.editingId, patch);
      } else {
        await createInterviewQA({
          ...patch,
          jobTargetId: this.selectedJobTargetId,
          orderIndex: this.qas.length,
          source: 'manual',
        });
      }

      this.form = emptyForm();
      this.editingId = '';
      await this.loadQAs();
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private handleEdit(qa: InterviewQA) {
    this.editingId = qa.id;
    this.form = {
      category: qa.category,
      questionAsked: qa.questionAsked,
      recommendedAnswer: qa.recommendedAnswer ?? '',
      answerToAvoid: qa.answerToAvoid ?? '',
      questionIntent: qa.questionIntent ?? '',
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
      await deleteInterviewQA(id);
      this.confirmDeleteId = '';
      if (this.editingId === id) {
        this.form = emptyForm();
        this.editingId = '';
      }
      await this.loadQAs();
    } catch (e) {
      this.error = String(e);
    }
  }

  private async handleMoveUp(qa: InterviewQA) {
    const idx = this.qas.findIndex((q) => q.id === qa.id);
    if (idx <= 0) return;
    const newOrder = this.qas.map((q) => q.id);
    const tmp = newOrder[idx - 1] as string;
    newOrder[idx - 1] = newOrder[idx] as string;
    newOrder[idx] = tmp;
    await this.applyReorder(newOrder);
  }

  private async handleMoveDown(qa: InterviewQA) {
    const idx = this.qas.findIndex((q) => q.id === qa.id);
    if (idx < 0 || idx >= this.qas.length - 1) return;
    const newOrder = this.qas.map((q) => q.id);
    const tmp = newOrder[idx] as string;
    newOrder[idx] = newOrder[idx + 1] as string;
    newOrder[idx + 1] = tmp;
    await this.applyReorder(newOrder);
  }

  private async applyReorder(idsInOrder: string[]) {
    try {
      await reorderInterviewQAs(this.selectedJobTargetId, idsInOrder);
      await this.loadQAs();
    } catch (e) {
      this.error = String(e);
    }
  }

  private async handleCopy() {
    const text = toMarkdown(this.qas, this.selectedTarget);
    try {
      await navigator.clipboard.writeText(text);
      this.copyState = 'copied';
      setTimeout(() => {
        if (this.copyState === 'copied') this.copyState = 'idle';
      }, 2000);
    } catch {
      this.copyState = 'failed';
    }
  }

  override render() {
    return html`
      <div class="panel">
        <h1>面接の赤本</h1>

        <div class="target-select">
          <label>求人</label>
          <select @change=${this.handleTargetChange}>
            ${
              this.jobTargets.length === 0
                ? html`<option value="">求人が登録されていません</option>`
                : this.jobTargets.map(
                    (t) =>
                      html`<option
                      value=${t.id}
                      ?selected=${this.selectedJobTargetId === t.id}
                    >${t.companyName} — ${t.jobTitle}</option>`,
                  )
            }
          </select>
        </div>

        ${
          !this.selectedJobTargetId
            ? html`<p class="no-target">求人タブで求人を登録してください</p>`
            : html`
          <div class="form-grid">
            <div>
              <label>カテゴリー</label>
              <select
                .value=${this.form.category}
                @change=${(e: Event) =>
                  this.setField(
                    'category',
                    (e.target as HTMLSelectElement).value as InterviewQA['category'],
                  )}
              >
                ${CATEGORIES.map(
                  (c) =>
                    html`<option value=${c.value} ?selected=${this.form.category === c.value}>${c.label}</option>`,
                )}
              </select>
            </div>
            <div></div>
            <div class="full">
              <label>質問 *</label>
              <input
                type="text"
                .value=${this.form.questionAsked}
                @input=${(e: Event) =>
                  this.setField('questionAsked', (e.target as HTMLInputElement).value)}
                placeholder="例: 志望動機を教えてください"
              />
            </div>
            <div class="full">
              <label>推奨回答</label>
              <textarea
                .value=${this.form.recommendedAnswer}
                @input=${(e: Event) =>
                  this.setField('recommendedAnswer', (e.target as HTMLTextAreaElement).value)}
                placeholder="面接で答えるべき内容"
              ></textarea>
            </div>
            <div class="full">
              <label>避けるべき回答</label>
              <textarea
                .value=${this.form.answerToAvoid}
                @input=${(e: Event) =>
                  this.setField('answerToAvoid', (e.target as HTMLTextAreaElement).value)}
                placeholder="言ってはいけない内容"
              ></textarea>
            </div>
            <div class="full">
              <label>質問の意図</label>
              <input
                type="text"
                .value=${this.form.questionIntent}
                @input=${(e: Event) =>
                  this.setField('questionIntent', (e.target as HTMLInputElement).value)}
                placeholder="面接官が何を確認したいか"
              />
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
            ${
              this.qas.length > 0
                ? html`
              <button class="copy-btn" @click=${this.handleCopy}>Markdown コピー</button>
              ${
                this.copyState === 'copied'
                  ? html`<span class="copy-state copied">コピーしました</span>`
                  : this.copyState === 'failed'
                    ? html`<span class="copy-state failed">コピーに失敗しました</span>`
                    : ''
              }
            `
                : ''
            }
          </div>

          ${this.renderQAList()}
        `
        }
      </div>
    `;
  }

  private renderQAList() {
    if (this.qas.length === 0) {
      return html`<p class="empty">Q&A はまだ登録されていません</p>`;
    }

    return CATEGORIES.filter((c) => this.qas.some((q) => q.category === c.value)).map((c) => {
      const items = this.qas.filter((q) => q.category === c.value);
      return html`
        <div class="section-header">
          <span class="section-title">${c.label}</span>
          <span class="section-count">${items.length}</span>
        </div>
        <div class="qa-list">
          ${items.map((qa) => this.renderQACard(qa))}
        </div>
      `;
    });
  }

  private renderQACard(qa: InterviewQA) {
    const idx = this.qas.findIndex((q) => q.id === qa.id);
    const isFirst = idx === 0;
    const isLast = idx === this.qas.length - 1;
    const isDeleting = this.confirmDeleteId === qa.id;

    return html`
      <div class="qa-card">
        <div class="qa-header">
          <div style="flex:1">
            <div class="qa-question">
              ${qa.questionAsked}
              ${qa.source === 'agent-provided' ? html`<span class="source-badge">エージェント提供</span>` : ''}
            </div>
            ${qa.questionIntent ? html`<div class="qa-intent">意図: ${qa.questionIntent}</div>` : ''}
            ${
              qa.recommendedAnswer
                ? html`
              <div class="qa-field">
                <div class="qa-field-label">推奨回答</div>
                <div class="qa-field-value">${qa.recommendedAnswer}</div>
              </div>
            `
                : ''
            }
            ${
              qa.answerToAvoid
                ? html`
              <div class="qa-field">
                <div class="qa-field-label">避けるべき回答</div>
                <div class="qa-field-value avoid">${qa.answerToAvoid}</div>
              </div>
            `
                : ''
            }
          </div>
          <div class="qa-btns">
            <div class="order-btns">
              <button
                class="order-btn"
                ?disabled=${isFirst}
                @click=${() => this.handleMoveUp(qa)}
              >▲</button>
              <button
                class="order-btn"
                ?disabled=${isLast}
                @click=${() => this.handleMoveDown(qa)}
              >▼</button>
            </div>
            <button class="edit-btn" @click=${() => this.handleEdit(qa)}>編集</button>
            <button
              class=${`del-btn${isDeleting ? ' confirm' : ''}`}
              @click=${() =>
                isDeleting ? this.handleDeleteConfirm(qa.id) : this.handleDeleteClick(qa.id)}
            >${isDeleting ? '本当に削除' : '削除'}</button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('interview-qa-view', InterviewQAView);
