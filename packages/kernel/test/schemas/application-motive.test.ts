import { describe, expect, it } from 'vitest';
import {
  ApplicationMotiveSchema,
  ApplicationMotiveUpdateSchema,
  IronApplicationMotiveSchema,
  StandardApplicationMotiveSchema,
} from '../../src/schemas/application-motive.js';

const baseStandard = {
  id: '01APPMO01',
  jobTargetId: '01JOBTG1',
  style: 'standard' as const,
  companyFuture: 'DX 推進による業界変革',
  contributionAction: 'プロダクト開発の高速化',
  leveragedExperience: 'スタートアップでの新規事業立ち上げ経験',
  infoSourceType: null,
  infoSourceUrl: '',
  targetDepartment: '',
  departmentChallenge: '',
  formattedText:
    '私はDX 推進による業界変革を達成するために、貴社を志望しています。具体的には、プロダクト開発の高速化に貢献すべく、私の経験のスタートアップでの新規事業立ち上げ経験を生かしてまいります。',
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
};

const baseIron = {
  id: '01APPMO02',
  jobTargetId: '01JOBTG1',
  style: 'iron' as const,
  positiveInfluence: '顧客の行動変容に立ち会えた瞬間',
  beforeAfterFact: '導入前 CSV 手作業 → 導入後 90% 自動化',
  selfIdentification: 'provider' as const,
  providerSwitchMoment: 'OSS コントリビュートで「使われる側」の視点を得た',
  valueAnalysisType: 'marketIn' as const,
  valueAnalysisDetail: '顧客課題起点でプロダクトを設計',
  postJoinActionPlan: '入社 3 ヶ月で既存顧客ヒアリング 20 社実施',
  formattedText: '',
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
};

describe('StandardApplicationMotiveSchema', () => {
  it('正常系', () => {
    expect(StandardApplicationMotiveSchema.safeParse(baseStandard).success).toBe(true);
  });

  it('文字列フィールドは空文字を許可', () => {
    expect(
      StandardApplicationMotiveSchema.safeParse({
        ...baseStandard,
        companyFuture: '',
        contributionAction: '',
        leveragedExperience: '',
        formattedText: '',
      }).success,
    ).toBe(true);
  });

  it('infoSourceType に有効な enum 値を受理', () => {
    for (const v of [
      'recruit_info',
      'mid_term_plan',
      'president_message',
      'member_profile',
      'other',
    ] as const) {
      expect(
        StandardApplicationMotiveSchema.safeParse({ ...baseStandard, infoSourceType: v }).success,
      ).toBe(true);
    }
  });

  it('infoSourceType に無効な値を拒否', () => {
    expect(
      StandardApplicationMotiveSchema.safeParse({
        ...baseStandard,
        infoSourceType: 'invalid_value',
      }).success,
    ).toBe(false);
  });

  it('id 空文字を拒否', () => {
    expect(StandardApplicationMotiveSchema.safeParse({ ...baseStandard, id: '' }).success).toBe(
      false,
    );
  });

  it('jobTargetId 空文字を拒否', () => {
    expect(
      StandardApplicationMotiveSchema.safeParse({ ...baseStandard, jobTargetId: '' }).success,
    ).toBe(false);
  });

  it('createdAt 空文字を拒否', () => {
    expect(
      StandardApplicationMotiveSchema.safeParse({ ...baseStandard, createdAt: '' }).success,
    ).toBe(false);
  });

  it('updatedAt 空文字を拒否', () => {
    expect(
      StandardApplicationMotiveSchema.safeParse({ ...baseStandard, updatedAt: '' }).success,
    ).toBe(false);
  });

  it('jobTargetId が null を拒否（FK 必須）', () => {
    expect(
      StandardApplicationMotiveSchema.safeParse({ ...baseStandard, jobTargetId: null }).success,
    ).toBe(false);
  });

  it('style が iron のデータを拒否', () => {
    expect(StandardApplicationMotiveSchema.safeParse(baseIron).success).toBe(false);
  });
});

