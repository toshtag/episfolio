import {
  type Episode,
  type JobRequirementMapping,
  type JobTarget,
  toCareerDigestMarkdown,
} from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import { listEpisodes } from './ipc/episodes.js';
import {
  listJobRequirementMappingsByJobTarget,
  saveJobRequirementMapping,
} from './ipc/job-requirement-mappings.js';
import { listJobTargets } from './ipc/job-targets.js';

type CardState = {
  episodeIds: string[];
  userNote: string;
  dirty: boolean;
  saving: boolean;
  saved: boolean;
};

class DigestView extends LitElement {
  static override properties = {
    jobTargets: { state: true },
    episodes: { state: true },
    selectedJobTargetId: { state: true },
    cardByRequirementId: { state: true },
    error: { state: true },
    copyState: { state: true },
  };

  declare jobTargets: JobTarget[];
  declare episodes: Episode[];
  declare selectedJobTargetId: string;
  declare cardByRequirementId: Record<string, CardState>;
  declare error: string;
  declare copyState: 'idle' | 'copied' | 'failed';

  constructor() {
    super();
    this.jobTargets = [];
    this.episodes = [];
    this.selectedJobTargetId = '';
    this.cardByRequirementId = {};
    this.error = '';
    this.copyState = 'idle';
  }

  static override styles = css`
    :host { display: block; }
    .panel { padding: 2rem; }
    h1 { margin: 0 0 1.5rem; font-size: 1.4rem; }
    h2 { margin: 1.5rem 0 0.75rem; font-size: 1.05rem; color: #333; }
    .selector {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 1rem;
    }
    .selector label { font-size: 0.9rem; color: #555; }
    select {
      padding: 0.4rem 0.6rem;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      min-width: 18rem;
    }
    .target-summary {
      font-size: 0.85rem;
      color: #555;
      margin-bottom: 1.25rem;
    }
    .req-card {
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 0.9rem 1rem;
      margin-bottom: 0.9rem;
    }
    .req-text {
      font-weight: 600;
      font-size: 0.95rem;
      margin-bottom: 0.6rem;
    }
    label.field {
      display: block;
      font-size: 0.85rem;
      color: #555;
      margin-bottom: 0.25rem;
      margin-top: 0.6rem;
    }
    textarea {
      width: 100%;
      padding: 0.4rem 0.6rem;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      box-sizing: border-box;
      min-height: 4rem;
      resize: vertical;
    }
    .episodes-grid {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      max-height: 14rem;
      overflow-y: auto;
      border: 1px solid #eee;
      border-radius: 0.3rem;
      padding: 0.5rem 0.7rem;
      background: #fafafa;
    }
    .episode-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
    }
    .episode-item input { width: auto; }
    .card-actions {
      display: flex;
      gap: 0.6rem;
      align-items: center;
      margin-top: 0.7rem;
    }
    button.save-btn {
      padding: 0.35rem 0.9rem;
      font-size: 0.85rem;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.save-btn:disabled { opacity: 0.5; cursor: default; }
    .saved-msg { font-size: 0.8rem; color: #2a7d2a; }
    .empty { color: #888; font-size: 0.9rem; padding: 0.5rem 0; }
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .preview-box {
      border: 1px solid #ddd;
      border-radius: 0.4rem;
      padding: 1rem 1.2rem;
      background: #fafafa;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.82rem;
      white-space: pre-wrap;
      max-height: 28rem;
      overflow-y: auto;
    }
    .preview-actions {
      display: flex;
      gap: 0.6rem;
      align-items: center;
      margin-top: 0.7rem;
    }
    button.copy-btn {
      padding: 0.35rem 0.9rem;
      font-size: 0.85rem;
      background: #fff;
      color: #1a1a1a;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    .copy-state { font-size: 0.8rem; color: #555; }
    .copy-state.copied { color: #2a7d2a; }
    .copy-state.failed { color: #c00; }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    await this.loadInitial();
  }

  private async loadInitial() {
    try {
      const [targets, eps] = await Promise.all([listJobTargets(), listEpisodes()]);
      this.jobTargets = targets;
      this.episodes = eps;
      const first = targets[0];
      if (first && !this.selectedJobTargetId) {
        await this.selectJobTarget(first.id);
      }
    } catch (e) {
      this.error = String(e);
    }
  }

  private get selectedJobTarget(): JobTarget | null {
    return this.jobTargets.find((t) => t.id === this.selectedJobTargetId) ?? null;
  }

  private async selectJobTarget(id: string) {
    this.selectedJobTargetId = id;
    this.copyState = 'idle';
    if (!id) {
      this.cardByRequirementId = {};
      return;
    }
    try {
      const mappings = await listJobRequirementMappingsByJobTarget(id);
      const next: Record<string, CardState> = {};
      const target = this.jobTargets.find((t) => t.id === id);
      if (target) {
        for (const skill of target.requiredSkills) {
          const existing = mappings.find((m) => m.requirementSkillId === skill.id);
          next[skill.id] = {
            episodeIds: existing?.episodeIds ?? [],
            userNote: existing?.userNote ?? '',
            dirty: false,
            saving: false,
            saved: false,
          };
        }
      }
      this.cardByRequirementId = next;
    } catch (e) {
      this.error = String(e);
    }
  }

  private updateCard(requirementSkillId: string, patch: Partial<CardState>) {
    const current = this.cardByRequirementId[requirementSkillId];
    if (!current) return;
    this.cardByRequirementId = {
      ...this.cardByRequirementId,
      [requirementSkillId]: { ...current, ...patch },
    };
  }

  private setUserNote(skillId: string, value: string) {
    this.updateCard(skillId, { userNote: value, dirty: true, saved: false });
  }

  private toggleEpisode(skillId: string, episodeId: string, checked: boolean) {
    const current = this.cardByRequirementId[skillId];
    if (!current) return;
    const set = new Set(current.episodeIds);
    if (checked) set.add(episodeId);
    else set.delete(episodeId);
    this.updateCard(skillId, {
      episodeIds: Array.from(set),
      dirty: true,
      saved: false,
    });
  }

  private async saveCard(skillId: string) {
    if (!this.selectedJobTargetId) return;
    const card = this.cardByRequirementId[skillId];
    if (!card) return;
    this.updateCard(skillId, { saving: true });
    this.error = '';
    try {
      await saveJobRequirementMapping({
        jobTargetId: this.selectedJobTargetId,
        requirementSkillId: skillId,
        episodeIds: card.episodeIds,
        userNote: card.userNote,
      });
      this.updateCard(skillId, { dirty: false, saved: true, saving: false });
    } catch (e) {
      this.error = String(e);
      this.updateCard(skillId, { saving: false });
    }
  }

  private buildPreviewMarkdown(): string {
    const target = this.selectedJobTarget;
    if (!target) return '';
    const now = new Date().toISOString();
    const syntheticMappings: JobRequirementMapping[] = target.requiredSkills.map((skill) => {
      const card = this.cardByRequirementId[skill.id];
      return {
        id: `preview_${skill.id}`,
        jobTargetId: target.id,
        requirementSkillId: skill.id,
        episodeIds: card?.episodeIds ?? [],
        userNote: card?.userNote ?? '',
        createdAt: now,
        updatedAt: now,
      };
    });
    return toCareerDigestMarkdown(target, syntheticMappings, this.episodes);
  }

  private async handleCopy() {
    const text = this.buildPreviewMarkdown();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.copyState = 'copied';
      setTimeout(() => {
        if (this.copyState === 'copied') this.copyState = 'idle';
      }, 2000);
    } catch (_e) {
      this.copyState = 'failed';
    }
  }

  override render() {
    return html`
      <div class="panel">
        <h1>職務経歴ダイジェスト</h1>
        ${this.error ? html`<p class="error">${this.error}</p>` : ''}

