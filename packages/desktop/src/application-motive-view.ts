import type {
  ApplicationMotive,
  IronApplicationMotive,
  JobTarget,
  ResignationMotive,
  StandardApplicationMotive,
} from '@episfolio/kernel';
import { composeApplicationMotiveText } from '@episfolio/kernel';
import { css, html, LitElement } from 'lit';
import {
  createApplicationMotive,
  deleteApplicationMotive,
  listApplicationMotivesByJobTarget,
  updateApplicationMotive,
} from './ipc/application-motives.js';
import { listJobTargets } from './ipc/job-targets.js';
import {
  createResignationMotive,
  deleteResignationMotive,
  listResignationMotives,
  updateResignationMotive,
} from './ipc/resignation-motives.js';

class ApplicationMotiveView extends LitElement {
  static override properties = {
    resignationMotive: { state: true },
    jobTargets: { state: true },
    selectedJobTargetId: { state: true },
    applicationMotive: { state: true },
    activeStyle: { state: true },
    saving: { state: true },
    error: { state: true },
    confirmDeleteType: { state: true },
  };

  declare resignationMotive: ResignationMotive | null;
  declare jobTargets: JobTarget[];
  declare selectedJobTargetId: string;
  declare applicationMotive: ApplicationMotive | null;
  declare activeStyle: 'standard' | 'iron';
  declare saving: boolean;
  declare error: string;
  declare confirmDeleteType: 'resignation' | 'application' | null;

  constructor() {
    super();
    this.resignationMotive = null;
    this.jobTargets = [];
    this.selectedJobTargetId = '';
    this.applicationMotive = null;
    this.activeStyle = 'standard';
    this.saving = false;
    this.error = '';
    this.confirmDeleteType = null;
  }

