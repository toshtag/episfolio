import type { Episode, EpisodeUpdate } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import { deleteEpisode, getEpisode, updateEpisode } from './ipc/episodes.js';
import { type CreateManualEvidenceArgs, createSkillEvidenceManual } from './ipc/evidence.js';

type Status = 'idle' | 'loading' | 'saving' | 'deleting' | 'saved' | 'creating-evidence' | 'error';
type Confidence = 'low' | 'medium' | 'high';

class EpisodeDetailView extends LitElement {
  static override properties = {
    episodeId: { type: String, attribute: 'episode-id' },
    episode: { state: true },
    status: { state: true },
    message: { state: true },
    relatedSkillsText: { state: true },
    tagsText: { state: true },
    confirmDelete: { state: true },
    showManualEvidenceForm: { state: true },
    manualLabel: { state: true },
    manualDescription: { state: true },
    manualReproducibility: { state: true },
    manualEvaluatedContext: { state: true },
    manualConfidence: { state: true },
  };

  declare episodeId: string;
  declare episode: Episode | null;
  declare status: Status;
  declare message: string;
  declare relatedSkillsText: string;
  declare tagsText: string;
  declare confirmDelete: boolean;
  declare showManualEvidenceForm: boolean;
  declare manualLabel: string;
  declare manualDescription: string;
  declare manualReproducibility: string;
  declare manualEvaluatedContext: string;
  declare manualConfidence: Confidence;

  constructor() {
    super();
    this.episodeId = '';
    this.episode = null;
    this.status = 'idle';
    this.message = '';
    this.relatedSkillsText = '';
    this.tagsText = '';
    this.confirmDelete = false;
    this.showManualEvidenceForm = false;
    this.manualLabel = '';
    this.manualDescription = '';
    this.manualReproducibility = '';
    this.manualEvaluatedContext = '';
    this.manualConfidence = 'medium';
  }

