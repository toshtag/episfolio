import type { Episode } from '@episfolio/kernel';
import { css, html, LitElement, type TemplateResult } from 'lit';
import { backupIfNeeded } from './ipc/backup.js';
import { createEpisode, listEpisodes } from './ipc/episodes.js';

type Tab =
  | 'episodes'
  | 'evidence'
  | 'documents'
  | 'timeline'
  | 'job-targets'
  | 'interview-qa'
  | 'interview-report'
  | 'agent-track-records'
  | 'agent-meeting-emails'
  | 'job-wish-sheets'
  | 'application-motives'
  | 'boss-references'
  | 'customer-references'
  | 'strength-arrows'
  | 'work-asset-summaries'
  | 'subordinate-summaries'
  | 'result-by-types'
  | 'strength-from-weakness'
  | 'microchop-skill'
  | 'weak-connection'
  | 'company-certification'
  | 'business-unit-type-match'
  | 'monster-company-check'
  | 'recruitment-impression'
  | 'salary-benchmark'
  | 'hidden-gem-note'
  | 'growth-cycle-note'
  | 'resignation-plan'
  | 'digest'
  | 'settings';

type LazyTab = Exclude<Tab, 'episodes'>;
type LazyView = LazyTab | 'episode-detail';

const VIEW_LOADERS: Record<LazyView, () => Promise<unknown>> = {
  'episode-detail': () => import('./episode-detail-view.js'),
  evidence: () => import('./evidence-list-view.js'),
  documents: () => import('./document-view.js'),
  timeline: () => import('./life-timeline-view.js'),
  'job-targets': () => import('./job-target-view.js'),
  'interview-qa': () => import('./interview-qa-view.js'),
  'interview-report': () => import('./interview-report-view.js'),
  'agent-track-records': () => import('./agent-track-record-view.js'),
  'agent-meeting-emails': () => import('./agent-meeting-email-view.js'),
  'job-wish-sheets': () => import('./job-wish-sheet-view.js'),
  'application-motives': () => import('./application-motive-view.js'),
  'boss-references': () => import('./boss-reference-view.js'),
  'customer-references': () => import('./customer-reference-view.js'),
  'strength-arrows': () => import('./strength-arrow-view.js'),
  'work-asset-summaries': () => import('./work-asset-summary-view.js'),
  'subordinate-summaries': () => import('./subordinate-summary-view.js'),
  'result-by-types': () => import('./result-by-type-view.js'),
  'strength-from-weakness': () => import('./strength-from-weakness-view.js'),
  'microchop-skill': () => import('./microchop-skill-view.js'),
  'weak-connection': () => import('./weak-connection-view.js'),
  'company-certification': () => import('./company-certification-view.js'),
  'business-unit-type-match': () => import('./business-unit-type-match-view.js'),
  'monster-company-check': () => import('./monster-company-check-view.js'),
  'recruitment-impression': () => import('./recruitment-impression-view.js'),
  'salary-benchmark': () => import('./salary-benchmark-view.js'),
  'hidden-gem-note': () => import('./hidden-gem-note-view.js'),
  'growth-cycle-note': () => import('./growth-cycle-note-view.js'),
  'resignation-plan': () => import('./resignation-plan-view.js'),
  digest: () => import('./digest-view.js'),
  settings: () => import('./settings-view.js'),
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'episodes', label: 'エピソード' },
  { id: 'evidence', label: 'エビデンス' },
  { id: 'documents', label: 'ドキュメント' },
  { id: 'timeline', label: '年表' },
  { id: 'job-targets', label: '求人' },
  { id: 'interview-qa', label: '面接の赤本' },
  { id: 'interview-report', label: '面接後報告' },
  { id: 'agent-track-records', label: 'エージェント' },
  { id: 'agent-meeting-emails', label: '面談メール' },
  { id: 'job-wish-sheets', label: '希望シート' },
  { id: 'application-motives', label: '志望動機' },
  { id: 'boss-references', label: '上司リファレンス' },
  { id: 'customer-references', label: '顧客リファレンス' },
  { id: 'strength-arrows', label: '三つの矢印' },
  { id: 'work-asset-summaries', label: '仕事資料' },
  { id: 'subordinate-summaries', label: '部下まとめ' },
  { id: 'result-by-types', label: '3 タイプの実績' },
  { id: 'strength-from-weakness', label: '弱みを武器に' },
  { id: 'microchop-skill', label: 'みじん切り' },
  { id: 'weak-connection', label: '弱いつながり' },
  { id: 'company-certification', label: '認定・認証' },
  { id: 'business-unit-type-match', label: '事業部タイプ相性' },
  { id: 'monster-company-check', label: 'モンスター企業判定' },
  { id: 'recruitment-impression', label: '採用印象メモ' },
  { id: 'salary-benchmark', label: '給料分析' },
  { id: 'hidden-gem-note', label: '隠れ優良企業' },
  { id: 'growth-cycle-note', label: '成長サイクル' },
  { id: 'resignation-plan', label: '退職交渉' },
  { id: 'digest', label: 'ダイジェスト' },
  { id: 'settings', label: '設定' },
];

