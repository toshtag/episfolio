import type { AssetType, WorkAssetSummary } from '@episfolio/kernel';
import { toWorkAssetSummaryMarkdown } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import { waitForTauri } from './ipc/tauri-ready.js';
import {
  createWorkAssetSummary,
  deleteWorkAssetSummary,
  listWorkAssetSummaries,
  updateWorkAssetSummary,
} from './ipc/work-asset-summaries.js';

const ASSET_TYPE_OPTIONS: Array<{ value: AssetType; label: string }> = [
  { value: 'proposal', label: '提案書' },
  { value: 'source-code', label: 'ソースコード' },
  { value: 'slide', label: 'スライド' },
  { value: 'minutes', label: '議事録' },
  { value: 'weekly-report', label: '週次報告' },
  { value: 'comparison-table', label: '比較表' },
  { value: 'document', label: '文書' },
  { value: 'other', label: 'その他' },
];

type FormState = {
  title: string;
  assetType: AssetType;
  jobContext: string;
  period: string;
  role: string;
  summary: string;
  strengthEpisode: string;
  talkingPoints: string;
  maskingNote: string;
};

class WorkAssetSummaryView extends LitElement {
  static override properties = {
    assets: { state: true },
    selectedId: { state: true },
    editMode: { state: true },
    form: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteId: { state: true },
    showPreview: { state: true },
  };

  declare assets: WorkAssetSummary[];
  declare selectedId: string;
  declare editMode: boolean;
  declare form: FormState;
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteId: string;
  declare showPreview: boolean;

  constructor() {
    super();
    this.assets = [];
    this.selectedId = '';
    this.editMode = false;
    this.form = this._emptyForm();
    this.saving = false;
    this.error = '';
    this.confirmDeleteId = '';
    this.showPreview = false;
  }

  _emptyForm(): FormState {
    return {
      title: '',
      assetType: 'document',
      jobContext: '',
      period: '',
      role: '',
      summary: '',
      strengthEpisode: '',
      talkingPoints: '',
      maskingNote: '',
    };
  }

  override connectedCallback() {
    super.connectedCallback();
    void (async () => {
      if (!(await waitForTauri())) return;
      void this._load();
    })();
  }

  async _load() {
    try {
      this.assets = await listWorkAssetSummaries();
    } catch (e) {
      this.error = String(e);
    }
  }

  _startNew() {
    this.selectedId = '';
    this.form = this._emptyForm();
    this.editMode = true;
    this.showPreview = false;
    this.error = '';
    this.confirmDeleteId = '';
  }

  _select(asset: WorkAssetSummary) {
    this.selectedId = asset.id;
    this.form = {
      title: asset.title,
      assetType: asset.assetType,
      jobContext: asset.jobContext ?? '',
      period: asset.period ?? '',
      role: asset.role ?? '',
      summary: asset.summary ?? '',
      strengthEpisode: asset.strengthEpisode ?? '',
      talkingPoints: asset.talkingPoints ?? '',
      maskingNote: asset.maskingNote ?? '',
    };
    this.editMode = false;
    this.showPreview = false;
    this.error = '';
    this.confirmDeleteId = '';
  }

