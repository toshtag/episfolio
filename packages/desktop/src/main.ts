import { css, html, LitElement, type TemplateResult } from 'lit';
import { backupIfNeeded } from './ipc/backup.js';
import { waitForTauri } from './ipc/tauri-ready.js';

type Tab =
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

type LazyView = Tab;
type TabGroup = 'strength' | 'job' | 'documents' | 'agent' | 'interview' | 'resignation' | 'system';

const VIEW_LOADERS: Record<LazyView, () => Promise<unknown>> = {
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

const TAB_GROUPS: { id: TabGroup; label: string }[] = [
  { id: 'strength', label: '強み発掘' },
  { id: 'job', label: '求人・企業' },
  { id: 'documents', label: '応募書類' },
  { id: 'agent', label: 'エージェント' },
  { id: 'interview', label: '面接' },
  { id: 'resignation', label: '退職' },
  { id: 'system', label: '設定' },
];

const TABS: { id: Tab; label: string; group: TabGroup }[] = [
  // 強み発掘（書籍 A 第 1 章 + 書籍 1-02 自分大全）
  { id: 'timeline', label: '年表', group: 'strength' },
  { id: 'strength-arrows', label: '三つの矢印', group: 'strength' },
  { id: 'result-by-types', label: '3 タイプの実績', group: 'strength' },
  { id: 'strength-from-weakness', label: '弱みを武器に', group: 'strength' },
  { id: 'microchop-skill', label: 'みじん切り', group: 'strength' },
  { id: 'weak-connection', label: '弱いつながり', group: 'strength' },
  // 求人・企業（書籍 A 第 2 章 + 書籍 B 第 4 章前半）
  { id: 'job-targets', label: '求人', group: 'job' },
  { id: 'monster-company-check', label: 'モンスター企業判定', group: 'job' },
  { id: 'recruitment-impression', label: '採用印象メモ', group: 'job' },
  { id: 'salary-benchmark', label: '給料分析', group: 'job' },
  { id: 'hidden-gem-note', label: '隠れ優良企業', group: 'job' },
  { id: 'growth-cycle-note', label: '成長サイクル', group: 'job' },
  { id: 'company-certification', label: '認定・認証', group: 'job' },
  { id: 'business-unit-type-match', label: '事業部タイプ相性', group: 'job' },
  // 応募書類（書籍 A 第 3 章）
  { id: 'documents', label: 'ドキュメント', group: 'documents' },
  { id: 'digest', label: 'ダイジェスト', group: 'documents' },
  { id: 'application-motives', label: '志望動機', group: 'documents' },
  { id: 'boss-references', label: '上司リファレンス', group: 'documents' },
  { id: 'customer-references', label: '顧客リファレンス', group: 'documents' },
  { id: 'work-asset-summaries', label: '仕事資料', group: 'documents' },
  { id: 'subordinate-summaries', label: '部下まとめ', group: 'documents' },
  // エージェント（書籍 A 第 4 章 + 書籍 B 第 3 章）
  { id: 'agent-track-records', label: 'エージェント実績', group: 'agent' },
  { id: 'agent-meeting-emails', label: '面談メール', group: 'agent' },
  { id: 'job-wish-sheets', label: '希望シート', group: 'agent' },
  // 面接（書籍 A 第 5 章 + 書籍 B 第 4 章後半）
  { id: 'interview-qa', label: '面接の赤本', group: 'interview' },
  { id: 'interview-report', label: '面接後報告', group: 'interview' },
  // 退職（書籍 B 第 5 章）
  { id: 'resignation-plan', label: '退職交渉', group: 'resignation' },
  // 設定
  { id: 'settings', label: '設定', group: 'system' },
];

const TAB_CONTENT: Record<Tab, () => TemplateResult> = {
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

function groupForTab(tab: Tab): TabGroup {
  return TABS.find((item) => item.id === tab)?.group ?? 'strength';
}

class EpisodeApp extends LitElement {
  static override properties = {
    backupError: { state: true },
    tab: { state: true },
    tabGroup: { state: true },
  };

  declare backupError: string;
  declare tab: Tab;
  declare tabGroup: TabGroup;

  private readonly loadedViews = new Set<LazyView>();
  private readonly loadingViews = new Set<LazyView>();
  private loadErrors: Partial<Record<LazyView, string>> = {};

  constructor() {
    super();
    this.backupError = '';
    this.tab = 'timeline';
    this.tabGroup = 'strength';
  }

  static override styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      color: #1a1a1a;
      width: 100%;
      min-height: 100vh;
    }
    .group-nav,
    .tab-nav {
      display: flex;
      gap: 0;
      padding: 0 1.5rem;
      overflow-x: auto;
      overflow-y: hidden;
      white-space: nowrap;
    }
    .group-nav {
      background: #f7f7f7;
      border-bottom: 1px solid #e5e5e5;
    }
    .tab-nav {
      border-bottom: 2px solid #ddd;
    }
    .group-nav button,
    .tab-nav button {
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
    }
    .group-nav button {
      margin-bottom: -1px;
      padding: 0.5rem 0.8rem;
      font-size: 0.82rem;
      color: #555;
    }
    .tab-nav button {
      margin-bottom: -2px;
      padding: 0.6rem 1rem;
      font-size: 0.9rem;
      color: #888;
    }
    .group-nav button.active {
      color: #1a1a1a;
      border-bottom-color: #1a1a1a;
      font-weight: 600;
    }
    .tab-nav button.active {
      color: #1a1a1a;
      border-bottom-color: #1a1a1a;
      font-weight: 600;
    }
    .panel { padding: 2rem; }
    .empty { color: #888; font-size: 0.9rem; }
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .backup-error {
      margin: 0;
      padding: 0.7rem 1.5rem;
      background: #fff5f5;
      border-bottom: 1px solid #f1b7b7;
      color: #8a0000;
      font-size: 0.85rem;
    }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    const ready = await waitForTauri();
    if (!ready) return;
    void this.runStartupBackup();
    void this.ensureView(this.tab);
  }

  private async runStartupBackup() {
    try {
      await backupIfNeeded();
    } catch (e) {
      this.backupError = `バックアップに失敗しました: ${String(e)}`;
    }
  }

  private activateTab(id: Tab) {
    this.tab = id;
    this.tabGroup = groupForTab(id);
    void this.ensureView(id);
  }

  private activateGroup(group: TabGroup) {
    this.tabGroup = group;
    if (groupForTab(this.tab) === group) return;
    const firstTab = TABS.find((item) => item.group === group);
    if (firstTab) this.activateTab(firstTab.id);
  }

  private renderNav() {
    const visibleTabs = TABS.filter((item) => item.group === this.tabGroup);
    return html`
      <nav class="group-nav" aria-label="機能カテゴリ">
        ${TAB_GROUPS.map(
          ({ id, label }) => html`
          <button
            class=${this.tabGroup === id ? 'active' : ''}
            @click=${() => this.activateGroup(id)}
          >${label}</button>
        `,
        )}
      </nav>
      <nav class="tab-nav" aria-label="機能">
        ${visibleTabs.map(
          ({ id, label }) => html`
          <button
            class=${this.tab === id ? 'active' : ''}
            @click=${() => this.activateTab(id)}
          >${label}</button>
        `,
        )}
      </nav>
    `;
  }

  private renderContent() {
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
    return html`
      ${this.renderNav()}
      ${this.backupError ? html`<p class="backup-error">${this.backupError}</p>` : ''}
      ${this.renderContent()}
    `;
  }
}

customElements.define('episode-app', EpisodeApp);