  static override styles = css`
    :host { display: block; }
    .panel { padding: 2rem; max-width: 760px; }
    h2 { margin: 0 0 0.5rem; font-size: 1.1rem; }
    .warning-badge {
      display: inline-block;
      background: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
      border-radius: 0.25rem;
      padding: 0.3rem 0.7rem;
      font-size: 0.8rem;
      margin-bottom: 1rem;
    }
    .section {
      border: 1px solid #e0e0e0;
      border-radius: 0.4rem;
      padding: 1.2rem;
      margin-bottom: 1.5rem;
    }
    .section-title {
      font-weight: 600;
      font-size: 1rem;
      margin: 0 0 1rem;
    }
    label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 0.2rem; }
    textarea, input[type="url"], input[type="text"] {
      width: 100%;
      box-sizing: border-box;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      padding: 0.4rem 0.6rem;
      resize: vertical;
      margin-bottom: 0.8rem;
    }
    textarea { min-height: 56px; }
    .preview-box {
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 0.3rem;
      padding: 0.7rem;
      font-size: 0.9rem;
      white-space: pre-wrap;
      word-break: break-all;
      margin-bottom: 0.8rem;
      min-height: 3rem;
    }
    select {
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 0.3rem;
      padding: 0.4rem 0.6rem;
      margin-bottom: 1rem;
      width: 100%;
      box-sizing: border-box;
    }
    .style-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.2rem;
    }
    .style-tab {
      flex: 1;
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
      border: 2px solid #ccc;
      border-radius: 0.3rem;
      background: #f5f5f5;
      cursor: pointer;
      text-align: center;
    }
    .style-tab.active {
      border-color: #1a1a1a;
      background: #1a1a1a;
      color: #fff;
    }
    .guide-box {
      background: #f0f4ff;
      border: 1px solid #c8d8ff;
      border-radius: 0.3rem;
      padding: 0.7rem;
      font-size: 0.82rem;
      margin-bottom: 1rem;
      line-height: 1.6;
    }
    .btn-row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
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
      background: #555;
      color: #fff;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    .error { color: #c00; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .empty-note { color: #888; font-size: 0.9rem; }
    .field-group { margin-bottom: 0.5rem; }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    await this.load();
  }

  private async load() {
    const [motives, targets] = await Promise.all([listResignationMotives(), listJobTargets()]);
    this.resignationMotive = motives[0] ?? null;
    this.jobTargets = targets;
    if (this.selectedJobTargetId) {
      await this.loadApplicationMotive();
    }
  }

  private async loadApplicationMotive() {
    if (!this.selectedJobTargetId) {
      this.applicationMotive = null;
      return;
    }
    const list = await listApplicationMotivesByJobTarget(this.selectedJobTargetId);
    this.applicationMotive = list[0] ?? null;
    if (this.applicationMotive) {
      this.activeStyle = this.applicationMotive.style;
    }
  }

  private getResignationField(field: keyof ResignationMotive): string {
    if (!this.resignationMotive) return '';
    const v = this.resignationMotive[field];
    return typeof v === 'string' ? v : '';
  }

  private getStandardField(field: keyof StandardApplicationMotive): string {
    if (!this.applicationMotive || this.applicationMotive.style !== 'standard') return '';
    const v = (this.applicationMotive as StandardApplicationMotive)[field];
    return typeof v === 'string' ? v : '';
  }

  private getIronField(field: keyof IronApplicationMotive): string {
    if (!this.applicationMotive || this.applicationMotive.style !== 'iron') return '';
    const v = (this.applicationMotive as IronApplicationMotive)[field];
    return typeof v === 'string' ? v : '';
  }

  private buildPreview(): string {
    if (!this.applicationMotive) return '';
    return composeApplicationMotiveText(this.applicationMotive);
  }

  private getShadowValue(id: string): string {
    return (
      (
        this.shadowRoot?.getElementById(id) as
          | HTMLTextAreaElement
          | HTMLInputElement
          | HTMLSelectElement
      )?.value ?? ''
    );
  }

  private async handleSaveResignation() {
    this.saving = true;
    this.error = '';
    try {
      const get = (id: string) => this.getShadowValue(id);
      const fields = {
        companyDissatisfaction: get('r-company'),
        jobDissatisfaction: get('r-job'),
        compensationDissatisfaction: get('r-compensation'),
        relationshipDissatisfaction: get('r-relationship'),
        resolutionIntent: get('r-intent'),
        note: get('r-note') || null,
      };
      if (this.resignationMotive) {
        this.resignationMotive = await updateResignationMotive(this.resignationMotive.id, fields);
      } else {
        this.resignationMotive = await createResignationMotive(fields);
      }
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private async handleSaveStandard() {
    if (!this.selectedJobTargetId) return;
    this.saving = true;
    this.error = '';
    try {
      const get = (id: string) => this.getShadowValue(id);
      const companyFuture = get('a-future');
      const contributionAction = get('a-contribution');
      const leveragedExperience = get('a-experience');
      const infoSourceType = (get('a-info-source-type') || null) as
        | import('@episfolio/kernel').InfoSourceType
        | null;
      const infoSourceUrl = get('a-info-source-url');
      const targetDepartment = get('a-target-department');
      const departmentChallenge = get('a-department-challenge');
      const formattedText =
        get('a-formatted') ||
        composeApplicationMotiveText({ companyFuture, contributionAction, leveragedExperience });

      if (this.applicationMotive) {
        this.applicationMotive = await updateApplicationMotive(this.applicationMotive.id, {
          companyFuture,
          contributionAction,
          leveragedExperience,
          infoSourceType,
          infoSourceUrl,
          targetDepartment,
          departmentChallenge,
          formattedText,
        });
      } else {
        this.applicationMotive = await createApplicationMotive({
          jobTargetId: this.selectedJobTargetId,
          motiveStyle: 'standard',
          companyFuture,
          contributionAction,
          leveragedExperience,
          infoSourceType,
          infoSourceUrl,
          targetDepartment,
          departmentChallenge,
          formattedText,
        });
      }
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private async handleSaveIron() {
    if (!this.selectedJobTargetId) return;
    this.saving = true;
    this.error = '';
    try {
      const get = (id: string) => this.getShadowValue(id);
      const positiveInfluence = get('i-positive');
      const beforeAfterFact = get('i-before-after');
      const selfIdentification = (get('i-self-id') || null) as
        | import('@episfolio/kernel').SelfIdentification
        | null;
      const providerSwitchMoment = get('i-switch-moment');
      const valueAnalysisType = (get('i-value-type') || null) as
        | import('@episfolio/kernel').ValueAnalysisType
        | null;
      const valueAnalysisDetail = get('i-value-detail');
      const postJoinActionPlan = get('i-post-join');
      const formattedText = get('a-formatted');

      if (this.applicationMotive) {
        this.applicationMotive = await updateApplicationMotive(this.applicationMotive.id, {
          positiveInfluence,
          beforeAfterFact,
          selfIdentification,
          providerSwitchMoment,
          valueAnalysisType,
          valueAnalysisDetail,
          postJoinActionPlan,
          formattedText,
        });
      } else {
        this.applicationMotive = await createApplicationMotive({
          jobTargetId: this.selectedJobTargetId,
          motiveStyle: 'iron',
          positiveInfluence,
          beforeAfterFact,
          selfIdentification,
          providerSwitchMoment,
          valueAnalysisType,
          valueAnalysisDetail,
          postJoinActionPlan,
          formattedText,
        });
      }
    } catch (e) {
      this.error = String(e);
    } finally {
      this.saving = false;
    }
  }

  private async handleStyleSwitch(newStyle: 'standard' | 'iron') {
    if (this.activeStyle === newStyle) return;
    this.activeStyle = newStyle;
    if (this.applicationMotive && this.applicationMotive.style !== newStyle) {
      this.saving = true;
      this.error = '';
      try {
        this.applicationMotive = await updateApplicationMotive(this.applicationMotive.id, {
          motiveStyle: newStyle,
        } as import('@episfolio/kernel').ApplicationMotiveUpdate);
      } catch (e) {
        this.error = String(e);
      } finally {
        this.saving = false;
      }
    }
  }

  private async handleDeleteResignation() {
    if (!this.resignationMotive) return;
    await deleteResignationMotive(this.resignationMotive.id);
    this.resignationMotive = null;
    this.confirmDeleteType = null;
  }

  private async handleDeleteApplication() {
    if (!this.applicationMotive) return;
    await deleteApplicationMotive(this.applicationMotive.id);
    this.applicationMotive = null;
    this.confirmDeleteType = null;
  }

  private async handleJobTargetChange(e: Event) {
    this.selectedJobTargetId = (e.target as HTMLSelectElement).value;
    await this.loadApplicationMotive();
  }

  private handleCopyFormatted() {
    const text = this.getShadowValue('a-formatted') || this.buildPreview();
    navigator.clipboard.writeText(text).catch(() => {});
  }

  private renderStandardForm() {
    const currentInfoSource =
      this.applicationMotive?.style === 'standard'
        ? ((this.applicationMotive as StandardApplicationMotive).infoSourceType ?? '')
        : '';

    return html`
      <div class="guide-box">
        💡 <strong>情報源の探し方</strong>: 企業の中期経営計画（IR）・社長挨拶（採用ページ / 会社 HP）・メンバー紹介記事から企業が描く未来を調べましょう。
      </div>

