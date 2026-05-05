import type { CustomerReference } from '@episfolio/kernel';
import { toCustomerReferenceMarkdown } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createCustomerReference,
  deleteCustomerReference,
  listCustomerReferences,
  updateCustomerReference,
} from './ipc/customer-references.js';
import { waitForTauri } from './ipc/tauri-ready.js';

type CustomerType = 'b2b' | 'b2c';

const B2B_FIELD_LABELS: Array<{ key: string; label: string }> = [
  { key: 'industry', label: '業界' },
  { key: 'companyScale', label: '会社規模' },
  { key: 'counterpartRole', label: '直接コミュニケーションを取る相手の役職' },
  { key: 'typicalRequests', label: 'よく受ける要求・リクエスト' },
];

const B2C_FIELD_LABELS: Array<{ key: string; label: string }> = [
  { key: 'ageRange', label: '年齢層' },
  { key: 'familyStatus', label: '家族構成' },
  { key: 'residence', label: '居住地' },
  { key: 'incomeRange', label: '収入帯' },
];

const EXPERIENCE_FIELD_LABELS: Array<{ key: string; label: string }> = [
  { key: 'hardestExperience', label: '顧客の厳しさを感じた経験' },
  { key: 'claimContent', label: '受けたクレームの内容' },
  { key: 'responseTime', label: '対応にかかった時間' },
];

type FormState = {
  customerType: CustomerType;
  customerLabel: string;
  companyName: string;
  period: string;
  industry: string;
  companyScale: string;
  counterpartRole: string;
  typicalRequests: string;
  ageRange: string;
  familyStatus: string;
  residence: string;
  incomeRange: string;
  hardestExperience: string;
  claimContent: string;
  responseTime: string;
  strengthEpisode: string;
  indirectRoleIdea: string;
};

class CustomerReferenceView extends LitElement {
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

  declare refs: CustomerReference[];
  declare selectedId: string;
  declare editMode: boolean;
  declare form: FormState;
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

