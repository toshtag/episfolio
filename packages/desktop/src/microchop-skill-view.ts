import type { MicrochopSkill, MicrochopSkillUpdate, MicrochopTask } from '@episfolio/kernel';
import { toMicrochopSkillMarkdown } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createMicrochopSkill,
  deleteMicrochopSkill,
  listMicrochopSkill,
  updateMicrochopSkill,
} from './ipc/microchop-skill.js';
import { waitForTauri } from './ipc/tauri-ready.js';

type FormState = {
  jobTitle: string;
  industry: string;
  tasks: MicrochopTask[];
  transferableSkills: string;
  note: string;
};

function newTaskId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function recordToForm(r: MicrochopSkill): FormState {
  return {
    jobTitle: r.jobTitle,
    industry: r.industry,
    tasks: r.tasks.map((t) => ({ ...t })),
    transferableSkills: r.transferableSkills,
    note: r.note ?? '',
  };
}

class MicrochopSkillView extends LitElement {
  static override properties = {
    records: { state: true },
    selectedId: { state: true },
    editMode: { state: true },
    form: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteId: { state: true },
    showPreview: { state: true },
  };

  declare records: MicrochopSkill[];
  declare selectedId: string;
  declare editMode: boolean;
  declare form: FormState;
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteId: string;
  declare showPreview: boolean;

  constructor() {
    super();
    this.records = [];
    this.selectedId = '';
    this.editMode = false;
    this.form = this._emptyForm();
    this.saving = false;
    this.error = '';
    this.confirmDeleteId = '';
    this.showPreview = false;
  }

  private _emptyForm(): FormState {
    return { jobTitle: '', industry: '', tasks: [], transferableSkills: '', note: '' };
  }