        <div class="selector">
          <label for="jt-select">求人:</label>
          <select
            id="jt-select"
            .value=${this.selectedJobTargetId}
            @change=${(e: Event) => this.selectJobTarget((e.target as HTMLSelectElement).value)}
          >
            <option value="">（選択してください）</option>
            ${this.jobTargets.map(
              (t) => html`
              <option value=${t.id} ?selected=${this.selectedJobTargetId === t.id}>
                ${t.companyName} — ${t.jobTitle}
              </option>
            `,
            )}
          </select>
        </div>

        ${this.renderRequirementCards()}

        <h2>Markdown プレビュー</h2>
        ${this.renderPreview()}
      </div>
    `;
  }

  private renderRequirementCards() {
    const target = this.selectedJobTarget;
    if (!target) {
      return html`<p class="empty">求人を選択するとマッピング編集が表示されます</p>`;
    }
    if (target.requiredSkills.length === 0) {
      return html`
        <div class="target-summary">${target.companyName} — ${target.jobTitle}</div>
        <p class="empty">この求人には必須要件が登録されていません（求人タブで追加してください）</p>
      `;
    }
    return html`
      <div class="target-summary">${target.companyName} — ${target.jobTitle}</div>
      ${target.requiredSkills.map((skill) => {
        const card = this.cardByRequirementId[skill.id];
        if (!card) return null;
        return html`
          <div class="req-card">
            <div class="req-text">${skill.text}</div>

            <label class="field" for="note-${skill.id}">この要件と自分の経験を繋ぐノート</label>
            <textarea
              id="note-${skill.id}"
              .value=${card.userNote}
              @input=${(e: Event) =>
                this.setUserNote(skill.id, (e.target as HTMLTextAreaElement).value)}
              placeholder="例: 前職で同等のシステムを設計しました。"
            ></textarea>

            <label class="field">関連 Episode（複数選択可）</label>
            <div class="episodes-grid">
              ${
                this.episodes.length === 0
                  ? html`<span class="empty">Episode が登録されていません</span>`
                  : this.episodes.map(
                      (ep) => html`
                  <label class="episode-item">
                    <input
                      type="checkbox"
                      ?checked=${card.episodeIds.includes(ep.id)}
                      @change=${(e: Event) =>
                        this.toggleEpisode(skill.id, ep.id, (e.target as HTMLInputElement).checked)}
                    />
                    <span>${ep.title || '（無題）'}</span>
                  </label>
                `,
                    )
              }
            </div>

            <div class="card-actions">
              <button
                class="save-btn"
                ?disabled=${card.saving || !card.dirty}
                @click=${() => this.saveCard(skill.id)}
              >${card.saving ? '保存中…' : '保存'}</button>
              ${card.saved && !card.dirty ? html`<span class="saved-msg">保存しました</span>` : ''}
            </div>
          </div>
        `;
      })}
    `;
  }

  private renderPreview() {
    const target = this.selectedJobTarget;
    if (!target) {
      return html`<p class="empty">求人を選択するとプレビューが表示されます</p>`;
    }
    const md = this.buildPreviewMarkdown();
    return html`
      <div class="preview-box">${md}</div>
      <div class="preview-actions">
        <button class="copy-btn" @click=${this.handleCopy}>クリップボードにコピー</button>
        ${
          this.copyState === 'copied'
            ? html`<span class="copy-state copied">コピーしました</span>`
            : this.copyState === 'failed'
              ? html`<span class="copy-state failed">コピーに失敗しました</span>`
              : ''
        }
      </div>
    `;
  }
}

customElements.define('digest-view', DigestView);