      <label for="a-future">企業が描く未来（IR・中期経営計画・社長挨拶から）</label>
      <textarea id="a-future" rows="2">${this.getStandardField('companyFuture')}</textarea>

      <label for="a-contribution">貢献行動（採用情報・中計に書いてある内容）</label>
      <textarea id="a-contribution" rows="2">${this.getStandardField('contributionAction')}</textarea>

      <label for="a-experience">生かす経験（自分の経験から）</label>
      <textarea id="a-experience" rows="2">${this.getStandardField('leveragedExperience')}</textarea>

      <label for="a-info-source-type">情報源の種類（任意）</label>
      <select id="a-info-source-type">
        <option value="" ?selected=${!currentInfoSource}>— 選択してください —</option>
        <option value="recruit_info" ?selected=${currentInfoSource === 'recruit_info'}>採用情報</option>
        <option value="mid_term_plan" ?selected=${currentInfoSource === 'mid_term_plan'}>中期経営計画</option>
        <option value="president_message" ?selected=${currentInfoSource === 'president_message'}>社長挨拶</option>
        <option value="member_profile" ?selected=${currentInfoSource === 'member_profile'}>メンバー紹介</option>
        <option value="other" ?selected=${currentInfoSource === 'other'}>その他</option>
      </select>

      <label for="a-info-source-url">情報源 URL（任意）</label>
      <input type="url" id="a-info-source-url" .value=${this.getStandardField('infoSourceUrl')} />

