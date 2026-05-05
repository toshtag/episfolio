import type { BossReference, BossReferenceAxisValues } from '@episfolio/kernel';
import { toBossReferenceMarkdown } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createBossReference,
  deleteBossReference,
  listBossReferences,
  updateBossReference,
} from './ipc/boss-references.js';
import { waitForTauri } from './ipc/tauri-ready.js';

const AXIS_LABELS: Array<{ key: keyof BossReferenceAxisValues; left: string; right: string }> = [
  { key: 'logicVsEmotion', left: '論理重視', right: '感性重視' },
  { key: 'resultVsProcess', left: '結果重視', right: 'プロセス重視' },
  { key: 'soloVsTeam', left: '単独プレー重視', right: 'チームワーク重視' },
  { key: 'futureVsTradition', left: '未来重視', right: '伝統重視' },
  { key: 'sharesPrivate', left: 'プライベートを話す', right: 'プライベートを話さない' },
  { key: 'teachingSkill', left: '教えるのが得意', right: '教えるのが苦手' },
  { key: 'listening', left: '話を聞く', right: '話を聞かない' },
  { key: 'busyness', left: '忙しい', right: 'ゆとりがある' },
];

const Q_LABELS: Array<{ key: string; label: string; era: string }> = [
  { key: 'q1', label: '上司はこれまでどんな業界・会社でどんな仕事をしていたか', era: '過去' },
  { key: 'q2', label: '上司とした仕事の中で一番記憶に残っているものは何か', era: '過去' },
  { key: 'q3', label: '上司の厳しさを感じた経験はどんなものか', era: '過去' },
  { key: 'q4', label: '評価面談や1on1・普段の指導で求められた内容は何か', era: '過去' },
  { key: 'q5', label: '評価面談や1on1・普段の指導で叱られた時の言葉は何か', era: '過去' },
  { key: 'q6', label: '上司はどんな仕事をしているか', era: '現在' },
  { key: 'q7', label: '上司は何に対して怒りや不安を覚えるか', era: '現在' },
  { key: 'q8', label: '上司は何をすると評価するか', era: '現在' },
  { key: 'q9', label: '上司が目指していること・したい仕事は何か', era: '未来' },
  { key: 'q10', label: '上司の評価基準は何か（上司の上司は何で評価するのか）', era: '未来' },
  { key: 'q11', label: '上司があなたに求めていることは何か', era: '未来' },
];

const DEFAULT_AXIS: BossReferenceAxisValues = {
  logicVsEmotion: 3,
  resultVsProcess: 3,
  soloVsTeam: 3,
  futureVsTradition: 3,
  sharesPrivate: 3,
  teachingSkill: 3,
  listening: 3,
  busyness: 3,
};

class BossReferenceView extends LitElement {
  static override properties = {
    refs: { state: true },
    selectedId: { state: true },
    editMode: { state: true },
    form: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteId: { state: true },
    showPreview: { state: true },
  };

  declare refs: BossReference[];
  declare selectedId: string;
  declare editMode: boolean;
  declare form: {
    bossName: string;
    companyName: string;
    period: string;
    axisValues: BossReferenceAxisValues;
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
    q6: string;
    q7: string;
    q8: string;
    q9: string;
    q10: string;
    q11: string;
    strengthEpisode: string;
  };
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteId: string;
  declare showPreview: boolean;

  constructor() {
    super();
    this.refs = [];
    this.selectedId = '';
    this.editMode = false;
    this.form = this._emptyForm();
    this.saving = false;
    this.error = '';
    this.confirmDeleteId = '';
    this.showPreview = false;
  }