const TAB_CONTENT: Record<LazyTab, () => TemplateResult> = {
  evidence: () => html`<evidence-list-view></evidence-list-view>`,
  documents: () => html`<document-view></document-view>`,
  timeline: () => html`<life-timeline-view></life-timeline-view>`,
  'job-targets': () => html`<job-target-view></job-target-view>`,
  'interview-qa': () => html`<interview-qa-view></interview-qa-view>`,
  'interview-report': () => html`<interview-report-view></interview-report-view>`,
  'agent-track-records': () => html`<agent-track-record-view></agent-track-record-view>`,
  'agent-meeting-emails': () => html`<agent-meeting-email-view></agent-meeting-email-view>`,
  'job-wish-sheets': () => html`<job-wish-sheet-view></job-wish-sheet-view>`,
  'application-motives': () => html`<application-motive-view></application-motive-view>`,
  'boss-references': () => html`<boss-reference-view></boss-reference-view>`,
  'customer-references': () => html`<customer-reference-view></customer-reference-view>`,
  'strength-arrows': () => html`<strength-arrow-view></strength-arrow-view>`,
  'work-asset-summaries': () => html`<work-asset-summary-view></work-asset-summary-view>`,
  'subordinate-summaries': () => html`<subordinate-summary-view></subordinate-summary-view>`,
  'result-by-types': () => html`<result-by-type-view></result-by-type-view>`,
  'strength-from-weakness': () => html`<strength-from-weakness-view></strength-from-weakness-view>`,
  'microchop-skill': () => html`<microchop-skill-view></microchop-skill-view>`,
  'weak-connection': () => html`<weak-connection-view></weak-connection-view>`,
  'company-certification': () => html`<company-certification-view></company-certification-view>`,
  'business-unit-type-match': () =>
    html`<business-unit-type-match-view></business-unit-type-match-view>`,
  'monster-company-check': () => html`<monster-company-check-view></monster-company-check-view>`,
  'recruitment-impression': () => html`<recruitment-impression-view></recruitment-impression-view>`,
  'salary-benchmark': () => html`<salary-benchmark-view></salary-benchmark-view>`,
  'hidden-gem-note': () => html`<hidden-gem-note-view></hidden-gem-note-view>`,
  'growth-cycle-note': () => html`<growth-cycle-note-view></growth-cycle-note-view>`,
  'resignation-plan': () => html`<resignation-plan-view></resignation-plan-view>`,
  digest: () => html`<digest-view></digest-view>`,
  settings: () => html`<settings-view></settings-view>`,
};

function isLazyTab(tab: Tab): tab is LazyTab {
  return tab !== 'episodes';
}

class EpisodeApp extends LitElement {
  static override properties = {
    episodes: { state: true },
    newTitle: { state: true },
    saving: { state: true },
    error: { state: true },
    tab: { state: true },
    selectedId: { state: true },
  };

  declare episodes: Episode[];
  declare newTitle: string;
  declare saving: boolean;
  declare error: string;
  declare tab: Tab;
  declare selectedId: string;

  private readonly loadedViews = new Set<LazyView>();
  private readonly loadingViews = new Set<LazyView>();
  private loadErrors: Partial<Record<LazyView, string>> = {};

  constructor() {
    super();
    this.episodes = [];
    this.newTitle = '';
    this.saving = false;
    this.error = '';
    this.tab = 'episodes';
    this.selectedId = '';
  }