describe('IronApplicationMotiveSchema', () => {
  it('正常系', () => {
    expect(IronApplicationMotiveSchema.safeParse(baseIron).success).toBe(true);
  });

  it('文字列フィールドは空文字を許可', () => {
    expect(
      IronApplicationMotiveSchema.safeParse({
        ...baseIron,
        positiveInfluence: '',
        beforeAfterFact: '',
        providerSwitchMoment: '',
        valueAnalysisDetail: '',
        postJoinActionPlan: '',
      }).success,
    ).toBe(true);
  });

  it('selfIdentification に有効な enum 値を受理', () => {
    for (const v of ['fan', 'provider', 'transitioning'] as const) {
      expect(
        IronApplicationMotiveSchema.safeParse({ ...baseIron, selfIdentification: v }).success,
      ).toBe(true);
    }
  });

  it('selfIdentification に無効な値を拒否', () => {
    expect(
      IronApplicationMotiveSchema.safeParse({ ...baseIron, selfIdentification: 'unknown' }).success,
    ).toBe(false);
  });

  it('valueAnalysisType に有効な enum 値を受理', () => {
    for (const v of ['productOut', 'marketIn'] as const) {
      expect(
        IronApplicationMotiveSchema.safeParse({ ...baseIron, valueAnalysisType: v }).success,
      ).toBe(true);
    }
  });

  it('valueAnalysisType に無効な値を拒否', () => {
    expect(
      IronApplicationMotiveSchema.safeParse({ ...baseIron, valueAnalysisType: 'hybrid' }).success,
    ).toBe(false);
  });

  it('id 空文字を拒否', () => {
    expect(IronApplicationMotiveSchema.safeParse({ ...baseIron, id: '' }).success).toBe(false);
  });

  it('style が standard のデータを拒否', () => {
    expect(IronApplicationMotiveSchema.safeParse(baseStandard).success).toBe(false);
  });
});

describe('ApplicationMotiveSchema（discriminated union）', () => {
  it('style=standard を受理', () => {
    expect(ApplicationMotiveSchema.safeParse(baseStandard).success).toBe(true);
  });

  it('style=iron を受理', () => {
    expect(ApplicationMotiveSchema.safeParse(baseIron).success).toBe(true);
  });

  it('style フィールドなしを拒否', () => {
    const { style: _s, ...noStyle } = baseStandard;
    expect(ApplicationMotiveSchema.safeParse(noStyle).success).toBe(false);
  });

  it('未知の style 値を拒否', () => {
    expect(ApplicationMotiveSchema.safeParse({ ...baseStandard, style: 'premium' }).success).toBe(
      false,
    );
  });

  it('パース結果から style で narrow できる', () => {
    const result = ApplicationMotiveSchema.safeParse(baseStandard);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.style).toBe('standard');
      if (result.data.style === 'standard') {
        expect(result.data.companyFuture).toBe('DX 推進による業界変革');
      }
    }
  });
});

describe('ApplicationMotiveUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(ApplicationMotiveUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('standard 系フィールドのみ送れる', () => {
    expect(
      ApplicationMotiveUpdateSchema.safeParse({ companyFuture: '新しい企業ビジョン' }).success,
    ).toBe(true);
  });

  it('iron 系フィールドのみ送れる', () => {
    expect(
      ApplicationMotiveUpdateSchema.safeParse({ positiveInfluence: '新しい影響' }).success,
    ).toBe(true);
  });

  it('formattedText を更新できる', () => {
    expect(ApplicationMotiveUpdateSchema.safeParse({ formattedText: '新しい文章' }).success).toBe(
      true,
    );
  });

  it('jobTargetId は UpdateSchema に含まれない（FK 変更不可）', () => {
    const result = ApplicationMotiveUpdateSchema.safeParse({ jobTargetId: '01JOBTG2' });
    const parsed = result.success ? result.data : {};
    expect('jobTargetId' in parsed).toBe(false);
  });
});