      <label for="a-target-department">志望部署（任意）</label>
      <input type="text" id="a-target-department" .value=${this.getStandardField('targetDepartment')} />

      <label for="a-department-challenge">部署の課題（任意）</label>
      <textarea id="a-department-challenge" rows="2">${this.getStandardField('departmentChallenge')}</textarea>
    `;
  }

  private renderIronForm() {
    const currentSelfId =
      this.applicationMotive?.style === 'iron'
        ? ((this.applicationMotive as IronApplicationMotive).selfIdentification ?? '')
        : '';
    const currentValueType =
      this.applicationMotive?.style === 'iron'
        ? ((this.applicationMotive as IronApplicationMotive).valueAnalysisType ?? '')
        : '';

    return html`
      <div class="guide-box">
        💡 <strong>鋼の志望動機</strong>: 「ファンだから」ではなく「提供者として貢献できる」という視点で書きます。自分が受けた肯定的影響から始め、客観的事実で裏付けし、入社後の具体的行動で締めましょう。
      </div>

      <label for="i-positive">受けた肯定的影響（その企業の製品・サービス・文化から受けた影響）</label>
      <textarea id="i-positive" rows="3">${this.getIronField('positiveInfluence')}</textarea>

      <label for="i-before-after">Before→After の客観的事実（その影響を受けた前後の変化を数値や行動で）</label>
      <textarea id="i-before-after" rows="3">${this.getIronField('beforeAfterFact')}</textarea>

      <label for="i-self-id">自己認識（今の自分はどの段階？）</label>
      <select id="i-self-id">
        <option value="" ?selected=${!currentSelfId}>— 選択してください —</option>
        <option value="fan" ?selected=${currentSelfId === 'fan'}>ファン（受益者として好き）</option>
        <option value="provider" ?selected=${currentSelfId === 'provider'}>提供者（価値を届ける側に立てる）</option>
        <option value="transitioning" ?selected=${currentSelfId === 'transitioning'}>移行中（ファンから提供者へ転換中）</option>
      </select>

      <label for="i-switch-moment">提供者に切り替わった瞬間・きっかけ</label>
      <textarea id="i-switch-moment" rows="2">${this.getIronField('providerSwitchMoment')}</textarea>

      <label for="i-value-type">価値分析タイプ</label>
      <select id="i-value-type">
        <option value="" ?selected=${!currentValueType}>— 選択してください —</option>
        <option value="productOut" ?selected=${currentValueType === 'productOut'}>プロダクトアウト型（自分の強みを起点）</option>
        <option value="marketIn" ?selected=${currentValueType === 'marketIn'}>マーケットイン型（顧客課題・市場ニーズを起点）</option>
      </select>

      <label for="i-value-detail">価値分析の詳細</label>
      <textarea id="i-value-detail" rows="2">${this.getIronField('valueAnalysisDetail')}</textarea>

      <label for="i-post-join">入社後の具体的行動計画</label>
      <textarea id="i-post-join" rows="2">${this.getIronField('postJoinActionPlan')}</textarea>
    `;
  }

  override render() {
    const preview = this.buildPreview();
    const isStandard = this.activeStyle === 'standard';

    return html`
      <div class="panel">
        <h2>志望動機</h2>

        <!-- 本音の転職理由 -->
        <div class="section">
          <p class="section-title">本音の転職理由</p>
          <span class="warning-badge">⚠ 本音は企業には伝えないでください（書類・面接で使わない）</span>