  async _save() {
    this.saving = true;
    this.error = '';
    try {
      const f = this.form;
      const n = (s: string) => s.trim() || null;

      if (this.selectedId) {
        const patch = {
          title: f.title,
          assetType: f.assetType,
          jobContext: n(f.jobContext),
          period: n(f.period),
          role: n(f.role),
          summary: n(f.summary),
          strengthEpisode: n(f.strengthEpisode),
          talkingPoints: n(f.talkingPoints),
          maskingNote: n(f.maskingNote),
        };
        const updated = await updateWorkAssetSummary(this.selectedId, patch);
        this.assets = this.assets.map((a) => (a.id === updated.id ? updated : a));
        this._select(updated);
      } else {
        const created = await createWorkAssetSummary({
          title: f.title,
          assetType: f.assetType,
          jobContext: n(f.jobContext),
          period: n(f.period),
          role: n(f.role),
          summary: n(f.summary),
          strengthEpisode: n(f.strengthEpisode),
          talkingPoints: n(f.talkingPoints),
          maskingNote: n(f.maskingNote),
        });
        this.assets = [...this.assets, created];
        this._select(created);
      }
      this.editMode = false;
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  async _delete(id: string) {
    if (this.confirmDeleteId !== id) {
      this.confirmDeleteId = id;
      return;
    }
    try {
      await deleteWorkAssetSummary(id);
      this.assets = this.assets.filter((a) => a.id !== id);
      this.selectedId = '';
      this.editMode = false;
      this.confirmDeleteId = '';
      this.form = this._emptyForm();
    } catch (e) {
      this.error = String(e);
    }
  }

  _copyMarkdown(asset: WorkAssetSummary) {
    const md = toWorkAssetSummaryMarkdown(asset);
    navigator.clipboard.writeText(md).catch(() => {});
  }

  _buildPreviewAsset(): WorkAssetSummary | null {
    if (!this.selectedId) return null;
    const base = this.assets.find((a) => a.id === this.selectedId);
    if (!base) return null;
    const f = this.form;
    const n = (s: string) => s.trim() || null;
    return {
      ...base,
      title: f.title,
      assetType: f.assetType,
      jobContext: n(f.jobContext),
      period: n(f.period),
      role: n(f.role),
      summary: n(f.summary),
      strengthEpisode: n(f.strengthEpisode),
      talkingPoints: n(f.talkingPoints),
      maskingNote: n(f.maskingNote),
    };
  }

  static override styles = css`
    :host { display: block; }
    .layout { display: flex; gap: 1.5rem; padding: 1.5rem; }
    .sidebar { width: 220px; flex-shrink: 0; }
    .main { flex: 1; min-width: 0; max-width: 720px; }
    .list-item {
      padding: 0.5rem 0.7rem;
      border: 1px solid #e0e0e0;
      border-radius: 0.3rem;
      margin-bottom: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
    }
    .list-item.active { border-color: #1a1a1a; background: #f5f5f5; }
    .list-item-title { font-weight: 600; }
    .list-item-meta { font-size: 0.8rem; color: #777; }
    .type-badge {
      display: inline-block;
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      border-radius: 0.2rem;
      margin-left: 0.4rem;
      background: #e8f0fe;
      color: #1a56db;
      vertical-align: middle;
    }
    .btn-new {
      width: 100%;
      padding: 0.4rem;
      font-size: 0.875rem;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
      margin-bottom: 1rem;
    }
    h2 { margin: 0 0 1rem; font-size: 1.1rem; }
    .section {
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 1.2rem;
      margin-bottom: 1.5rem;
    }
    .section-title { font-weight: 600; font-size: 1rem; margin: 0 0 1rem; }
    label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 0.2rem; }
    input[type="text"], textarea, select {
      width: 100%;
      box-sizing: border-box;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      padding: 0.4rem 0.6rem;
      margin-bottom: 0.8rem;
    }
    textarea { resize: vertical; min-height: 80px; }
    .btn-row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
    button.save-btn {
      padding: 0.4rem 1rem;
      font-size: 0.9rem;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.save-btn:disabled { opacity: 0.5; cursor: default; }
    button.edit-btn {
      padding: 0.4rem 1rem;
      font-size: 0.9rem;
      background: #555;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.del-btn {
      padding: 0.4rem 1rem;
      font-size: 0.9rem;
      background: #c00;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    button.copy-btn {
      padding: 0.4rem 1rem;
      font-size: 0.9rem;
      background: #0066cc;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.8rem; }
    .preview-box {
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 0.3rem;
      padding: 0.7rem;
      font-size: 0.85rem;
      white-space: pre-wrap;
      word-break: break-all;
      min-height: 3rem;
    }
    .detail-field { margin-bottom: 0.5rem; font-size: 0.9rem; }
    .detail-label { font-size: 0.8rem; color: #888; }
    .field-row { margin-bottom: 0.8rem; }
    .field-label { font-size: 0.8rem; color: #555; margin-bottom: 0.15rem; }
  `;

  override render() {
    return html`
      <div class="layout">
        <div class="sidebar">
          <button class="btn-new" @click=${this._startNew}>＋ 新規作成</button>
          ${this.assets.map(
            (asset) => html`
              <div
                class="list-item ${this.selectedId === asset.id ? 'active' : ''}"
                @click=${() => this._select(asset)}
              >
                <div class="list-item-title">
                  ${asset.title || '（タイトル未入力）'}
                  <span class="type-badge">${ASSET_TYPE_OPTIONS.find((o) => o.value === asset.assetType)?.label ?? asset.assetType}</span>
                </div>
                ${asset.period ? html`<div class="list-item-meta">${asset.period}</div>` : ''}
                ${asset.role ? html`<div class="list-item-meta">${asset.role}</div>` : ''}
              </div>
            `,
          )}
        </div>
        <div class="main">
          ${this.error ? html`<div class="error">${this.error}</div>` : ''}
          ${this.editMode ? this._renderForm() : this._renderDetail()}
        </div>
      </div>
    `;
  }

  _renderDetail() {
    if (!this.selectedId) {
      return html`<p style="color:#888;font-size:0.9rem;">左のリストから選択するか、新規作成してください。</p>`;
    }
    const asset = this.assets.find((a) => a.id === this.selectedId);
    if (!asset) return html``;
    const typeLabel =
      ASSET_TYPE_OPTIONS.find((o) => o.value === asset.assetType)?.label ?? asset.assetType;

    return html`
      <h2>
        ${asset.title || '（タイトル未入力）'}
        <span class="type-badge">${typeLabel}</span>
      </h2>
      <div class="btn-row">
        <button class="edit-btn" @click=${() => {
          this.editMode = true;
        }}>編集</button>
        <button class="copy-btn" @click=${() => this._copyMarkdown(asset)}>Markdown コピー</button>
        <button class="del-btn" @click=${() => this._delete(asset.id)}>
          ${this.confirmDeleteId === asset.id ? '本当に削除' : '削除'}
        </button>
      </div>
      <div class="section">
        <div class="section-title">基本情報</div>
        <div class="detail-field"><span class="detail-label">資料種別: </span>${typeLabel}</div>
        ${asset.jobContext ? html`<div class="detail-field"><span class="detail-label">業務コンテキスト: </span>${asset.jobContext}</div>` : ''}
        ${asset.period ? html`<div class="detail-field"><span class="detail-label">作成期間: </span>${asset.period}</div>` : ''}
        ${asset.role ? html`<div class="detail-field"><span class="detail-label">担当役割: </span>${asset.role}</div>` : ''}
      </div>
      <div class="section">
        <div class="section-title">概要</div>
        <div class="detail-field">${asset.summary || '（未入力）'}</div>
      </div>
      <div class="section">
        <div class="section-title">強みエピソード</div>
        <div class="detail-field">${asset.strengthEpisode || '（未入力）'}</div>
      </div>
      <div class="section">
        <div class="section-title">面接での話すポイント</div>
        <div class="detail-field">${asset.talkingPoints || '（未入力）'}</div>
      </div>
      <div class="section">
        <div class="section-title">機微情報のマスク方針</div>
        <div class="detail-field">${asset.maskingNote || '（未入力）'}</div>
      </div>
    `;
  }

  _renderForm() {
    return html`
      <h2>${this.selectedId ? '編集' : '新規作成'} — 仕事資料</h2>
      <div class="section">
        <div class="section-title">基本情報</div>
        <label>タイトル</label>
        <input type="text" placeholder="例: 新規顧客向け提案書" .value=${this.form.title}
          @input=${(e: Event) => {
            this.form = { ...this.form, title: (e.target as HTMLInputElement).value };
          }} />
        <label>資料種別</label>
        <select .value=${this.form.assetType}
          @change=${(e: Event) => {
            this.form = {
              ...this.form,
              assetType: (e.target as HTMLSelectElement).value as AssetType,
            };
          }}>
          ${ASSET_TYPE_OPTIONS.map(
            ({ value, label }) => html`
              <option value=${value} ?selected=${this.form.assetType === value}>${label}</option>
            `,
          )}
        </select>
        <label>業務コンテキスト（任意）</label>
        <input type="text" placeholder="例: SaaS 営業部門向け提案フェーズ" .value=${this.form.jobContext}
          @input=${(e: Event) => {
            this.form = { ...this.form, jobContext: (e.target as HTMLInputElement).value };
          }} />
        <label>作成期間（任意）</label>
        <input type="text" placeholder="例: 2023年10月〜2023年12月" .value=${this.form.period}
          @input=${(e: Event) => {
            this.form = { ...this.form, period: (e.target as HTMLInputElement).value };
          }} />
        <label>担当役割（任意）</label>
        <input type="text" placeholder="例: 提案リード" .value=${this.form.role}
          @input=${(e: Event) => {
            this.form = { ...this.form, role: (e.target as HTMLInputElement).value };
          }} />
      </div>
      <div class="section">
        <div class="section-title">概要</div>
        <textarea placeholder="この資料の内容・目的を簡潔に" .value=${this.form.summary}
          @input=${(e: Event) => {
            this.form = { ...this.form, summary: (e.target as HTMLTextAreaElement).value };
          }}></textarea>
      </div>
      <div class="section">
        <div class="section-title">強みエピソード</div>
        <textarea placeholder="この資料を作成・活用して得た成果や学び" .value=${this.form.strengthEpisode}
          @input=${(e: Event) => {
            this.form = { ...this.form, strengthEpisode: (e.target as HTMLTextAreaElement).value };
          }}></textarea>
      </div>
      <div class="section">
        <div class="section-title">面接での話すポイント</div>
        <textarea placeholder="面接でこの資料について話す際のポイント" .value=${this.form.talkingPoints}
          @input=${(e: Event) => {
            this.form = { ...this.form, talkingPoints: (e.target as HTMLTextAreaElement).value };
          }}></textarea>
      </div>
      <div class="section">
        <div class="section-title">機微情報のマスク方針</div>
        <textarea placeholder="例: 顧客名・金額は伏字。社内ロゴは差し替え" .value=${this.form.maskingNote}
          @input=${(e: Event) => {
            this.form = { ...this.form, maskingNote: (e.target as HTMLTextAreaElement).value };
          }}></textarea>
      </div>
      ${
        this.showPreview && this._buildPreviewAsset()
          ? html`
        <div class="section">
          <div class="section-title">Markdown プレビュー</div>
          <div class="preview-box">${(() => {
            const a = this._buildPreviewAsset();
            return a ? toWorkAssetSummaryMarkdown(a) : '';
          })()}</div>
        </div>
      `
          : ''
      }
      <div class="btn-row">
        <button class="save-btn" ?disabled=${this.saving} @click=${this._save}>
          ${this.saving ? '保存中…' : '保存'}
        </button>
        ${
          this.selectedId
            ? html`
          <button class="edit-btn" @click=${() => {
            this.editMode = false;
            this.showPreview = false;
          }}>キャンセル</button>
          <button class="copy-btn" @click=${() => {
            this.showPreview = !this.showPreview;
          }}>
            ${this.showPreview ? 'プレビュー非表示' : 'Markdown プレビュー'}
          </button>
        `
            : ''
        }
      </div>
    `;
  }
}

customElements.define('work-asset-summary-view', WorkAssetSummaryView);

declare global {
  interface HTMLElementTagNameMap {
    'work-asset-summary-view': WorkAssetSummaryView;
  }
}