  static override styles = css`
    :host { display: block; font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; }
    .panel { padding: 2rem; max-width: 720px; }
    h1 { margin: 0 0 1.5rem; font-size: 1.4rem; }
    h2 { margin: 0 0 1rem; font-size: 1.1rem; }
    h3 { margin: 1rem 0 0.5rem; font-size: 0.95rem; color: #555; }
    .form-row { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.8rem; }
    label { font-size: 0.85rem; font-weight: 600; color: #555; }
    input, textarea {
      padding: 0.4rem 0.7rem;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      font-family: inherit;
    }
    textarea { resize: vertical; min-height: 4rem; }
    .btn {
      padding: 0.4rem 0.9rem;
      font-size: 0.9rem;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    .btn-primary { background: #1a1a1a; color: #fff; }
    .btn-primary:disabled { opacity: 0.5; cursor: default; }
    .btn-secondary { background: #eee; color: #333; }
    .btn-danger { background: #c00; color: #fff; }
    .btn-small { padding: 0.25rem 0.6rem; font-size: 0.8rem; }
    .actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 2px solid #ddd; }
    td { padding: 0.4rem 0.5rem; border-bottom: 1px solid #eee; }
    tbody tr { cursor: pointer; }
    tbody tr:hover td { background: #f6f6f6; }
    .empty { color: #888; font-size: 0.9rem; }
    .task-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.6rem;
      border: 1px solid #ddd;
      border-radius: 0.3rem;
      margin-bottom: 0.4rem;
      background: #fafafa;
    }
    .task-row input[type="text"] { flex: 1; }
    .task-row label { font-size: 0.8rem; display: flex; align-items: center; gap: 0.3rem; white-space: nowrap; margin: 0; }
    .badge-transferable { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; background: #e8f4fd; color: #1a6dad; }
    .badge-fixed { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; background: #f6f6f6; color: #888; }
    .preview-box {
      background: #f6f6f6;
      border: 1px solid #ddd;
      border-radius: 0.3rem;
      padding: 1rem;
      font-size: 0.85rem;
      white-space: pre-wrap;
      font-family: monospace;
      max-height: 400px;
      overflow-y: auto;
    }
    .detail-field { margin-bottom: 0.6rem; font-size: 0.9rem; }
    .detail-label { font-weight: 600; color: #555; font-size: 0.8rem; }
    .detail-task-list { list-style: none; padding: 0; margin: 0.3rem 0 0; }
    .detail-task-list li { display: flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0; }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    if (!(await waitForTauri())) return;
    await this._load();
  }

  private async _load() {
    try {
      this.records = await listMicrochopSkill();
    } catch (e) {
      this.error = String(e);
    }
  }

  private _startCreate() {
    this.form = this._emptyForm();
    this.editMode = true;
    this.selectedId = '';
    this.error = '';
  }

  private _startEdit(r: MicrochopSkill) {
    this.form = recordToForm(r);
    this.editMode = true;
    this.selectedId = r.id;
    this.error = '';
  }

  private _cancelEdit() {
    this.editMode = false;
    this.error = '';
  }

  private _updateForm(key: keyof FormState, value: string) {
    this.form = { ...this.form, [key]: value };
  }

  private _addTask() {
    const task: MicrochopTask = { id: newTaskId(), label: '', transferable: false };
    this.form = { ...this.form, tasks: [...this.form.tasks, task] };
  }

  private _updateTaskLabel(idx: number, label: string) {
    const tasks = this.form.tasks.map((t, i) => (i === idx ? { ...t, label } : t));
    this.form = { ...this.form, tasks };
  }

  private _toggleTaskTransferable(idx: number) {
    const tasks = this.form.tasks.map((t, i) =>
      i === idx ? { ...t, transferable: !t.transferable } : t,
    );
    this.form = { ...this.form, tasks };
  }

  private _removeTask(idx: number) {
    const tasks = this.form.tasks.filter((_, i) => i !== idx);
    this.form = { ...this.form, tasks };
  }

  private async _handleSave() {
    this.saving = true;
    this.error = '';
    try {
      const noteVal = this.form.note.trim() !== '' ? this.form.note.trim() : null;
      if (this.selectedId) {
        const patch: MicrochopSkillUpdate = {
          jobTitle: this.form.jobTitle,
          industry: this.form.industry,
          tasks: this.form.tasks,
          transferableSkills: this.form.transferableSkills,
          note: noteVal,
        };
        await updateMicrochopSkill(this.selectedId, patch);
      } else {
        await createMicrochopSkill({
          jobTitle: this.form.jobTitle,
          industry: this.form.industry,
          tasks: this.form.tasks,
          transferableSkills: this.form.transferableSkills,
          note: noteVal,
        });
      }
      this.editMode = false;
      await this._load();
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private _requestDelete(id: string) {
    this.confirmDeleteId = id;
  }

  private async _confirmDelete(id: string) {
    try {
      await deleteMicrochopSkill(id);
      this.confirmDeleteId = '';
      this.selectedId = '';
      this.editMode = false;
      await this._load();
    } catch (e) {
      this.error = String(e);
    }
  }

  private _cancelDelete() {
    this.confirmDeleteId = '';
  }

  override render() {
    if (this.editMode) return this._renderForm();
    if (this.selectedId) return this._renderDetail();
    return this._renderList();
  }

  private _renderList() {
    return html`
      <div class="panel">
        <h1>仕事のみじん切り</h1>
        ${this.error ? html`<p class="error">${this.error}</p>` : ''}
        <div class="actions" style="margin-top:0;margin-bottom:1rem;">
          <button class="btn btn-primary" @click=${this._startCreate}>+ 新規作成</button>
        </div>
        ${
          this.records.length === 0
            ? html`<p class="empty">まだ記録がありません</p>`
            : html`
              <table>
                <thead><tr><th>職種名</th><th>業界</th><th>タスク数</th><th>作成日時</th></tr></thead>
                <tbody>
                  ${this.records.map(
                    (r) => html`
                    <tr @click=${() => {
                      this.selectedId = r.id;
                      this.showPreview = false;
                    }}>
                      <td>${r.jobTitle || '（未入力）'}</td>
                      <td>${r.industry || '—'}</td>
                      <td>${r.tasks.length}</td>
                      <td>${r.createdAt.replace('T', ' ').replace('Z', '')}</td>
                    </tr>
                  `,
                  )}
                </tbody>
              </table>
            `
        }
      </div>
    `;
  }

  private _renderDetail() {
    const r = this.records.find((x) => x.id === this.selectedId);
    if (!r) return html`<div class="panel"><p class="error">レコードが見つかりません</p></div>`;

    const transferable = r.tasks.filter((t) => t.transferable);
    const fixed = r.tasks.filter((t) => !t.transferable);
    const mdText = toMicrochopSkillMarkdown([r]);

    return html`
      <div class="panel">
        <div class="actions" style="margin-top:0;margin-bottom:1rem;">
          <button class="btn btn-secondary" @click=${() => {
            this.selectedId = '';
            this.showPreview = false;
          }}>← 一覧へ</button>
          <button class="btn btn-secondary" @click=${() => this._startEdit(r)}>編集</button>
          ${
            this.confirmDeleteId === r.id
              ? html`
              <button class="btn btn-danger btn-small" @click=${() => this._confirmDelete(r.id)}>本当に削除</button>
              <button class="btn btn-secondary btn-small" @click=${this._cancelDelete}>キャンセル</button>
            `
              : html`<button class="btn btn-danger btn-small" @click=${() => this._requestDelete(r.id)}>削除</button>`
          }
        </div>
        ${this.error ? html`<p class="error">${this.error}</p>` : ''}