  static override styles = css`
    :host {
      display: block;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
      color: #1a1a1a;
      max-width: 720px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    h2 { margin: 0; font-size: 1.2rem; }
    .back {
      background: none;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      padding: 0.3rem 0.7rem;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .field { margin-bottom: 1rem; }
    label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 0.3rem; }
    input[type="text"], textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 0.4rem 0.7rem;
      font-size: 0.95rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      font-family: inherit;
    }
    textarea { resize: vertical; min-height: 4rem; }
    .checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    .actions { display: flex; gap: 0.5rem; margin-top: 1.25rem; flex-wrap: wrap; }
    button.primary {
      padding: 0.4rem 0.9rem;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      font-size: 0.9rem;
      cursor: pointer;
    }
    button.danger {
      padding: 0.4rem 0.9rem;
      background: #fff;
      color: #c00;
      border: 1px solid #c00;
      border-radius: 0.3rem;
      font-size: 0.9rem;
      cursor: pointer;
    }
    button.danger-confirm {
      padding: 0.4rem 0.9rem;
      background: #c00;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      font-size: 0.9rem;
      cursor: pointer;
    }
    button.cancel {
      padding: 0.4rem 0.9rem;
      background: #fff;
      color: #555;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      font-size: 0.9rem;
      cursor: pointer;
    }
    button.manual-evidence {
      padding: 0.4rem 0.9rem;
      background: #fff;
      color: #1a1a1a;
      border: 1px solid #1a1a1a;
      border-radius: 0.3rem;
      font-size: 0.9rem;
      cursor: pointer;
    }
    button:disabled { opacity: 0.5; cursor: default; }
    .manual-form {
      margin-top: 1rem;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 0.4rem;
      background: #fafafa;
    }
    .manual-form h3 {
      margin: 0 0 0.75rem;
      font-size: 1rem;
      color: #1a1a1a;
    }
    .manual-form .row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-top: 0.5rem;
    }
    .manual-form select {
      padding: 0.3rem 0.6rem;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      background: #fff;
    }
    .extract-result { margin-top: 0.75rem; font-size: 0.85rem; color: #2563eb; }
    .message { margin-top: 0.75rem; font-size: 0.85rem; }
    .message.ok { color: #060; }
    .message.error { color: #c00; }
    .meta { color: #888; font-size: 0.8rem; margin-top: 1rem; }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    await this.load();
  }

  override async updated(changed: Map<string, unknown>) {
    if (changed.has('episodeId') && this.episodeId) {
      await this.load();
    }
  }

  private async load() {
    if (!this.episodeId) return;
    this.status = 'loading';
    this.message = '';
    try {
      const ep = await getEpisode(this.episodeId);
      if (!ep) {
        this.status = 'error';
        this.message = 'エピソードが見つかりません';
        return;
      }
      this.episode = ep;
      this.relatedSkillsText = ep.relatedSkills.join('\n');
      this.tagsText = ep.tags.join('\n');
      this.status = 'idle';
    } catch (e) {
      this.status = 'error';
      this.message = String(e);
    }
  }

  private updateField<K extends keyof Episode>(key: K, value: Episode[K]) {
    if (!this.episode) return;
    this.episode = { ...this.episode, [key]: value };
  }

  private async handleSave() {
    if (!this.episode) return;
    this.status = 'saving';
    this.message = '';
    const patch: EpisodeUpdate = {
      title: this.episode.title,
      background: this.episode.background,
      problem: this.episode.problem,
      action: this.episode.action,
      ingenuity: this.episode.ingenuity,
      result: this.episode.result,
      metrics: this.episode.metrics,
      beforeAfter: this.episode.beforeAfter,
      reproducibility: this.episode.reproducibility,
      personalFeeling: this.episode.personalFeeling,
      externalFeedback: this.episode.externalFeedback,
      relatedSkills: this.relatedSkillsText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      tags: this.tagsText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    };
    try {
      const updated = await updateEpisode(this.episode.id, patch);
      this.episode = updated;
      this.relatedSkillsText = updated.relatedSkills.join('\n');
      this.tagsText = updated.tags.join('\n');
      this.status = 'saved';
      this.message = '保存しました';
    } catch (e) {
      this.status = 'error';
      this.message = String(e);
    }
  }

  private handleDeleteRequest() {
    this.confirmDelete = true;
  }

  private handleDeleteCancel() {
    this.confirmDelete = false;
  }

  private async handleDeleteConfirm() {
    if (!this.episode) return;
    this.confirmDelete = false;
    this.status = 'deleting';
    this.message = '';
    try {
      await deleteEpisode(this.episode.id);
      this.dispatchEvent(new CustomEvent('episode-deleted', { bubbles: true, composed: true }));
    } catch (e) {
      this.status = 'error';
      this.message = String(e);
    }
  }

  private toggleManualEvidenceForm() {
    this.showManualEvidenceForm = !this.showManualEvidenceForm;
    if (!this.showManualEvidenceForm) {
      this.resetManualEvidenceForm();
    }
  }

  private resetManualEvidenceForm() {
    this.manualLabel = '';
    this.manualDescription = '';
    this.manualReproducibility = '';
    this.manualEvaluatedContext = '';
    this.manualConfidence = 'medium';
  }

  private async handleCreateManualEvidence() {
    if (!this.episode) return;
    if (!this.manualLabel.trim() || !this.manualDescription.trim()) {
      this.status = 'error';
      this.message = '強みのラベルと説明は必須です';
      return;
    }
    this.status = 'creating-evidence';
    this.message = '';
    try {
      const args: CreateManualEvidenceArgs = {
        strengthLabel: this.manualLabel,
        description: this.manualDescription,
        evidenceEpisodeIds: [this.episode.id],
        confidence: this.manualConfidence,
      };
      if (this.manualReproducibility) args.reproducibility = this.manualReproducibility;
      if (this.manualEvaluatedContext) args.evaluatedContext = this.manualEvaluatedContext;
      await createSkillEvidenceManual(args);
      this.resetManualEvidenceForm();
      this.showManualEvidenceForm = false;
      this.status = 'saved';
      this.message = '手書き Evidence を作成しました。「Evidence」タブで確認してください。';
    } catch (e) {
      this.status = 'error';
      this.message = String(e);
    }
  }

  private handleBack() {
    this.dispatchEvent(new CustomEvent('back', { bubbles: true, composed: true }));
  }

  private renderManualEvidenceForm(busy: boolean) {
    return html`
      <div class="manual-form">
        <h3>手書き Evidence を追加</h3>
        <div class="field">
          <label>強みのラベル（必須・10〜20 文字目安）</label>
          <input
            type="text"
            .value=${this.manualLabel}
            @input=${(e: Event) => {
              this.manualLabel = (e.target as HTMLInputElement).value;
            }}
          />
        </div>
        <div class="field">
          <label>説明（必須・2〜3 文）</label>
          <textarea
            .value=${this.manualDescription}
            @input=${(e: Event) => {
              this.manualDescription = (e.target as HTMLTextAreaElement).value;
            }}
          ></textarea>
        </div>
        <div class="field">
          <label>再現性（任意・どんな状況でも再現できるか）</label>
          <textarea
            .value=${this.manualReproducibility}
            @input=${(e: Event) => {
              this.manualReproducibility = (e.target as HTMLTextAreaElement).value;
            }}
          ></textarea>
        </div>
        <div class="field">
          <label>評価された文脈（任意・この強みが評価された場面）</label>
          <textarea
            .value=${this.manualEvaluatedContext}
            @input=${(e: Event) => {
              this.manualEvaluatedContext = (e.target as HTMLTextAreaElement).value;
            }}
          ></textarea>
        </div>
        <div class="row">
          <label>確信度</label>
          <select
            .value=${this.manualConfidence}
            @change=${(e: Event) => {
              this.manualConfidence = (e.target as HTMLSelectElement).value as Confidence;
            }}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>
        <div class="actions">
          <button
            class="primary"
            @click=${this.handleCreateManualEvidence}
            ?disabled=${busy || !this.manualLabel.trim() || !this.manualDescription.trim()}
          >
            ${this.status === 'creating-evidence' ? '作成中...' : 'Evidence を作成'}
          </button>
        </div>
      </div>
    `;
  }

  private renderText(label: string, key: keyof Episode, multiline = true) {
    if (!this.episode) return html``;
    const value = this.episode[key] as string;
    return html`
      <div class="field">
        <label>${label}</label>
        ${
          multiline
            ? html`<textarea
              .value=${value}
              @input=${(e: Event) => this.updateField(key, (e.target as HTMLTextAreaElement).value as never)}
            ></textarea>`
            : html`<input
              type="text"
              .value=${value}
              @input=${(e: Event) => this.updateField(key, (e.target as HTMLInputElement).value as never)}
            />`
        }
      </div>
    `;
  }

  override render() {
    if (this.status === 'loading') {
      return html`<p>読み込み中...</p>`;
    }
    if (!this.episode) {
      return html`
        <div class="header">
          <button class="back" @click=${this.handleBack}>← 戻る</button>
        </div>
        <p class="message error">${this.message || 'エピソードが見つかりません'}</p>
      `;
    }
    const ep = this.episode;
    const busy =
      this.status === 'saving' || this.status === 'deleting' || this.status === 'creating-evidence';

    return html`
      <div class="header">
        <button class="back" @click=${this.handleBack}>← 戻る</button>
        <h2>エピソード詳細</h2>
      </div>