  _emptyForm() {
    return {
      bossName: '',
      companyName: '',
      period: '',
      axisValues: { ...DEFAULT_AXIS },
      q1: '',
      q2: '',
      q3: '',
      q4: '',
      q5: '',
      q6: '',
      q7: '',
      q8: '',
      q9: '',
      q10: '',
      q11: '',
      strengthEpisode: '',
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
      this.refs = await listBossReferences();
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

  _select(ref: BossReference) {
    this.selectedId = ref.id;
    this.form = {
      bossName: ref.bossName ?? '',
      companyName: ref.companyName,
      period: ref.period,
      axisValues: { ...ref.axisValues },
      q1: ref.q1 ?? '',
      q2: ref.q2 ?? '',
      q3: ref.q3 ?? '',
      q4: ref.q4 ?? '',
      q5: ref.q5 ?? '',
      q6: ref.q6 ?? '',
      q7: ref.q7 ?? '',
      q8: ref.q8 ?? '',
      q9: ref.q9 ?? '',
      q10: ref.q10 ?? '',
      q11: ref.q11 ?? '',
      strengthEpisode: ref.strengthEpisode ?? '',
    };
    this.editMode = false;
    this.showPreview = false;
    this.error = '';
    this.confirmDeleteId = '';
  }

  _setAxis(key: keyof BossReferenceAxisValues, value: number) {
    this.form = { ...this.form, axisValues: { ...this.form.axisValues, [key]: value } };
  }

  async _save() {
    this.saving = true;
    this.error = '';
    try {
      const axisValues = this.form.axisValues;
      const commonArgs = {
        bossName: this.form.bossName.trim() || null,
        companyName: this.form.companyName,
        period: this.form.period,
        axisLogicVsEmotion: axisValues.logicVsEmotion,
        axisResultVsProcess: axisValues.resultVsProcess,
        axisSoloVsTeam: axisValues.soloVsTeam,
        axisFutureVsTradition: axisValues.futureVsTradition,
        axisSharesPrivate: axisValues.sharesPrivate,
        axisTeachingSkill: axisValues.teachingSkill,
        axisListening: axisValues.listening,
        axisBusyness: axisValues.busyness,
        q1: this.form.q1.trim() || null,
        q2: this.form.q2.trim() || null,
        q3: this.form.q3.trim() || null,
        q4: this.form.q4.trim() || null,
        q5: this.form.q5.trim() || null,
        q6: this.form.q6.trim() || null,
        q7: this.form.q7.trim() || null,
        q8: this.form.q8.trim() || null,
        q9: this.form.q9.trim() || null,
        q10: this.form.q10.trim() || null,
        q11: this.form.q11.trim() || null,
        strengthEpisode: this.form.strengthEpisode.trim() || null,
      };

      if (this.selectedId) {
        const patch = {
          bossName: commonArgs.bossName,
          companyName: commonArgs.companyName,
          period: commonArgs.period,
          axisValues,
          q1: commonArgs.q1,
          q2: commonArgs.q2,
          q3: commonArgs.q3,
          q4: commonArgs.q4,
          q5: commonArgs.q5,
          q6: commonArgs.q6,
          q7: commonArgs.q7,
          q8: commonArgs.q8,
          q9: commonArgs.q9,
          q10: commonArgs.q10,
          q11: commonArgs.q11,
          strengthEpisode: commonArgs.strengthEpisode,
        };
        const updated = await updateBossReference(this.selectedId, patch);
        this.refs = this.refs.map((r) => (r.id === updated.id ? updated : r));
        this._select(updated);
      } else {
        const created = await createBossReference(commonArgs);
        this.refs = [...this.refs, created];
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
      await deleteBossReference(id);
      this.refs = this.refs.filter((r) => r.id !== id);
      this.selectedId = '';
      this.editMode = false;
      this.confirmDeleteId = '';
      this.form = this._emptyForm();
    } catch (e) {
      this.error = String(e);
    }
  }

  _copyMarkdown(ref: BossReference) {
    const md = toBossReferenceMarkdown(ref);
    navigator.clipboard.writeText(md).catch(() => {});
  }

  _buildPreviewRef(): BossReference | null {
    if (!this.selectedId) return null;
    const base = this.refs.find((r) => r.id === this.selectedId);
    if (!base) return null;
    return {
      ...base,
      bossName: this.form.bossName.trim() || null,
      companyName: this.form.companyName,
      period: this.form.period,
      axisValues: { ...this.form.axisValues },
      q1: this.form.q1.trim() || null,
      q2: this.form.q2.trim() || null,
      q3: this.form.q3.trim() || null,
      q4: this.form.q4.trim() || null,
      q5: this.form.q5.trim() || null,
      q6: this.form.q6.trim() || null,
      q7: this.form.q7.trim() || null,
      q8: this.form.q8.trim() || null,
      q9: this.form.q9.trim() || null,
      q10: this.form.q10.trim() || null,
      q11: this.form.q11.trim() || null,
      strengthEpisode: this.form.strengthEpisode.trim() || null,
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
    .list-item-company { font-weight: 600; }
    .list-item-period { font-size: 0.8rem; color: #777; }
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
    input[type="text"], textarea {
      width: 100%;
      box-sizing: border-box;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      padding: 0.4rem 0.6rem;
      margin-bottom: 0.8rem;
    }
    textarea { resize: vertical; min-height: 64px; }
    .axis-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
    }
    .axis-left { text-align: right; color: #333; }
    .axis-right { text-align: left; color: #333; }
    input[type="range"] { width: 120px; }
    .q-row { margin-bottom: 1rem; }
    .q-era { font-size: 0.75rem; color: #888; margin-bottom: 0.15rem; }
    .q-label { font-size: 0.85rem; color: #444; margin-bottom: 0.2rem; }
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
    .axis-display {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.3rem;
      font-size: 0.82rem;
    }
  `;

  override render() {
    return html`
      <div class="layout">
        <div class="sidebar">
          <button class="btn-new" @click=${this._startNew}>＋ 新規作成</button>
          ${this.refs.map(
            (ref) => html`
              <div
                class="list-item ${this.selectedId === ref.id ? 'active' : ''}"
                @click=${() => this._select(ref)}
              >
                <div class="list-item-company">${ref.companyName || '（会社名未入力）'}</div>
                ${ref.bossName ? html`<div class="list-item-period">${ref.bossName}</div>` : ''}
                <div class="list-item-period">${ref.period || '（期間未入力）'}</div>
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
    const ref = this.refs.find((r) => r.id === this.selectedId);
    if (!ref) return html``;
    return html`
      <h2>${ref.companyName} ${ref.bossName ? `— ${ref.bossName}` : ''}</h2>
      <div class="btn-row">
        <button class="edit-btn" @click=${() => {
          this.editMode = true;
        }}>編集</button>
        <button class="copy-btn" @click=${() => this._copyMarkdown(ref)}>Markdown コピー</button>
        <button
          class="del-btn"
          @click=${() => this._delete(ref.id)}
        >${this.confirmDeleteId === ref.id ? '本当に削除' : '削除'}</button>
      </div>
      <div class="section">
        <div class="section-title">基本情報</div>
        <div class="detail-field"><span class="detail-label">在籍期間: </span>${ref.period || '（未入力）'}</div>
      </div>
      <div class="section">
        <div class="section-title">タイプ分析チャート</div>
        ${AXIS_LABELS.map(
          ({ key, left, right }) => html`
          <div class="axis-display">
            <span style="text-align:right">${left}</span>
            <span>${'●'.repeat(ref.axisValues[key])}${'○'.repeat(5 - ref.axisValues[key])}</span>
            <span>${right}</span>
          </div>
        `,
        )}
      </div>
      <div class="section">
        <div class="section-title">11の質問</div>
        ${Q_LABELS.map(
          ({ key, label, era }) => html`
          <div class="q-row">
            <div class="q-era">${era}</div>
            <div class="q-label">${label}</div>
            <div class="detail-field">${(ref as Record<string, unknown>)[key] ?? '（未入力）'}</div>
          </div>
        `,
        )}
      </div>
      <div class="section">
        <div class="section-title">強みエピソード</div>
        <div class="detail-field">${ref.strengthEpisode || '（未入力）'}</div>
      </div>
    `;
  }

  _renderForm() {
    return html`
      <h2>${this.selectedId ? '編集' : '新規作成'} — 上司リファレンス</h2>
      <div class="section">
        <div class="section-title">基本情報</div>
        <label>会社名</label>
        <input type="text" .value=${this.form.companyName}
          @input=${(e: Event) => {
            this.form = { ...this.form, companyName: (e.target as HTMLInputElement).value };
          }} />
        <label>上司のお名前（任意・イニシャル可）</label>
        <input type="text" .value=${this.form.bossName}
          @input=${(e: Event) => {
            this.form = { ...this.form, bossName: (e.target as HTMLInputElement).value };
          }} />
        <label>在籍期間</label>
        <input type="text" placeholder="例: 2020年4月〜2023年3月" .value=${this.form.period}
          @input=${(e: Event) => {
            this.form = { ...this.form, period: (e.target as HTMLInputElement).value };
          }} />
      </div>
      <div class="section">
        <div class="section-title">タイプ分析チャート（1 = 左寄り、5 = 右寄り）</div>
        ${AXIS_LABELS.map(
          ({ key, left, right }) => html`
          <div class="axis-row">
            <span class="axis-left">${left}</span>
            <input type="range" min="1" max="5" step="1"
              .value=${String(this.form.axisValues[key])}
              @input=${(e: Event) => this._setAxis(key, Number((e.target as HTMLInputElement).value))} />
            <span class="axis-right">${right}</span>
          </div>
        `,
        )}
      </div>
      <div class="section">
        <div class="section-title">11の質問</div>
        ${Q_LABELS.map(
          ({ key, label, era }) => html`
          <div class="q-row">
            <div class="q-era">${era}</div>
            <div class="q-label">${label}</div>
            <textarea
              .value=${this.form[key as keyof typeof this.form] as string}
              @input=${(e: Event) => {
                this.form = { ...this.form, [key]: (e.target as HTMLTextAreaElement).value };
              }}
            ></textarea>
          </div>
        `,
        )}
      </div>
      <div class="section">
        <div class="section-title">強みエピソード</div>
        <textarea .value=${this.form.strengthEpisode}
          @input=${(e: Event) => {
            this.form = { ...this.form, strengthEpisode: (e.target as HTMLTextAreaElement).value };
          }}></textarea>
      </div>
      ${
        this.showPreview && this._buildPreviewRef()
          ? html`
        <div class="section">
          <div class="section-title">Markdown プレビュー</div>
          <div class="preview-box">${(() => {
            const r = this._buildPreviewRef();
            return r ? toBossReferenceMarkdown(r) : '';
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

customElements.define('boss-reference-view', BossReferenceView);

declare global {
  interface HTMLElementTagNameMap {
    'boss-reference-view': BossReferenceView;
  }
}