        <h2>${r.jobTitle || '（未入力）'}（${r.industry || '—'}）</h2>

        ${
          r.tasks.length > 0
            ? html`
            <div class="detail-field">
              <div class="detail-label">みじん切りタスク（${r.tasks.length} 件）</div>
              ${
                transferable.length > 0
                  ? html`
                <div style="margin-top:0.4rem;">
                  <span class="badge-transferable">他業界でも通用</span>
                  <ul class="detail-task-list">
                    ${transferable.map((t) => html`<li>・${t.label}</li>`)}
                  </ul>
                </div>
              `
                  : ''
              }
              ${
                fixed.length > 0
                  ? html`
                <div style="margin-top:0.4rem;">
                  <span class="badge-fixed">職種・業界固有</span>
                  <ul class="detail-task-list">
                    ${fixed.map((t) => html`<li>・${t.label}</li>`)}
                  </ul>
                </div>
              `
                  : ''
              }
            </div>
          `
            : html`<div class="detail-field"><div class="detail-label">タスク</div><p class="empty">未登録</p></div>`
        }

        <div class="detail-field">
          <div class="detail-label">汎用スキルまとめ</div>
          <div style="white-space:pre-wrap;margin-top:0.3rem;">${r.transferableSkills || '（未入力）'}</div>
        </div>

        ${r.note ? html`<div class="detail-field"><div class="detail-label">メモ</div><div style="white-space:pre-wrap;margin-top:0.3rem;">${r.note}</div></div>` : ''}

        <div class="actions">
          <button class="btn btn-secondary btn-small" @click=${() => {
            this.showPreview = !this.showPreview;
          }}>
            ${this.showPreview ? 'プレビュー非表示' : 'Markdown プレビュー'}
          </button>
        </div>
        ${this.showPreview ? html`<div class="preview-box">${mdText}</div>` : ''}
      </div>
    `;
  }

  private _renderForm() {
    const isNew = !this.selectedId;
    return html`
      <div class="panel">
        <h2>${isNew ? '新規作成' : '編集'}</h2>
        ${this.error ? html`<p class="error">${this.error}</p>` : ''}

        <div class="form-row">
          <label>職種名</label>
          <input
            .value=${this.form.jobTitle}
            @input=${(e: Event) => this._updateForm('jobTitle', (e.target as HTMLInputElement).value)}
            placeholder="例：営業担当"
          />
        </div>

        <div class="form-row">
          <label>業界</label>
          <input
            .value=${this.form.industry}
            @input=${(e: Event) => this._updateForm('industry', (e.target as HTMLInputElement).value)}
            placeholder="例：製造業"
          />
        </div>

        <h3>みじん切りタスク</h3>
        <p style="font-size:0.8rem;color:#888;margin:0 0 0.5rem;">業務を細かく分解してください。「他業界でも通用」にチェックを入れると汎用スキルとして分類されます。</p>
        ${this.form.tasks.map(
          (task, idx) => html`
          <div class="task-row">
            <input
              type="text"
              .value=${task.label}
              @input=${(e: Event) => this._updateTaskLabel(idx, (e.target as HTMLInputElement).value)}
              placeholder="例：企業の調査"
            />
            <label>
              <input
                type="checkbox"
                .checked=${task.transferable}
                @change=${() => this._toggleTaskTransferable(idx)}
              />
              他業界でも通用
            </label>
            <button class="btn btn-secondary btn-small" @click=${() => this._removeTask(idx)}>削除</button>
          </div>
        `,
        )}
        <button class="btn btn-secondary btn-small" style="margin-bottom:1rem;" @click=${this._addTask}>+ タスクを追加</button>

        <div class="form-row">
          <label>汎用スキルまとめ</label>
          <textarea
            .value=${this.form.transferableSkills}
            @input=${(e: Event) => this._updateForm('transferableSkills', (e.target as HTMLTextAreaElement).value)}
            placeholder="分解したタスクから見えてきた、他業界でも通用するスキルをまとめて記述してください"
          ></textarea>
        </div>

        <div class="form-row">
          <label>メモ（任意）</label>
          <textarea
            .value=${this.form.note}
            @input=${(e: Event) => this._updateForm('note', (e.target as HTMLTextAreaElement).value)}
            placeholder="面接での活用方法など"
          ></textarea>
        </div>

        <div class="actions">
          <button
            class="btn btn-primary"
            @click=${this._handleSave}
            ?disabled=${this.saving}
          >${this.saving ? '保存中…' : '保存'}</button>
          <button class="btn btn-secondary" @click=${this._cancelEdit}>キャンセル</button>
        </div>
      </div>
    `;
  }
}

customElements.define('microchop-skill-view', MicrochopSkillView);
