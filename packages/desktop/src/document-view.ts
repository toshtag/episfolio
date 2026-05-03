import type { JobTarget } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import type { CareerDocumentRow, DocumentRevisionRow } from './ipc/documents.js';
import {
  type CreateDocumentManualArgs,
  type CreateRevisionManualArgs,
  createDocumentManual,
  createDocumentRevisionManual,
  getDocument,
  listDocuments,
} from './ipc/documents.js';
import type { SkillEvidenceRow } from './ipc/evidence.js';
import { listSkillEvidence } from './ipc/evidence.js';
import { listJobTargets } from './ipc/job-targets.js';

type Template = 'resume' | 'skill-summary' | 'blank';
type ViewState = 'list' | 'new' | 'edit';

const TEMPLATES: { value: Template; label: string }[] = [
  { value: 'resume', label: '職務経歴書' },
  { value: 'skill-summary', label: 'スキルサマリー' },
  { value: 'blank', label: '空白' },
];

class DocumentView extends LitElement {
  static override properties = {
    documents: { state: true },
    selected: { state: true },
    revisions: { state: true },
    acceptedEvidences: { state: true },
    jobTargets: { state: true },
    viewState: { state: true },
    newTitle: { state: true },
    newTemplate: { state: true },
    newRevisionReason: { state: true },
    newTargetMemo: { state: true },
    newJobTargetId: { state: true },
    editContent: { state: true },
    editRevisionReason: { state: true },
    editTargetMemo: { state: true },
    editJobTargetId: { state: true },
    selectedEvidenceId: { state: true },
    expandedRevisionId: { state: true },
    isSaving: { state: true },
    error: { state: true },
  };

  declare documents: CareerDocumentRow[];
  declare selected: CareerDocumentRow | null;
  declare revisions: DocumentRevisionRow[];
  declare acceptedEvidences: SkillEvidenceRow[];
  declare jobTargets: JobTarget[];
  declare viewState: ViewState;
  declare newTitle: string;
  declare newTemplate: Template;
  declare newRevisionReason: string;
  declare newTargetMemo: string;
  declare newJobTargetId: string;
  declare editContent: string;
  declare editRevisionReason: string;
  declare editTargetMemo: string;
  declare editJobTargetId: string;
  declare selectedEvidenceId: string;
  declare expandedRevisionId: string;
  declare isSaving: boolean;
  declare error: string;

  constructor() {
    super();
    this.documents = [];
    this.selected = null;
    this.revisions = [];
    this.acceptedEvidences = [];
    this.jobTargets = [];
    this.viewState = 'list';
    this.newTitle = '';
    this.newTemplate = 'resume';
    this.newRevisionReason = '';
    this.newTargetMemo = '';
    this.newJobTargetId = '';
    this.editContent = '';
    this.editRevisionReason = '';
    this.editTargetMemo = '';
    this.editJobTargetId = '';
    this.selectedEvidenceId = '';
    this.expandedRevisionId = '';
    this.isSaving = false;
    this.error = '';
  }

