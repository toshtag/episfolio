import { describe, expect, it } from 'vitest';
import type { CustomerReference } from '../../src/domain/customer-reference.js';
import { toCustomerReferenceMarkdown } from '../../src/exporters/customer-reference.js';

const baseRef: CustomerReference = {
  id: '01HCUST1',
  customerType: 'b2b',
  customerLabel: '金融業界 IT 部門',
  companyName: '株式会社サンプル',
  period: '2020年4月〜2023年3月',
  industry: '金融',
  companyScale: '社員 1000 名規模',
  counterpartRole: '部長クラス',
  typicalRequests: 'スケジュール短縮要請',
  ageRange: null,
  familyStatus: null,
  residence: null,
  incomeRange: null,
  hardestExperience: '深夜のクレーム電話を 3 時間対応',
  claimContent: '想定外の仕様変更要求',
  responseTime: '平均 2 時間',
  strengthEpisode: 'クレーム対応で培った傾聴力',
  indirectRoleIdea: '営業支援職への転換',
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
};

const b2cRef: CustomerReference = {
  ...baseRef,
  customerType: 'b2c',
  customerLabel: '富裕層個人投資家',
  industry: null,
  companyScale: null,
  counterpartRole: null,
  typicalRequests: null,
  ageRange: '40-50 代',
  familyStatus: '既婚・子持ち',
  residence: '都心部',
  incomeRange: '年収 1000 万以上',
};

describe('toCustomerReferenceMarkdown', () => {
  it('customerLabel をタイトルに含む', () => {
    const md = toCustomerReferenceMarkdown(baseRef);
    expect(md).toContain('# 顧客リファレンス — 金融業界 IT 部門');
  });

  it('customerLabel が null のとき companyName をタイトルに使う', () => {
    const md = toCustomerReferenceMarkdown({ ...baseRef, customerLabel: null });
    expect(md).toContain('# 顧客リファレンス — 株式会社サンプル');
    expect(md).not.toContain('null');
  });

  it('所属企業・担当期間・顧客タイプを含む', () => {
    const md = toCustomerReferenceMarkdown(baseRef);
    expect(md).toContain('**所属企業**: 株式会社サンプル');
    expect(md).toContain('**担当期間**: 2020年4月〜2023年3月');
    expect(md).toContain('**顧客タイプ**: BtoB');
  });

  it('b2c の場合は顧客タイプ表記が BtoC になる', () => {
    const md = toCustomerReferenceMarkdown(b2cRef);
    expect(md).toContain('**顧客タイプ**: BtoC');
  });

  it('b2b 属性ラベル（業界 / 会社規模 / 役職 / 要求）を含む', () => {
    const md = toCustomerReferenceMarkdown(baseRef);
    expect(md).toContain('業界');
    expect(md).toContain('会社規模');
    expect(md).toContain('直接コミュニケーションを取る相手の役職');
    expect(md).toContain('よく受ける要求・リクエスト');
  });

  it('b2b の場合 BtoC 属性ラベル（年齢層 / 家族構成 等）は出力しない', () => {
    const md = toCustomerReferenceMarkdown(baseRef);
    expect(md).not.toContain('年齢層');
    expect(md).not.toContain('家族構成');
    expect(md).not.toContain('居住地');
    expect(md).not.toContain('収入帯');
  });

  it('b2c の場合 BtoC 属性ラベル（年齢層 / 家族構成 等）を含む', () => {
    const md = toCustomerReferenceMarkdown(b2cRef);
    expect(md).toContain('年齢層');
    expect(md).toContain('家族構成');
    expect(md).toContain('居住地');
    expect(md).toContain('収入帯');
  });

  it('b2c の場合 BtoB 属性ラベル（業界 / 会社規模 等）は出力しない', () => {
    const md = toCustomerReferenceMarkdown(b2cRef);
    expect(md).not.toContain('| 業界 |');
    expect(md).not.toContain('| 会社規模 |');
    expect(md).not.toContain('| 直接コミュニケーションを取る相手の役職 |');
  });

  it('クレーム経験セクション（厳しさ / クレーム内容 / 対応時間）を含む', () => {
    const md = toCustomerReferenceMarkdown(baseRef);
    expect(md).toContain('## クレーム経験と対応');
    expect(md).toContain('顧客の厳しさを感じた経験');
    expect(md).toContain('受けたクレームの内容');
    expect(md).toContain('対応にかかった時間');
  });

  it('属性値が記入されていれば本文に出力される', () => {
    const md = toCustomerReferenceMarkdown(baseRef);
    expect(md).toContain('金融');
    expect(md).toContain('社員 1000 名規模');
    expect(md).toContain('部長クラス');
  });

  it('null フィールドは（未記入）を出力する', () => {
    const md = toCustomerReferenceMarkdown({
      ...baseRef,
      hardestExperience: null,
      claimContent: null,
      responseTime: null,
    });
    expect(md).toContain('（未記入）');
  });

  it('強みエピソードセクションを含む', () => {
    const md = toCustomerReferenceMarkdown(baseRef);
    expect(md).toContain('## 強みエピソード');
    expect(md).toContain('クレーム対応で培った傾聴力');
  });

  it('間接的に関わる仕事への転換アイデアセクションを含む', () => {
    const md = toCustomerReferenceMarkdown(baseRef);
    expect(md).toContain('## 間接的に関わる仕事への転換アイデア');
    expect(md).toContain('営業支援職への転換');
  });

  it('strengthEpisode が null のとき（未記入）を出力する', () => {
    const md = toCustomerReferenceMarkdown({ ...baseRef, strengthEpisode: null });
    expect(md).toContain('## 強みエピソード');
    const after = md.slice(md.indexOf('## 強みエピソード'));
    expect(after).toContain('（未記入）');
  });

  it('indirectRoleIdea が null のとき（未記入）を出力する', () => {
    const md = toCustomerReferenceMarkdown({ ...baseRef, indirectRoleIdea: null });
    expect(md).toContain('## 間接的に関わる仕事への転換アイデア');
    const after = md.slice(md.indexOf('## 間接的に関わる仕事への転換アイデア'));
    expect(after).toContain('（未記入）');
  });

  it('セクション順序（属性 → クレーム → 強み → 転換）が正しい', () => {
    const md = toCustomerReferenceMarkdown(baseRef);
    const attrIdx = md.indexOf('## 顧客の属性と傾向分析');
    const claimIdx = md.indexOf('## クレーム経験と対応');
    const strengthIdx = md.indexOf('## 強みエピソード');
    const indirectIdx = md.indexOf('## 間接的に関わる仕事への転換アイデア');
    expect(attrIdx).toBeLessThan(claimIdx);
    expect(claimIdx).toBeLessThan(strengthIdx);
    expect(strengthIdx).toBeLessThan(indirectIdx);
  });
});