  _emptyForm(): FormState {
    return {
      customerType: 'b2b',
      customerLabel: '',
      companyName: '',
      period: '',
      industry: '',
      companyScale: '',
      counterpartRole: '',
      typicalRequests: '',
      ageRange: '',
      familyStatus: '',
      residence: '',
      incomeRange: '',
      hardestExperience: '',
      claimContent: '',
      responseTime: '',
      strengthEpisode: '',
      indirectRoleIdea: '',
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
      this.refs = await listCustomerReferences();
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

  _select(ref: CustomerReference) {
    this.selectedId = ref.id;
    this.form = {
      customerType: ref.customerType,
      customerLabel: ref.customerLabel ?? '',
      companyName: ref.companyName,
      period: ref.period,
      industry: ref.industry ?? '',
      companyScale: ref.companyScale ?? '',
      counterpartRole: ref.counterpartRole ?? '',
      typicalRequests: ref.typicalRequests ?? '',
      ageRange: ref.ageRange ?? '',
      familyStatus: ref.familyStatus ?? '',
      residence: ref.residence ?? '',
      incomeRange: ref.incomeRange ?? '',
      hardestExperience: ref.hardestExperience ?? '',
      claimContent: ref.claimContent ?? '',
      responseTime: ref.responseTime ?? '',
      strengthEpisode: ref.strengthEpisode ?? '',
      indirectRoleIdea: ref.indirectRoleIdea ?? '',
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
      const nullableStr = (s: string) => s.trim() || null;

      if (this.selectedId) {
        const patch = {
          customerType: f.customerType,
          customerLabel: nullableStr(f.customerLabel),
          companyName: f.companyName,
          period: f.period,
          industry: nullableStr(f.industry),
          companyScale: nullableStr(f.companyScale),
          counterpartRole: nullableStr(f.counterpartRole),
          typicalRequests: nullableStr(f.typicalRequests),
          ageRange: nullableStr(f.ageRange),
          familyStatus: nullableStr(f.familyStatus),
          residence: nullableStr(f.residence),
          incomeRange: nullableStr(f.incomeRange),
          hardestExperience: nullableStr(f.hardestExperience),
          claimContent: nullableStr(f.claimContent),
          responseTime: nullableStr(f.responseTime),
          strengthEpisode: nullableStr(f.strengthEpisode),
          indirectRoleIdea: nullableStr(f.indirectRoleIdea),
        };
        const updated = await updateCustomerReference(this.selectedId, patch);
        this.refs = this.refs.map((r) => (r.id === updated.id ? updated : r));
        this._select(updated);
      } else {
        const created = await createCustomerReference({
          customerType: f.customerType,
          customerLabel: nullableStr(f.customerLabel),
          companyName: f.companyName,
          period: f.period,
          industry: nullableStr(f.industry),
          companyScale: nullableStr(f.companyScale),
          counterpartRole: nullableStr(f.counterpartRole),
          typicalRequests: nullableStr(f.typicalRequests),
          ageRange: nullableStr(f.ageRange),
          familyStatus: nullableStr(f.familyStatus),
          residence: nullableStr(f.residence),
          incomeRange: nullableStr(f.incomeRange),
          hardestExperience: nullableStr(f.hardestExperience),
          claimContent: nullableStr(f.claimContent),
          responseTime: nullableStr(f.responseTime),
          strengthEpisode: nullableStr(f.strengthEpisode),
          indirectRoleIdea: nullableStr(f.indirectRoleIdea),
        });
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
      await deleteCustomerReference(id);
      this.refs = this.refs.filter((r) => r.id !== id);
      this.selectedId = '';
      this.editMode = false;
      this.confirmDeleteId = '';
      this.form = this._emptyForm();
    } catch (e) {
      this.error = String(e);
    }
  }

  _copyMarkdown(ref: CustomerReference) {
    const md = toCustomerReferenceMarkdown(ref);
    navigator.clipboard.writeText(md).catch(() => {});
  }

  _buildPreviewRef(): CustomerReference | null {
    if (!this.selectedId) return null;
    const base = this.refs.find((r) => r.id === this.selectedId);
    if (!base) return null;
    const f = this.form;
    const n = (s: string) => s.trim() || null;
    return {
      ...base,
      customerType: f.customerType,
      customerLabel: n(f.customerLabel),
      companyName: f.companyName,
      period: f.period,
      industry: n(f.industry),
      companyScale: n(f.companyScale),
      counterpartRole: n(f.counterpartRole),
      typicalRequests: n(f.typicalRequests),
      ageRange: n(f.ageRange),
      familyStatus: n(f.familyStatus),
      residence: n(f.residence),
      incomeRange: n(f.incomeRange),
      hardestExperience: n(f.hardestExperience),
      claimContent: n(f.claimContent),
      responseTime: n(f.responseTime),
      strengthEpisode: n(f.strengthEpisode),
      indirectRoleIdea: n(f.indirectRoleIdea),
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
    .list-item-meta { font-size: 0.8rem; color: #777; }
    .type-badge {
      display: inline-block;
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      border-radius: 0.2rem;
      margin-left: 0.4rem;
      vertical-align: middle;
    }
    .type-badge.b2b { background: #e8f0fe; color: #1a56db; }
    .type-badge.b2c { background: #fef3c7; color: #92400e; }
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
    textarea { resize: vertical; min-height: 64px; }
    .radio-group { display: flex; gap: 1.5rem; margin-bottom: 0.8rem; }
    .radio-group label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; color: #333; margin: 0; }
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
          ${this.refs.map(
            (ref) => html`
              <div
                class="list-item ${this.selectedId === ref.id ? 'active' : ''}"
                @click=${() => this._select(ref)}
              >
                <div class="list-item-company">
                  ${ref.companyName || '（会社名未入力）'}
                  <span class="type-badge ${ref.customerType}">${ref.customerType === 'b2b' ? 'BtoB' : 'BtoC'}</span>
                </div>
                ${ref.customerLabel ? html`<div class="list-item-meta">${ref.customerLabel}</div>` : ''}
                <div class="list-item-meta">${ref.period || '（期間未入力）'}</div>
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

    const typeLabel = ref.customerType === 'b2b' ? 'BtoB' : 'BtoC';
    const attrLabels = ref.customerType === 'b2b' ? B2B_FIELD_LABELS : B2C_FIELD_LABELS;

    return html`
      <h2>
        ${ref.companyName}
        ${ref.customerLabel ? ` — ${ref.customerLabel}` : ''}
        <span class="type-badge ${ref.customerType}">${typeLabel}</span>
      </h2>
      <div class="btn-row">
        <button class="edit-btn" @click=${() => {
          this.editMode = true;
        }}>編集</button>
        <button class="copy-btn" @click=${() => this._copyMarkdown(ref)}>Markdown コピー</button>
        <button class="del-btn" @click=${() => this._delete(ref.id)}>
          ${this.confirmDeleteId === ref.id ? '本当に削除' : '削除'}
        </button>
      </div>
      <div class="section">
        <div class="section-title">基本情報</div>
        <div class="detail-field"><span class="detail-label">担当期間: </span>${ref.period || '（未入力）'}</div>
        <div class="detail-field"><span class="detail-label">顧客タイプ: </span>${typeLabel}</div>
      </div>
      <div class="section">
        <div class="section-title">顧客の属性と傾向分析（${typeLabel}）</div>
        ${attrLabels.map(
          ({ key, label }) => html`
          <div class="field-row">
            <div class="field-label">${label}</div>
            <div class="detail-field">${(ref as Record<string, unknown>)[key] ?? '（未入力）'}</div>
          </div>
        `,
        )}
      </div>
      <div class="section">
        <div class="section-title">クレーム経験と対応</div>
        ${EXPERIENCE_FIELD_LABELS.map(
          ({ key, label }) => html`
          <div class="field-row">
            <div class="field-label">${label}</div>
            <div class="detail-field">${(ref as Record<string, unknown>)[key] ?? '（未入力）'}</div>
          </div>
        `,
        )}
      </div>
      <div class="section">
        <div class="section-title">強みエピソード</div>
        <div class="detail-field">${ref.strengthEpisode || '（未入力）'}</div>
      </div>
      <div class="section">
        <div class="section-title">間接的に関わる仕事への転換アイデア</div>
        <div class="detail-field">${ref.indirectRoleIdea || '（未入力）'}</div>
      </div>
    `;
  }

  _renderForm() {
    const isB2b = this.form.customerType === 'b2b';
    const attrLabels = isB2b ? B2B_FIELD_LABELS : B2C_FIELD_LABELS;

    return html`
      <h2>${this.selectedId ? '編集' : '新規作成'} — 顧客リファレンス</h2>
      <div class="section">
        <div class="section-title">基本情報</div>
        <label>顧客タイプ</label>
        <div class="radio-group">
          <label>
            <input type="radio" name="customerType" value="b2b"
              ?checked=${this.form.customerType === 'b2b'}
              @change=${() => {
                this.form = { ...this.form, customerType: 'b2b' };
              }} />
            BtoB（法人向け）
          </label>
          <label>
            <input type="radio" name="customerType" value="b2c"
              ?checked=${this.form.customerType === 'b2c'}
              @change=${() => {
                this.form = { ...this.form, customerType: 'b2c' };
              }} />
            BtoC（個人向け）
          </label>
        </div>
        <label>所属企業名</label>
        <input type="text" .value=${this.form.companyName}
          @input=${(e: Event) => {
            this.form = { ...this.form, companyName: (e.target as HTMLInputElement).value };
          }} />
        <label>顧客のラベル（任意・分類名など）</label>
        <input type="text" placeholder="例: 製造業 中堅企業担当、30代主婦層" .value=${this.form.customerLabel}
          @input=${(e: Event) => {
            this.form = { ...this.form, customerLabel: (e.target as HTMLInputElement).value };
          }} />
        <label>担当期間</label>
        <input type="text" placeholder="例: 2020年4月〜2023年3月" .value=${this.form.period}
          @input=${(e: Event) => {
            this.form = { ...this.form, period: (e.target as HTMLInputElement).value };
          }} />
      </div>
      <div class="section">
        <div class="section-title">顧客の属性と傾向分析（${isB2b ? 'BtoB' : 'BtoC'}）</div>
        ${attrLabels.map(
          ({ key, label }) => html`
          <label>${label}</label>
          <textarea
            .value=${this.form[key as keyof FormState] as string}
            @input=${(e: Event) => {
              this.form = { ...this.form, [key]: (e.target as HTMLTextAreaElement).value };
            }}
          ></textarea>
        `,
        )}
      </div>
      <div class="section">
        <div class="section-title">クレーム経験と対応</div>
        ${EXPERIENCE_FIELD_LABELS.map(
          ({ key, label }) => html`
          <label>${label}</label>
          <textarea
            .value=${this.form[key as keyof FormState] as string}
            @input=${(e: Event) => {
              this.form = { ...this.form, [key]: (e.target as HTMLTextAreaElement).value };
            }}
          ></textarea>
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
      <div class="section">
        <div class="section-title">間接的に関わる仕事への転換アイデア</div>
        <textarea .value=${this.form.indirectRoleIdea}
          @input=${(e: Event) => {
            this.form = { ...this.form, indirectRoleIdea: (e.target as HTMLTextAreaElement).value };
          }}></textarea>
      </div>
      ${
        this.showPreview && this._buildPreviewRef()
          ? html`
        <div class="section">
          <div class="section-title">Markdown プレビュー</div>
          <div class="preview-box">${(() => {
            const r = this._buildPreviewRef();
            return r ? toCustomerReferenceMarkdown(r) : '';
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

customElements.define('customer-reference-view', CustomerReferenceView);

declare global {
  interface HTMLElementTagNameMap {
    'customer-reference-view': CustomerReferenceView;
  }
}
