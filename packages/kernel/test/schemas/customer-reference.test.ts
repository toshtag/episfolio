import { describe, expect, it } from 'vitest';
import {
  CustomerReferenceSchema,
  CustomerReferenceUpdateSchema,
  CustomerTypeSchema,
} from '../../src/schemas/customer-reference.js';

const baseRef = {
  id: '01HCUST1',
  customerType: 'b2b' as const,
  customerLabel: '金融業界 IT 部門',
  companyName: '株式会社サンプル',
  period: '2020年4月〜2023年3月',
  industry: null,
  companyScale: null,
  counterpartRole: null,
  typicalRequests: null,
  ageRange: null,
  familyStatus: null,
  residence: null,
  incomeRange: null,
  hardestExperience: null,
  claimContent: null,
  responseTime: null,
  strengthEpisode: null,
  indirectRoleIdea: null,
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
};

describe('CustomerTypeSchema', () => {
  it('b2b を受理', () => {
    expect(CustomerTypeSchema.safeParse('b2b').success).toBe(true);
  });

  it('b2c を受理', () => {
    expect(CustomerTypeSchema.safeParse('b2c').success).toBe(true);
  });

  it('未知の値を拒否', () => {
    expect(CustomerTypeSchema.safeParse('b2g').success).toBe(false);
  });

  it('空文字を拒否', () => {
    expect(CustomerTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('CustomerReferenceSchema', () => {
  it('正常系（nullable フィールドあり）', () => {
    expect(CustomerReferenceSchema.safeParse(baseRef).success).toBe(true);
  });

  it('customerLabel が null でも受理', () => {
    expect(CustomerReferenceSchema.safeParse({ ...baseRef, customerLabel: null }).success).toBe(
      true,
    );
  });

  it('customerType が b2c でも受理', () => {
    expect(CustomerReferenceSchema.safeParse({ ...baseRef, customerType: 'b2c' }).success).toBe(
      true,
    );
  });

  it('全フィールドに値があっても受理', () => {
    const allFilled = {
      ...baseRef,
      industry: '金融',
      companyScale: '社員 1000 名規模',
      counterpartRole: '部長クラス',
      typicalRequests: 'スケジュール短縮要請',
      ageRange: '40-50 代',
      familyStatus: '既婚・子持ち',
      residence: '都心部',
      incomeRange: '年収 1000 万以上',
      hardestExperience: '深夜のクレーム電話を 3 時間対応',
      claimContent: '想定外の仕様変更要求',
      responseTime: '平均 2 時間',
      strengthEpisode: 'クレーム対応で培った傾聴力',
      indirectRoleIdea: '営業支援職への転換',
    };
    expect(CustomerReferenceSchema.safeParse(allFilled).success).toBe(true);
  });

  it('customerType が未知の値だと拒否', () => {
    expect(CustomerReferenceSchema.safeParse({ ...baseRef, customerType: 'unknown' }).success).toBe(
      false,
    );
  });

  it('companyName 空文字を拒否', () => {
    expect(CustomerReferenceSchema.safeParse({ ...baseRef, companyName: '' }).success).toBe(false);
  });

  it('period 空文字を拒否', () => {
    expect(CustomerReferenceSchema.safeParse({ ...baseRef, period: '' }).success).toBe(false);
  });

  it('id 空文字を拒否', () => {
    expect(CustomerReferenceSchema.safeParse({ ...baseRef, id: '' }).success).toBe(false);
  });

  it('createdAt 欠如を拒否', () => {
    const { createdAt: _omit, ...withoutCreatedAt } = baseRef;
    expect(CustomerReferenceSchema.safeParse(withoutCreatedAt).success).toBe(false);
  });
});

describe('CustomerReferenceUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(CustomerReferenceUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('companyName のみ更新できる', () => {
    expect(CustomerReferenceUpdateSchema.safeParse({ companyName: '新会社名' }).success).toBe(true);
  });

  it('customerType のみ b2c に切替できる', () => {
    expect(CustomerReferenceUpdateSchema.safeParse({ customerType: 'b2c' }).success).toBe(true);
  });

  it('industry を null で更新できる', () => {
    expect(CustomerReferenceUpdateSchema.safeParse({ industry: null }).success).toBe(true);
  });

  it('hardestExperience を文字列で更新できる', () => {
    expect(CustomerReferenceUpdateSchema.safeParse({ hardestExperience: '深夜対応' }).success).toBe(
      true,
    );
  });

  it('strengthEpisode と indirectRoleIdea を同時に更新できる', () => {
    expect(
      CustomerReferenceUpdateSchema.safeParse({
        strengthEpisode: '傾聴力',
        indirectRoleIdea: '営業支援',
      }).success,
    ).toBe(true);
  });

  it('companyName 空文字を拒否', () => {
    expect(CustomerReferenceUpdateSchema.safeParse({ companyName: '' }).success).toBe(false);
  });

  it('id を含めても無視される（pick されていない）', () => {
    const result = CustomerReferenceUpdateSchema.safeParse({ id: 'should-be-ignored' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });
});
