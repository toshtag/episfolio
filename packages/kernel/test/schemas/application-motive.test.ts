import { describe, expect, it } from 'vitest';
import {
  ApplicationMotiveSchema,
  ApplicationMotiveUpdateSchema,
} from '../../src/schemas/application-motive.js';

const base = {
  id: '01APPMO01',
  jobTargetId: '01JOBTG1',
  companyFuture: 'DX 推進による業界変革',
  contributionAction: 'プロダクト開発の高速化',
  leveragedExperience: 'スタートアップでの新規事業立ち上げ経験',
  formattedText:
    '私はDX 推進による業界変革を達成するために、貴社を志望しています。具体的には、プロダクト開発の高速化に貢献すべく、私の経験のスタートアップでの新規事業立ち上げ経験を生かしてまいります。',
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
};

describe('ApplicationMotiveSchema', () => {
  it('正常系', () => {
    expect(ApplicationMotiveSchema.safeParse(base).success).toBe(true);
  });

  it('文字列フィールドは空文字を許可', () => {
    expect(
      ApplicationMotiveSchema.safeParse({
        ...base,
        companyFuture: '',
        contributionAction: '',
        leveragedExperience: '',
        formattedText: '',
      }).success,
    ).toBe(true);
  });

  it('id 空文字を拒否', () => {
    expect(ApplicationMotiveSchema.safeParse({ ...base, id: '' }).success).toBe(false);
  });

  it('jobTargetId 空文字を拒否', () => {
    expect(ApplicationMotiveSchema.safeParse({ ...base, jobTargetId: '' }).success).toBe(false);
  });

  it('createdAt 空文字を拒否', () => {
    expect(ApplicationMotiveSchema.safeParse({ ...base, createdAt: '' }).success).toBe(false);
  });

  it('updatedAt 空文字を拒否', () => {
    expect(ApplicationMotiveSchema.safeParse({ ...base, updatedAt: '' }).success).toBe(false);
  });

  it('jobTargetId が null を拒否（FK 必須）', () => {
    expect(ApplicationMotiveSchema.safeParse({ ...base, jobTargetId: null }).success).toBe(false);
  });
});

describe('ApplicationMotiveUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(ApplicationMotiveUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('一部のフィールドのみ送れる', () => {
    expect(
      ApplicationMotiveUpdateSchema.safeParse({ companyFuture: '新しい企業ビジョン' }).success,
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
