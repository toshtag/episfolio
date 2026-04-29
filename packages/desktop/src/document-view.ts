import { css, html, LitElement } from 'lit';
import type { CareerDocumentRow, DocumentRevisionRow } from './ipc/documents.js';
import { generateDocument, getDocument, listDocuments } from './ipc/documents.js';
import type { SkillEvidenceRow } from './ipc/evidence.js';
import { listSkillEvidence } from './ipc/evidence.js';

type ViewState = 'list' | 'detail' | 'generating';

class DocumentView extends LitElement {
  static override properties = {
    documents: { state: true },
    selected: { state: true },
    revisions: { state: true },
    acceptedEvidences: { state: true },
    viewState: { state: true },
    jobTarget: { state: true },
    error: { state: true },
  };

  declare documents: CareerDocumentRow[];
  declare selected: CareerDocumentRow | null;
  declare revisions: DocumentRevisionRow[];
  declare acceptedEvidences: SkillEvidenceRow[];
  declare viewState: ViewState;
  declare jobTarget: string;
  declare error: string;

  constructor() {
    super();
    this.documents = [];
    this.selected = null;
    this.revisions = [];
    this.acceptedEvidences = [];
    this.viewState = 'list';
    this.jobTarget = '';
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
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.75rem; }
    .empty { color: #888; font-size: 0.9rem; }
    .form-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      align-items: center;
    }
    input {
      flex: 1;
      padding: 0.4rem 0.7rem;
      font-size: 0.95rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
    }
    button.primary {
      padding: 0.4rem 0.9rem;
      font-size: 0.9rem;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.primary:disabled { opacity: 0.5; cursor: default; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-bottom: 1rem; }
    th { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 2px solid #ddd; }
    td { padding: 0.4rem 0.5rem; border-bottom: 1px solid #eee; }
    tbody tr { cursor: pointer; }
    tbody tr:hover td { background: #f6f6f6; }
    .evidence-count {
      font-size: 0.8rem;
      color: #666;
      margin-bottom: 1rem;
    }
    .markdown-content {
      white-space: pre-wrap;
      font-size: 0.9rem;
      line-height: 1.7;
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 1.25rem;
      margin-top: 0.75rem;
    }
    .revision-meta {
      font-size: 0.78rem;
      color: #888;
      margin-bottom: 0.5rem;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
      font-size: 0.85rem;
      color: #555;
      cursor: pointer;
      text-decoration: underline;
    }
    .generating-msg { color: #555; font-size: 0.9rem; }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    await this.loadAll();
  }

  private async loadAll() {
    try {
      const [docs, evidences] = await Promise.all([listDocuments(), listSkillEvidence()]);
      this.documents = docs;
      this.acceptedEvidences = evidences.filter((ev) => ev.status === 'accepted');
    } catch (e) {
      this.error = String(e);
    }
  }

  private async handleGenerate() {
    const t = this.jobTarget.trim();
    if (!t) return;
    this.viewState = 'generating';
    this.error = '';
    try {
      const result = await generateDocument([], t);
      await this.loadAll();
      await this.openDocument(result.document.id);
    } catch (e) {
      this.error = String(e);
      this.viewState = 'list';
    }
  }

  private async openDocument(id: string) {
    try {
      const result = await getDocument(id);
      this.selected = result.document;
      this.revisions = result.revisions;
      this.viewState = 'detail';
    } catch (e) {
      this.error = String(e);
    }
  }

  private handleBack() {
    this.selected = null;
    this.revisions = [];
    this.viewState = 'list';
  }

  private renderList() {
    return html`
      <h2>ドキュメント</h2>
      ${this.error ? html`<p class="error">${this.error}</p>` : ''}
      <p class="evidence-count">
        採用済みエビデンス: <strong>${this.acceptedEvidences.length} 件</strong>
        ${
          this.acceptedEvidences.length === 0
            ? html`<span>（Evidence タブで採用してからドキュメントを生成してください）</span>`
            : ''
        }
      </p>
      <div class="form-row">
        <input
          .value=${this.jobTarget}
          @input=${(e: Event) => {
            this.jobTarget = (e.target as HTMLInputElement).value;
          }}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Enter') this.handleGenerate();
          }}
          placeholder="応募先・職種（例: バックエンドエンジニア）"
        />
        <button
          class="primary"
          ?disabled=${!this.jobTarget.trim() || this.acceptedEvidences.length === 0}
          @click=${this.handleGenerate}
        >ドキュメント生成</button>
      </div>
      ${
        this.documents.length === 0
          ? html`<p class="empty">まだドキュメントがありません。</p>`
          : html`
          <table>
            <thead><tr><th>タイトル</th><th>ステータス</th><th>作成日時</th></tr></thead>
            <tbody>
              ${this.documents.map(
                (doc) => html`
                <tr @click=${() => this.openDocument(doc.id)}>
                  <td>${doc.title}</td>
                  <td>${doc.status === 'draft' ? '下書き' : '確定'}</td>
                  <td>${doc.createdAt.replace('T', ' ').replace('Z', '')}</td>
                </tr>
              `,
              )}
            </tbody>
          </table>
        `
      }
    `;
  }

  private renderGenerating() {
    return html`
      <p class="generating-msg">ドキュメントを生成中です...</p>
    `;
  }

  private renderDetail() {
    const doc = this.selected!;
    const latest = this.revisions[0] ?? null;
    return html`
      <span class="back-link" @click=${this.handleBack}>← ドキュメント一覧</span>
      <h2>${doc.title}</h2>
      ${this.error ? html`<p class="error">${this.error}</p>` : ''}
      ${
        latest
          ? html`
          <p class="revision-meta">
            生成日時: ${latest.createdAt.replace('T', ' ').replace('Z', '')}
            &nbsp;|&nbsp;
            根拠エビデンス: ${latest.sourceEvidenceIds.length} 件
          </p>
          <div class="markdown-content">${latest.content || '（コンテンツなし）'}</div>
        `
          : html`<p class="empty">リビジョンがありません。</p>`
      }
    `;
  }

  override render() {
    if (this.viewState === 'generating') return this.renderGenerating();
    if (this.viewState === 'detail') return this.renderDetail();
    return this.renderList();
  }
}

customElements.define('document-view', DocumentView);
