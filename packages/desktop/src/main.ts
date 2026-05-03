import type { Episode } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import { createEpisode, listEpisodes } from './ipc/episodes.js';
import './settings-view.js';
import './episode-detail-view.js';
import './evidence-list-view.js';
import './document-view.js';
import './life-timeline-view.js';
import './job-target-view.js';
import './interview-qa-view.js';
import './interview-report-view.js';
import './agent-meeting-email-view.js';
import './agent-track-record-view.js';
import './digest-view.js';
import './job-wish-sheet-view.js';
import './application-motive-view.js';
import './boss-reference-view.js';
import './customer-reference-view.js';
import './strength-arrow-view.js';
import './subordinate-summary-view.js';
import './work-asset-summary-view.js';
import './result-by-type-view.js';
import './strength-from-weakness-view.js';
import './microchop-skill-view.js';
import './weak-connection-view.js';
import './company-certification-view.js';
import './business-unit-type-match-view.js';
import './monster-company-check-view.js';
import './recruitment-impression-view.js';
import './salary-benchmark-view.js';
import './hidden-gem-note-view.js';
import './growth-cycle-note-view.js';

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
  | 'digest'
  | 'settings';

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
  }

  private async handleBack() {
    this.selectedId = '';
    await this.loadEpisodes();
  }

  private async handleDeleted() {
    this.selectedId = '';
    await this.loadEpisodes();
  }

  override render() {
    return html`
      <nav>
        <button
          class=${this.tab === 'episodes' ? 'active' : ''}
          @click=${() => {
            this.tab = 'episodes';
            this.selectedId = '';
          }}
        >エピソード</button>
        <button
          class=${this.tab === 'evidence' ? 'active' : ''}
          @click=${() => {
            this.tab = 'evidence';
          }}
        >エビデンス</button>
        <button
          class=${this.tab === 'documents' ? 'active' : ''}
          @click=${() => {
            this.tab = 'documents';
          }}
        >ドキュメント</button>
        <button
          class=${this.tab === 'timeline' ? 'active' : ''}
          @click=${() => {
            this.tab = 'timeline';
          }}
        >年表</button>
        <button
          class=${this.tab === 'job-targets' ? 'active' : ''}
          @click=${() => {
            this.tab = 'job-targets';
          }}
        >求人</button>
        <button
          class=${this.tab === 'interview-qa' ? 'active' : ''}
          @click=${() => {
            this.tab = 'interview-qa';
          }}
        >面接の赤本</button>
        <button
          class=${this.tab === 'interview-report' ? 'active' : ''}
          @click=${() => {
            this.tab = 'interview-report';
          }}
        >面接後報告</button>
        <button
          class=${this.tab === 'agent-track-records' ? 'active' : ''}
          @click=${() => {
            this.tab = 'agent-track-records';
          }}
        >エージェント</button>
        <button
          class=${this.tab === 'agent-meeting-emails' ? 'active' : ''}
          @click=${() => {
            this.tab = 'agent-meeting-emails';
          }}
        >面談メール</button>
        <button
          class=${this.tab === 'job-wish-sheets' ? 'active' : ''}
          @click=${() => {
            this.tab = 'job-wish-sheets';
          }}
        >希望シート</button>
        <button
          class=${this.tab === 'application-motives' ? 'active' : ''}
          @click=${() => {
            this.tab = 'application-motives';
          }}
        >志望動機</button>
        <button
          class=${this.tab === 'boss-references' ? 'active' : ''}
          @click=${() => {
            this.tab = 'boss-references';
          }}
        >上司リファレンス</button>
        <button
          class=${this.tab === 'customer-references' ? 'active' : ''}
          @click=${() => {
            this.tab = 'customer-references';
          }}
        >顧客リファレンス</button>
        <button
          class=${this.tab === 'strength-arrows' ? 'active' : ''}
          @click=${() => {
            this.tab = 'strength-arrows';
          }}
        >三つの矢印</button>
        <button
          class=${this.tab === 'work-asset-summaries' ? 'active' : ''}
          @click=${() => {
            this.tab = 'work-asset-summaries';
          }}
        >仕事資料</button>
        <button
          class=${this.tab === 'subordinate-summaries' ? 'active' : ''}
          @click=${() => {
            this.tab = 'subordinate-summaries';
          }}
        >部下まとめ</button>
        <button
          class=${this.tab === 'result-by-types' ? 'active' : ''}
          @click=${() => {
            this.tab = 'result-by-types';
          }}
        >3 タイプの実績</button>
        <button
          class=${this.tab === 'strength-from-weakness' ? 'active' : ''}
          @click=${() => {
            this.tab = 'strength-from-weakness';
          }}
        >弱みを武器に</button>
        <button
          class=${this.tab === 'microchop-skill' ? 'active' : ''}
          @click=${() => {
            this.tab = 'microchop-skill';
          }}
        >みじん切り</button>
        <button
          class=${this.tab === 'weak-connection' ? 'active' : ''}
          @click=${() => {
            this.tab = 'weak-connection';
          }}
        >弱いつながり</button>
        <button
          class=${this.tab === 'company-certification' ? 'active' : ''}
          @click=${() => {
            this.tab = 'company-certification';
          }}
        >認定・認証</button>
        <button
          class=${this.tab === 'business-unit-type-match' ? 'active' : ''}
          @click=${() => {
            this.tab = 'business-unit-type-match';
          }}
        >事業部タイプ相性</button>
        <button
          class=${this.tab === 'monster-company-check' ? 'active' : ''}
          @click=${() => {
            this.tab = 'monster-company-check';
          }}
        >モンスター企業判定</button>
        <button
          class=${this.tab === 'recruitment-impression' ? 'active' : ''}
          @click=${() => {
            this.tab = 'recruitment-impression';
          }}
        >採用印象メモ</button>
        <button
          class=${this.tab === 'salary-benchmark' ? 'active' : ''}
          @click=${() => {
            this.tab = 'salary-benchmark';
          }}
        >給料分析</button>
        <button
          class=${this.tab === 'hidden-gem-note' ? 'active' : ''}
          @click=${() => {
            this.tab = 'hidden-gem-note';
          }}
        >隠れ優良企業</button>
        <button
          class=${this.tab === 'growth-cycle-note' ? 'active' : ''}
          @click=${() => {
            this.tab = 'growth-cycle-note';
          }}
        >成長サイクル</button>
        <button
          class=${this.tab === 'digest' ? 'active' : ''}
          @click=${() => {
            this.tab = 'digest';
          }}
        >ダイジェスト</button>
        <button
          class=${this.tab === 'settings' ? 'active' : ''}
          @click=${() => {
            this.tab = 'settings';
          }}
        >設定</button>
      </nav>

      ${
        this.tab === 'episodes'
          ? this.selectedId
            ? html`
            <episode-detail-view
              episode-id=${this.selectedId}
              @back=${this.handleBack}
              @episode-deleted=${this.handleDeleted}
            ></episode-detail-view>
          `
            : html`
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
        `
          : this.tab === 'evidence'
            ? html`<evidence-list-view></evidence-list-view>`
            : this.tab === 'documents'
              ? html`<document-view></document-view>`
              : this.tab === 'timeline'
                ? html`<life-timeline-view></life-timeline-view>`
                : this.tab === 'job-targets'
                  ? html`<job-target-view></job-target-view>`
                  : this.tab === 'interview-qa'
                    ? html`<interview-qa-view></interview-qa-view>`
                    : this.tab === 'interview-report'
                      ? html`<interview-report-view></interview-report-view>`
                      : this.tab === 'agent-track-records'
                        ? html`<agent-track-record-view></agent-track-record-view>`
                        : this.tab === 'agent-meeting-emails'
                          ? html`<agent-meeting-email-view></agent-meeting-email-view>`
                          : this.tab === 'job-wish-sheets'
                            ? html`<job-wish-sheet-view></job-wish-sheet-view>`
                            : this.tab === 'application-motives'
                              ? html`<application-motive-view></application-motive-view>`
                              : this.tab === 'boss-references'
                                ? html`<boss-reference-view></boss-reference-view>`
                                : this.tab === 'customer-references'
                                  ? html`<customer-reference-view></customer-reference-view>`
                                  : this.tab === 'strength-arrows'
                                    ? html`<strength-arrow-view></strength-arrow-view>`
                                    : this.tab === 'work-asset-summaries'
                                      ? html`<work-asset-summary-view></work-asset-summary-view>`
                                      : this.tab === 'subordinate-summaries'
                                        ? html`<subordinate-summary-view></subordinate-summary-view>`
                                        : this.tab === 'result-by-types'
                                          ? html`<result-by-type-view></result-by-type-view>`
                                          : this.tab === 'strength-from-weakness'
                                            ? html`<strength-from-weakness-view></strength-from-weakness-view>`
                                            : this.tab === 'microchop-skill'
                                              ? html`<microchop-skill-view></microchop-skill-view>`
                                              : this.tab === 'weak-connection'
                                                ? html`<weak-connection-view></weak-connection-view>`
                                                : this.tab === 'company-certification'
                                                  ? html`<company-certification-view></company-certification-view>`
                                                  : this.tab === 'business-unit-type-match'
                                                    ? html`<business-unit-type-match-view></business-unit-type-match-view>`
                                                    : this.tab === 'monster-company-check'
                                                      ? html`<monster-company-check-view></monster-company-check-view>`
                                                      : this.tab === 'recruitment-impression'
                                                        ? html`<recruitment-impression-view></recruitment-impression-view>`
                                                        : this.tab === 'salary-benchmark'
                                                          ? html`<salary-benchmark-view></salary-benchmark-view>`
                                                          : this.tab === 'hidden-gem-note'
                                                            ? html`<hidden-gem-note-view></hidden-gem-note-view>`
                                                            : this.tab === 'growth-cycle-note'
                                                              ? html`<growth-cycle-note-view></growth-cycle-note-view>`
                                                              : this.tab === 'digest'
                                                                ? html`<digest-view></digest-view>`
                                                                : html`<settings-view></settings-view>`
      }
    `;
  }
}

customElements.define('episode-app', EpisodeApp);