  static override styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      color: #1a1a1a;
      max-width: 720px;
    }
    nav {
      display: flex;
      gap: 0;
      border-bottom: 2px solid #ddd;
      padding: 0 1.5rem;
    }
    nav button {
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      padding: 0.6rem 1rem;
      font-size: 0.9rem;
      cursor: pointer;
      color: #888;
    }
    nav button.active {
      color: #1a1a1a;
      border-bottom-color: #1a1a1a;
      font-weight: 600;
    }
    .panel { padding: 2rem; }
    h1 { margin: 0 0 1.5rem; font-size: 1.4rem; }
    .form { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    input {
      flex: 1;
      padding: 0.4rem 0.7rem;
      font-size: 0.95rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
    }
    button.save-btn {
      padding: 0.4rem 0.9rem;
      font-size: 0.95rem;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.save-btn:disabled { opacity: 0.5; cursor: default; }
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 2px solid #ddd; }
    td { padding: 0.4rem 0.5rem; border-bottom: 1px solid #eee; }
    tbody tr { cursor: pointer; }
    tbody tr:hover td { background: #f6f6f6; }
    .empty { color: #888; font-size: 0.9rem; }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    backupIfNeeded().catch(() => {});
    await this.loadEpisodes();
  }

  private async loadEpisodes() {
    try {
      this.episodes = await listEpisodes();
    } catch (e) {
      this.error = String(e);
    }
  }

  private async handleSave() {
    const t = this.newTitle.trim();
    if (!t) return;
    this.saving = true;
    this.error = '';
    try {
      await createEpisode(t);
      this.newTitle = '';
      await this.loadEpisodes();
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') this.handleSave();
  }

  private handleSelect(id: string) {
    this.selectedId = id;
    void this.ensureView('episode-detail');
  }

  private async handleBack() {
    this.selectedId = '';
    await this.loadEpisodes();
  }

  private async handleDeleted() {
    this.selectedId = '';
    await this.loadEpisodes();
  }

  private renderNav() {
    return html`
      <nav>
        ${TABS.map(
          ({ id, label }) => html`
          <button
            class=${this.tab === id ? 'active' : ''}
            @click=${() => {
              this.tab = id;
              if (id === 'episodes') this.selectedId = '';
              if (isLazyTab(id)) void this.ensureView(id);
            }}
          >${label}</button>
        `,
        )}
      </nav>
    `;
  }

  private renderEpisodesPanel() {
    if (this.selectedId) {
      return this.renderLazyView(
        'episode-detail',
        () => html`
        <episode-detail-view
          episode-id=${this.selectedId}
          @back=${this.handleBack}
          @episode-deleted=${this.handleDeleted}
        ></episode-detail-view>
      `,
      );
    }
    return html`
      <div class="panel">
        <h1>エピソード</h1>
        <div class="form">
          <input
            .value=${this.newTitle}
            @input=${(e: Event) => {
              this.newTitle = (e.target as HTMLInputElement).value;
            }}
            @keydown=${this.handleKeydown}
            placeholder="エピソードのタイトルを入力"
          />
          <button class="save-btn" @click=${this.handleSave} ?disabled=${this.saving || !this.newTitle.trim()}>
            保存
          </button>
        </div>
        ${this.error ? html`<p class="error">${this.error}</p>` : ''}
        ${
          this.episodes.length === 0
            ? html`<p class="empty">エピソードはまだありません</p>`
            : html`
            <table>
              <thead><tr><th>タイトル</th><th>作成日時</th></tr></thead>
              <tbody>
                ${this.episodes.map(
                  (ep) => html`
                  <tr @click=${() => this.handleSelect(ep.id)}>
                    <td>${ep.title}</td>
                    <td>${ep.createdAt.replace('T', ' ').replace('Z', '')}</td>
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

  private renderContent() {
    if (this.tab === 'episodes') return this.renderEpisodesPanel();
    return this.renderLazyView(this.tab, TAB_CONTENT[this.tab]);
  }

  private renderLazyView(view: LazyView, render: () => TemplateResult) {
    if (this.loadErrors[view]) {
      return html`<div class="panel"><p class="error">${this.loadErrors[view]}</p></div>`;
    }
    if (!this.loadedViews.has(view)) {
      void this.ensureView(view);
      return html`<div class="panel"><p class="empty">読み込み中...</p></div>`;
    }
    return render();
  }

  private async ensureView(view: LazyView) {
    if (this.loadedViews.has(view) || this.loadingViews.has(view)) return;
    this.loadingViews.add(view);
    const { [view]: _previousError, ...loadErrors } = this.loadErrors;
    this.loadErrors = loadErrors;
    this.requestUpdate();
    try {
      await VIEW_LOADERS[view]();
      this.loadedViews.add(view);
    } catch (e) {
      this.loadErrors = {
        ...this.loadErrors,
        [view]: `画面の読み込みに失敗しました: ${String(e)}`,
      };
    } finally {
      this.loadingViews.delete(view);
      this.requestUpdate();
    }
  }

  override render() {
    return html`${this.renderNav()}${this.renderContent()}`;
  }
}

customElements.define('episode-app', EpisodeApp);
