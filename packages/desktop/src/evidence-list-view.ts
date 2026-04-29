import { css, html, LitElement } from 'lit';
import type { SkillEvidenceRow } from './ipc/evidence.js';
import { listSkillEvidence, updateSkillEvidenceStatus } from './ipc/evidence.js';

type Status = 'idle' | 'loading' | 'updating' | 'error';

class EvidenceListView extends LitElement {
  static override properties = {
    evidences: { state: true },
    status: { state: true },
    error: { state: true },
    filter: { state: true },
  };

  declare evidences: SkillEvidenceRow[];
  declare status: Status;
  declare error: string;
  declare filter: 'all' | 'candidate' | 'accepted' | 'rejected';

  constructor() {
    super();
    this.evidences = [];
    this.status = 'idle';
    this.error = '';
    this.filter = 'all';
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
    .filter-bar {
      display: flex;
      gap: 0.4rem;
      margin-bottom: 1rem;
    }
    .filter-bar button {
      padding: 0.3rem 0.7rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      background: #fff;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .filter-bar button.active {
      background: #1a1a1a;
      color: #fff;
      border-color: #1a1a1a;
    }
    .empty { color: #888; font-size: 0.9rem; }
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.75rem; }
    .card {
      border: 1px solid #e0e0e0;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 0.75rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    .label { font-weight: 600; font-size: 1rem; }
    .badges { display: flex; gap: 0.4rem; align-items: center; }
    .badge {
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 1rem;
      font-weight: 500;
    }
    .badge-low    { background: #f0f0f0; color: #666; }
    .badge-medium { background: #fff3cd; color: #856404; }
    .badge-high   { background: #d1e7dd; color: #155724; }
    .badge-candidate { background: #e2e8f0; color: #475569; }
    .badge-accepted  { background: #bbf7d0; color: #166534; }
    .badge-rejected  { background: #fecaca; color: #991b1b; }
    .description { font-size: 0.9rem; color: #333; margin-bottom: 0.5rem; }
    .detail { font-size: 0.8rem; color: #666; margin-bottom: 0.4rem; }
    .episode-ids { font-size: 0.75rem; color: #999; margin-bottom: 0.6rem; font-family: monospace; }
    .actions { display: flex; gap: 0.4rem; }
    button.accept {
      padding: 0.25rem 0.65rem;
      font-size: 0.82rem;
      background: #166534;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.reject {
      padding: 0.25rem 0.65rem;
      font-size: 0.82rem;
      background: #fff;
      color: #991b1b;
      border: 1px solid #991b1b;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.restore {
      padding: 0.25rem 0.65rem;
      font-size: 0.82rem;
      background: #fff;
      color: #475569;
      border: 1px solid #cbd5e1;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button:disabled { opacity: 0.5; cursor: default; }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    await this.load();
  }

  private async load() {
    this.status = 'loading';
    this.error = '';
    try {
      this.evidences = await listSkillEvidence();
      this.status = 'idle';
    } catch (e) {
      this.status = 'error';
      this.error = String(e);
    }
  }

  private async handleStatusChange(id: string, status: 'candidate' | 'accepted' | 'rejected') {
    this.status = 'updating';
    try {
      const updated = await updateSkillEvidenceStatus(id, status);
      this.evidences = this.evidences.map((ev) => (ev.id === updated.id ? updated : ev));
      this.status = 'idle';
    } catch (e) {
      this.status = 'error';
      this.error = String(e);
    }
  }

  private get filtered() {
    if (this.filter === 'all') return this.evidences;
    return this.evidences.filter((ev) => ev.status === this.filter);
  }

  private renderCard(ev: SkillEvidenceRow) {
    const busy = this.status === 'updating';
    return html`
      <div class="card">
        <div class="card-header">
          <span class="label">${ev.strengthLabel}</span>
          <span class="badges">
            <span class="badge badge-${ev.confidence}">${ev.confidence}</span>
            <span class="badge badge-${ev.status}">
              ${{ candidate: '候補', accepted: '採用', rejected: '却下' }[ev.status]}
            </span>
          </span>
        </div>
        <p class="description">${ev.description}</p>
        ${
          ev.reproducibility
            ? html`<p class="detail"><strong>再現性:</strong> ${ev.reproducibility}</p>`
            : ''
        }
        ${
          ev.evaluatedContext
            ? html`<p class="detail"><strong>評価文脈:</strong> ${ev.evaluatedContext}</p>`
            : ''
        }
        ${
          ev.evidenceEpisodeIds.length > 0
            ? html`<p class="episode-ids">根拠エピソード: ${ev.evidenceEpisodeIds.join(', ')}</p>`
            : ''
        }
        <div class="actions">
          ${
            ev.status !== 'accepted'
              ? html`<button class="accept" ?disabled=${busy} @click=${() => this.handleStatusChange(ev.id, 'accepted')}>採用</button>`
              : ''
          }
          ${
            ev.status !== 'rejected'
              ? html`<button class="reject" ?disabled=${busy} @click=${() => this.handleStatusChange(ev.id, 'rejected')}>却下</button>`
              : ''
          }
          ${
            ev.status !== 'candidate'
              ? html`<button class="restore" ?disabled=${busy} @click=${() => this.handleStatusChange(ev.id, 'candidate')}>候補に戻す</button>`
              : ''
          }
        </div>
      </div>
    `;
  }

  override render() {
    const list = this.filtered;
    return html`
      <h2>強みの候補 (Evidence)</h2>
      ${this.error ? html`<p class="error">${this.error}</p>` : ''}
      <div class="filter-bar">
        ${(['all', 'candidate', 'accepted', 'rejected'] as const).map(
          (f) => html`
            <button
              class=${this.filter === f ? 'active' : ''}
              @click=${() => {
                this.filter = f;
              }}
            >${{ all: 'すべて', candidate: '候補', accepted: '採用', rejected: '却下' }[f]}</button>
          `,
        )}
      </div>
      ${
        this.status === 'loading'
          ? html`<p>読み込み中...</p>`
          : list.length === 0
            ? html`<p class="empty">まだ候補がありません。エピソード画面から Evidence を生成してください。</p>`
            : list.map((ev) => this.renderCard(ev))
      }
    `;
  }
}

customElements.define('evidence-list-view', EvidenceListView);