          <label for="r-company">会社への不満</label>
          <textarea id="r-company" rows="2">${this.getResignationField('companyDissatisfaction')}</textarea>

          <label for="r-job">仕事への不満</label>
          <textarea id="r-job" rows="2">${this.getResignationField('jobDissatisfaction')}</textarea>

          <label for="r-compensation">待遇への不満</label>
          <textarea id="r-compensation" rows="2">${this.getResignationField('compensationDissatisfaction')}</textarea>

          <label for="r-relationship">人間関係への不満</label>
          <textarea id="r-relationship" rows="2">${this.getResignationField('relationshipDissatisfaction')}</textarea>

          <label for="r-intent">次の転職でどう解消したいか</label>
          <textarea id="r-intent" rows="2">${this.getResignationField('resolutionIntent')}</textarea>

          <label for="r-note">メモ（任意）</label>
          <textarea id="r-note" rows="2">${this.getResignationField('note')}</textarea>

          <div class="btn-row">
            <button class="save-btn" @click=${this.handleSaveResignation} ?disabled=${this.saving}>保存</button>
            ${
              this.resignationMotive
                ? this.confirmDeleteType === 'resignation'
                  ? html`
                  <button class="del-btn" @click=${this.handleDeleteResignation}>本当に削除する</button>
                  <button class="save-btn" @click=${() => {
                    this.confirmDeleteType = null;
                  }}>キャンセル</button>
                `
                  : html`<button class="del-btn" @click=${() => {
                      this.confirmDeleteType = 'resignation';
                    }}>削除</button>`
                : ''
            }
          </div>
        </div>

        <!-- 建前の志望動機 -->
        <div class="section">
          <p class="section-title">建前の志望動機（求人ごと）</p>

          <label for="jt-select">求人を選択</label>
          <select id="jt-select" @change=${this.handleJobTargetChange}>
            <option value="">— 選択してください —</option>
            ${this.jobTargets.map(
              (jt) =>
                html`<option value=${jt.id} ?selected=${jt.id === this.selectedJobTargetId}>${jt.companyName} — ${jt.jobTitle}</option>`,
            )}
          </select>

          ${
            this.selectedJobTargetId
              ? html`
            <!-- スタイル切替タブ -->
            <div class="style-tabs">
              <button
                class="style-tab ${isStandard ? 'active' : ''}"
                @click=${() => this.handleStyleSwitch('standard')}
              >方程式（4 ステップ）</button>
              <button
                class="style-tab ${!isStandard ? 'active' : ''}"
                @click=${() => this.handleStyleSwitch('iron')}
              >鋼の志望動機（5 ステップ）</button>
            </div>

            ${isStandard ? this.renderStandardForm() : this.renderIronForm()}

            <label>プレビュー</label>
            <div class="preview-box">${preview || '（フィールドを入力するとプレビューが生成されます）'}</div>

            <label for="a-formatted">最終文（手動編集可）</label>
            <textarea id="a-formatted" rows="4">${this.applicationMotive?.formattedText || preview}</textarea>

            <div class="btn-row">
              <button class="save-btn" @click=${isStandard ? this.handleSaveStandard : this.handleSaveIron} ?disabled=${this.saving}>保存</button>
              <button class="copy-btn" @click=${this.handleCopyFormatted}>コピー</button>
              ${
                this.applicationMotive
                  ? this.confirmDeleteType === 'application'
                    ? html`
                    <button class="del-btn" @click=${this.handleDeleteApplication}>本当に削除する</button>
                    <button class="save-btn" @click=${() => {
                      this.confirmDeleteType = null;
                    }}>キャンセル</button>
                  `
                    : html`<button class="del-btn" @click=${() => {
                        this.confirmDeleteType = 'application';
                      }}>削除</button>`
                  : ''
              }
            </div>
          `
              : html`<p class="empty-note">求人を選択すると入力フォームが表示されます</p>`
          }
        </div>

        ${this.error ? html`<p class="error">${this.error}</p>` : ''}
      </div>
    `;
  }
}

customElements.define('application-motive-view', ApplicationMotiveView);
