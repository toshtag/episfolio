import { LitElement, css, html } from 'lit';
import type { Episode } from '@episfolio/kernel';
import { createEpisode, listEpisodes } from './ipc/episodes.js';

class EpisodeApp extends LitElement {
  static override properties = {
    episodes: { state: true },
    newTitle: { state: true },
    saving: { state: true },
    error: { state: true },
  };

  episodes: Episode[] = [];
  newTitle = '';
  saving = false;
  error = '';

  static override styles = css`
    :host {
      display: block;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
      color: #1a1a1a;
      max-width: 720px;
    }
    h1 { margin: 0 0 1.5rem; font-size: 1.4rem; }
    .form { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    input {
      flex: 1;
      padding: 0.4rem 0.7rem;
      font-size: 0.95rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
    }
    button {
      padding: 0.4rem 0.9rem;
      font-size: 0.95rem;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button:disabled { opacity: 0.5; cursor: default; }
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 2px solid #ddd; }
    td { padding: 0.4rem 0.5rem; border-bottom: 1px solid #eee; }
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

  override render() {
    return html`
      <h1>Episfolio</h1>
      <div class="form">
        <input
          .value=${this.newTitle}
          @input=${(e: Event) => { this.newTitle = (e.target as HTMLInputElement).value; }}
          @keydown=${this.handleKeydown}
          placeholder="エピソードのタイトルを入力"
        />
        <button @click=${this.handleSave} ?disabled=${this.saving || !this.newTitle.trim()}>
          保存
        </button>
      </div>
      ${this.error ? html`<p class="error">${this.error}</p>` : ''}
      ${this.episodes.length === 0
        ? html`<p class="empty">エピソードはまだありません</p>`
        : html`
          <table>
            <thead><tr><th>タイトル</th><th>作成日時</th></tr></thead>
            <tbody>
              ${this.episodes.map(ep => html`
                <tr>
                  <td>${ep.title}</td>
                  <td>${ep.createdAt.replace('T', ' ').replace('Z', '')}</td>
                </tr>
              `)}
            </tbody>
          </table>
        `}
    `;
  }
}

customElements.define('episode-app', EpisodeApp);