  static override styles = css`
    :host {
      display: block;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
      color: #1a1a1a;
      max-width: 720px;
    }
    h2 { margin: 0 0 1.25rem; font-size: 1.2rem; }
    h3 { margin: 1.75rem 0 0.75rem; font-size: 1rem; color: #333; }
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.75rem; }
    .empty { color: #888; font-size: 0.9rem; }
    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
      font-size: 0.85rem;
      color: #555;
      cursor: pointer;
      text-decoration: underline;
    }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-bottom: 1rem; }
    th { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 2px solid #ddd; }
    td { padding: 0.4rem 0.5rem; border-bottom: 1px solid #eee; }
    tbody tr { cursor: pointer; }
    tbody tr:hover td { background: #f6f6f6; }
    .field { margin-bottom: 1rem; }
    label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 0.3rem; }
    .required { color: #c00; }
    input[type="text"], select, textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 0.4rem 0.7rem;
      font-size: 0.95rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      font-family: inherit;
    }
    textarea.editor { min-height: 18rem; resize: vertical; font-family: monospace; font-size: 0.9rem; }
    .ghost-target { color: #999; font-style: italic; }
    .insert-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 1rem;
    }
    .insert-row select { flex: 1; }
    .actions { display: flex; gap: 0.5rem; margin-top: 1.25rem; }
    button.primary {
      padding: 0.4rem 0.9rem;
      font-size: 0.9rem;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.secondary {
      padding: 0.4rem 0.9rem;
      font-size: 0.9rem;
      background: #e5e5e5;
      color: #1a1a1a;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button:disabled { opacity: 0.5; cursor: default; }
    .doc-meta { font-size: 0.78rem; color: #888; margin-bottom: 1.25rem; }
    .new-btn-row { margin-bottom: 1.25rem; }
    .history {
      border-top: 1px solid #e0e0e0;
      margin-top: 1.5rem;
      padding-top: 1rem;
    }
    .history-item {
      padding: 0.6rem 0.75rem;
      border: 1px solid #e0e0e0;
      border-radius: 0.3rem;
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
      background: #fafafa;
    }
    .history-item.current { border-color: #1a1a1a; background: #fff; }
    .history-reason { font-weight: 600; margin-bottom: 0.2rem; }
    .history-meta { color: #888; font-size: 0.78rem; }
    .history-actions { margin-top: 0.4rem; }
    button.history-toggle {
      padding: 0.2rem 0.6rem;
      font-size: 0.78rem;
      background: #f0f0f0;
      color: #333;
      border: 1px solid #ccc;
      border-radius: 0.25rem;
      cursor: pointer;
    }
    button.history-toggle:hover { background: #e5e5e5; }
    .revision-content {
      margin-top: 0.6rem;
      padding: 0.7rem 0.9rem;
      background: #f8f8f8;
      border: 1px solid #ddd;
      border-radius: 0.3rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.8rem;
      white-space: pre-wrap;
      max-height: 20rem;
      overflow-y: auto;
      color: #222;
    }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    await this.loadAll();
  }

  private async loadAll() {
    try {
      const [docs, evidences, targets] = await Promise.all([
        listDocuments(),
        listSkillEvidence(),
        listJobTargets(),
      ]);
      this.documents = docs;
      this.acceptedEvidences = evidences.filter((ev) => ev.status === 'accepted');
      this.jobTargets = targets;
    } catch (e) {
      this.error = String(e);
    }
  }

  private async openDocument(id: string) {
    try {
      const result = await getDocument(id);
      this.selected = result.document;
      this.revisions = result.revisions;
      const latest = result.revisions[0];
      this.editContent = latest?.content ?? '';
      this.editRevisionReason = '';
      this.editTargetMemo = latest?.targetMemo ?? '';
      this.editJobTargetId = latest?.jobTargetId ?? '';
      this.expandedRevisionId = '';
      this.viewState = 'edit';
      this.error = '';
    } catch (e) {
      this.error = String(e);
    }
  }

  private handleNewDocument() {
    this.newTitle = '';
    this.newTemplate = 'resume';
    this.newRevisionReason = '';
    this.newTargetMemo = '';
    this.newJobTargetId = '';
    this.editContent = '';
    this.error = '';
    this.viewState = 'new';
  }

  private handleBackToList() {
    this.selected = null;
    this.revisions = [];
    this.editContent = '';
    this.editRevisionReason = '';
    this.editTargetMemo = '';
    this.editJobTargetId = '';
    this.error = '';
    this.viewState = 'list';
  }

  private handleInsertEvidence() {
    const ev = this.acceptedEvidences.find((e) => e.id === this.selectedEvidenceId);
    if (!ev) return;
    const line = `- ${ev.strengthLabel}: ${ev.description}`;
    this.editContent = this.editContent ? `${this.editContent}\n${line}` : line;
    this.selectedEvidenceId = '';
  }

  private async handleCreate() {
    const title = this.newTitle.trim();
    if (!title) {
      this.error = 'タイトルは必須です';
      return;
    }
    this.isSaving = true;
    this.error = '';
    try {
      const reason = this.newRevisionReason.trim();
      const memo = this.newTargetMemo.trim();
      const jobTargetId = this.newJobTargetId.trim();
      const args: CreateDocumentManualArgs = {
        title,
        template: this.newTemplate,
        content: this.editContent,
        sourceEvidenceIds: [],
        ...(reason ? { revisionReason: reason } : {}),
        ...(memo ? { targetMemo: memo } : {}),
        ...(jobTargetId ? { jobTargetId } : {}),
      };
      const result = await createDocumentManual(args);
      await this.loadAll();
      await this.openDocument(result.document.id);
    } catch (e) {
      this.error = String(e);
    } finally {
      this.isSaving = false;
    }
  }

  private async handleSaveRevision() {
    if (!this.selected) return;
    const reason = this.editRevisionReason.trim();
    if (!reason) {
      this.error = '改訂理由は必須です';
      return;
    }
    this.isSaving = true;
    this.error = '';
    try {
      const memo = this.editTargetMemo.trim();
      const jobTargetId = this.editJobTargetId.trim();
      const args: CreateRevisionManualArgs = {
        documentId: this.selected.id,
        content: this.editContent,
        sourceEvidenceIds: [],
        revisionReason: reason,
        ...(memo ? { targetMemo: memo } : {}),
        ...(jobTargetId ? { jobTargetId } : {}),
      };
      await createDocumentRevisionManual(args);
      await this.loadAll();
      await this.openDocument(this.selected.id);
    } catch (e) {
      this.error = String(e);
    } finally {
      this.isSaving = false;
    }
  }

  private renderList() {
    return html`
      <h2>ドキュメント</h2>
      ${this.error ? html`<p class="error">${this.error}</p>` : ''}
      <div class="new-btn-row">
        <button class="primary" @click=${this.handleNewDocument}>新規作成</button>
      </div>
      ${
        this.documents.length === 0
          ? html`<p class="empty">まだドキュメントがありません。「新規作成」から作成してください。</p>`
          : html`
          <table>
            <thead><tr><th>タイトル</th><th>ステータス</th><th>更新日時</th></tr></thead>
            <tbody>
              ${this.documents.map(
                (doc) => html`
                <tr @click=${() => this.openDocument(doc.id)}>
                  <td>${doc.title}</td>
                  <td>${doc.status === 'draft' ? '下書き' : '確定'}</td>
                  <td>${doc.updatedAt.replace('T', ' ').replace('Z', '')}</td>
                </tr>
              `,
              )}
            </tbody>
          </table>
        `
      }
    `;
  }

  private renderNew() {
    return html`
      <span class="back-link" @click=${this.handleBackToList}>← ドキュメント一覧</span>
      <h2>新規ドキュメント</h2>
      ${this.error ? html`<p class="error">${this.error}</p>` : ''}
      <div class="field">
        <label>タイトル <span class="required">*</span></label>
        <input
          type="text"
          .value=${this.newTitle}
          @input=${(e: Event) => {
            this.newTitle = (e.target as HTMLInputElement).value;
          }}
          placeholder="例: バックエンドエンジニア 職務経歴書"
        />
      </div>
      <div class="field">
        <label>テンプレート</label>
        <select
          .value=${this.newTemplate}
          @change=${(e: Event) => {
            this.newTemplate = (e.target as HTMLSelectElement).value as Template;
          }}
        >
          ${TEMPLATES.map((t) => html`<option value=${t.value}>${t.label}</option>`)}
        </select>
      </div>
      <div class="field">
        <label>初版の改訂理由（任意・未入力なら「初版」）</label>
        <input
          type="text"
          .value=${this.newRevisionReason}
          @input=${(e: Event) => {
            this.newRevisionReason = (e.target as HTMLInputElement).value;
          }}
          placeholder="例: 初版（バックエンド向け）"
        />
      </div>
      <div class="field">
        <label>対象求人（任意）</label>
        <select
          .value=${this.newJobTargetId}
          @change=${(e: Event) => {
            this.newJobTargetId = (e.target as HTMLSelectElement).value;
          }}
        >
          <option value="">— 求人を紐付けない —</option>
          ${this.jobTargets.map(
            (t) =>
              html`<option value=${t.id} ?selected=${this.newJobTargetId === t.id}>${t.companyName} — ${t.jobTitle}</option>`,
          )}
        </select>
      </div>
      <div class="field">
        <label>宛先メモ（任意）</label>
        <input
          type="text"
          .value=${this.newTargetMemo}
          @input=${(e: Event) => {
            this.newTargetMemo = (e.target as HTMLInputElement).value;
          }}
          placeholder="例: A 社書類選考用"
        />
      </div>
      ${this.renderInsertRow()}
      <div class="field">
        <label>本文（Markdown）</label>
        <textarea
          class="editor"
          .value=${this.editContent}
          @input=${(e: Event) => {
            this.editContent = (e.target as HTMLTextAreaElement).value;
          }}
        ></textarea>
      </div>
      <div class="actions">
        <button class="primary" @click=${this.handleCreate} ?disabled=${this.isSaving || !this.newTitle.trim()}>
          ${this.isSaving ? '作成中...' : '作成'}
        </button>
        <button class="secondary" @click=${this.handleBackToList} ?disabled=${this.isSaving}>キャンセル</button>
      </div>
    `;
  }

  private renderEdit() {
    if (!this.selected) return html``;
    const doc = this.selected;
    const latest = this.revisions[0] ?? null;
    return html`
      <span class="back-link" @click=${this.handleBackToList}>← ドキュメント一覧</span>
      <h2>${doc.title}</h2>
      ${this.error ? html`<p class="error">${this.error}</p>` : ''}
      ${
        latest
          ? html`
        <p class="doc-meta">
          最新改訂: ${latest.revisionReason || '(理由未記入)'}
          &nbsp;|&nbsp;
          ${latest.createdAt.replace('T', ' ').replace('Z', '')}
          &nbsp;|&nbsp;
          ${latest.createdBy === 'human' ? '手動' : 'AI'}
          ${this.renderJobTargetLabel(latest.jobTargetId)}
          ${latest.targetMemo ? html` &nbsp;|&nbsp; 宛先: ${latest.targetMemo}` : ''}
        </p>
      `
          : ''
      }
      <div class="field">
        <label>改訂理由 <span class="required">*</span></label>
        <input
          type="text"
          .value=${this.editRevisionReason}
          @input=${(e: Event) => {
            this.editRevisionReason = (e.target as HTMLInputElement).value;
          }}
          placeholder="例: B 社向けに強み 3 つ目を再構成"
        />
      </div>
      <div class="field">
        <label>対象求人（任意）</label>
        <select
          .value=${this.editJobTargetId}
          @change=${(e: Event) => {
            this.editJobTargetId = (e.target as HTMLSelectElement).value;
          }}
        >
          <option value="">— 求人を紐付けない —</option>
          ${this.jobTargets.map(
            (t) =>
              html`<option value=${t.id} ?selected=${this.editJobTargetId === t.id}>${t.companyName} — ${t.jobTitle}</option>`,
          )}
        </select>
      </div>
      <div class="field">
        <label>宛先メモ（任意）</label>
        <input
          type="text"
          .value=${this.editTargetMemo}
          @input=${(e: Event) => {
            this.editTargetMemo = (e.target as HTMLInputElement).value;
          }}
          placeholder="例: B 社一次面接用"
        />
      </div>
      ${this.renderInsertRow()}
      <div class="field">
        <label>本文（Markdown）</label>
        <textarea
          class="editor"
          .value=${this.editContent}
          @input=${(e: Event) => {
            this.editContent = (e.target as HTMLTextAreaElement).value;
          }}
        ></textarea>
      </div>
      <div class="actions">
        <button
          class="primary"
          @click=${this.handleSaveRevision}
          ?disabled=${this.isSaving || !this.editRevisionReason.trim()}
        >
          ${this.isSaving ? '保存中...' : '改訂を保存'}
        </button>
      </div>
      ${this.renderHistory()}
    `;
  }

  private renderHistory() {
    if (this.revisions.length === 0) return html``;
    return html`
      <div class="history">
        <h3>改訂履歴（${this.revisions.length} 件）</h3>
        ${this.revisions.map((rev, idx) => {
          const isExpanded = this.expandedRevisionId === rev.id;
          return html`
              <div class="history-item ${idx === 0 ? 'current' : ''}">
                <div class="history-reason">
                  ${idx === 0 ? '【最新】' : ''}${rev.revisionReason || '(理由未記入)'}
                </div>
                <div class="history-meta">
                  ${rev.createdAt.replace('T', ' ').replace('Z', '')}
                  &nbsp;|&nbsp;
                  ${rev.createdBy === 'human' ? '手動' : 'AI'}
                  ${this.renderJobTargetLabel(rev.jobTargetId)}
                  ${rev.targetMemo ? html` &nbsp;|&nbsp; 宛先: ${rev.targetMemo}` : ''}
                  ${
                    rev.previousRevisionId
                      ? html` &nbsp;|&nbsp; 前バージョン: ${rev.previousRevisionId.slice(-6)}`
                      : ''
                  }
                </div>
                <div class="history-actions">
                  <button
                    class="history-toggle"
                    @click=${() => {
                      this.expandedRevisionId = isExpanded ? '' : rev.id;
                    }}
                  >${isExpanded ? '閉じる' : '内容を見る'}</button>
                </div>
                ${isExpanded ? html`<div class="revision-content">${rev.content}</div>` : ''}
              </div>
            `;
        })}
      </div>
    `;
  }

  private renderJobTargetLabel(id: string | null) {
    if (!id) return '';
    const target = this.jobTargets.find((t) => t.id === id);
    if (!target) {
      return html` &nbsp;|&nbsp; 対象求人: <span class="ghost-target">削除済み (${id.slice(-6)})</span>`;
    }
    return html` &nbsp;|&nbsp; 対象求人: ${target.companyName} — ${target.jobTitle}`;
  }

  private renderInsertRow() {
    if (this.acceptedEvidences.length === 0) return html``;
    return html`
      <div class="insert-row">
        <select
          .value=${this.selectedEvidenceId}
          @change=${(e: Event) => {
            this.selectedEvidenceId = (e.target as HTMLSelectElement).value;
          }}
        >
          <option value="">— Evidence を選択して挿入 —</option>
          ${this.acceptedEvidences.map(
            (ev) => html`<option value=${ev.id}>${ev.strengthLabel}</option>`,
          )}
        </select>
        <button
          class="secondary"
          @click=${this.handleInsertEvidence}
          ?disabled=${!this.selectedEvidenceId}
        >挿入</button>
      </div>
    `;
  }

  override render() {
    if (this.viewState === 'new') return this.renderNew();
    if (this.viewState === 'edit') return this.renderEdit();
    return this.renderList();
  }
}

customElements.define('document-view', DocumentView);