      ${this.renderText('タイトル', 'title', false)}
      ${this.renderText('背景', 'background')}
      ${this.renderText('課題', 'problem')}
      ${this.renderText('行動', 'action')}
      ${this.renderText('工夫', 'ingenuity')}
      ${this.renderText('結果', 'result')}
      ${this.renderText('指標', 'metrics')}
      ${this.renderText('Before / After', 'beforeAfter')}
      ${this.renderText('再現性', 'reproducibility')}

      <div class="field">
        <label>関連スキル（1 行 1 件）</label>
        <textarea
          .value=${this.relatedSkillsText}
          @input=${(e: Event) => {
            this.relatedSkillsText = (e.target as HTMLTextAreaElement).value;
          }}
        ></textarea>
      </div>

      ${this.renderText('個人的な所感', 'personalFeeling')}
      ${this.renderText('外部からのフィードバック', 'externalFeedback')}

      <div class="field">
        <label>タグ（1 行 1 件）</label>
        <textarea
          .value=${this.tagsText}
          @input=${(e: Event) => {
            this.tagsText = (e.target as HTMLTextAreaElement).value;
          }}
        ></textarea>
      </div>

      <!-- hidden in v0.1 — see ADR-0007. v0.2 で再設計予定 -->
      <!-- remoteLLMAllowed チェックボックス・Evidence 生成ボタンは v0.1 では非表示 -->

      <div class="actions">
        <button class="primary" @click=${this.handleSave} ?disabled=${busy || this.confirmDelete}>保存</button>
        <button
          class="manual-evidence"
          @click=${this.toggleManualEvidenceForm}
          ?disabled=${busy || this.confirmDelete}
        >
          ${this.showManualEvidenceForm ? '手書き Evidence の入力をやめる' : '手書き Evidence を追加'}
        </button>
        ${
          this.confirmDelete
            ? html`
            <button class="danger-confirm" @click=${this.handleDeleteConfirm} ?disabled=${busy}>本当に削除する</button>
            <button class="cancel" @click=${this.handleDeleteCancel} ?disabled=${busy}>キャンセル</button>
          `
            : html`
            <button class="danger" @click=${this.handleDeleteRequest} ?disabled=${busy}>削除</button>
          `
        }
      </div>

      ${this.showManualEvidenceForm ? this.renderManualEvidenceForm(busy) : ''}

      ${
        this.message
          ? html`<p class="message ${this.status === 'error' ? 'error' : 'ok'}">${this.message}</p>`
          : ''
      }

      <p class="meta">
        ID: ${ep.id}<br />
        作成: ${ep.createdAt} / 更新: ${ep.updatedAt}
      </p>
    `;
  }
}

customElements.define('episode-detail-view', EpisodeDetailView);
