import { describe, expect, it } from 'vitest';
import {
  SubordinateRowSchema,
  SubordinateSummaryCreateSchema,
  SubordinateSummarySchema,
  SubordinateSummaryUpdateSchema,
} from '../../src/schemas/subordinate-summary.js';

const baseRow = {
  id: '01ROW0001',
  name: '田中太郎',
  strength: '言語化能力に長けている',
  achievement: '自分のやり方をメンバーに共有してチームを底上げした',
  teamRole: 'リーダー気質、先生ポジション',
  challenge: '同僚の成績に目移りして自分の仕事を後回しにする',
  guidance: '「最大のリーダーシップは自分が実行すること」と伝えた',
  change: '上司や先輩にアドバイスを求めるようになった',
  futureCareer: '研修担当・人事制度の構築',
};

const baseSummary = {
  id: '01SUMMARY1',
  title: '営業部 5 名のマネジメント実績',
  subordinates: [baseRow],
  memo: '面接当日に補足する',
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
};

describe('SubordinateRowSchema', () => {
  it('正常系（全フィールドあり）', () => {
    expect(SubordinateRowSchema.safeParse(baseRow).success).toBe(true);
  });

  it('全文字列フィールドが空文字でも受理（id 以外）', () => {
    expect(
      SubordinateRowSchema.safeParse({
        ...baseRow,
        name: '',
        strength: '',
        achievement: '',
        teamRole: '',
        challenge: '',
        guidance: '',
        change: '',
        futureCareer: '',
      }).success,
    ).toBe(true);
  });

  it('id 空文字を拒否', () => {
    expect(SubordinateRowSchema.safeParse({ ...baseRow, id: '' }).success).toBe(false);
  });

  it('id 欠如を拒否', () => {
    const { id: _omit, ...withoutId } = baseRow;
    expect(SubordinateRowSchema.safeParse(withoutId).success).toBe(false);
  });
});

describe('SubordinateSummarySchema', () => {
  it('正常系', () => {
    expect(SubordinateSummarySchema.safeParse(baseSummary).success).toBe(true);
  });

  it('subordinates が空配列でも受理（シート作成直後）', () => {
    expect(SubordinateSummarySchema.safeParse({ ...baseSummary, subordinates: [] }).success).toBe(
      true,
    );
  });

  it('subordinates が複数件でも受理', () => {
    const rows = [
      { ...baseRow, id: '01ROW0001', name: 'A' },
      { ...baseRow, id: '01ROW0002', name: 'B' },
      { ...baseRow, id: '01ROW0003', name: 'C' },
    ];
    expect(SubordinateSummarySchema.safeParse({ ...baseSummary, subordinates: rows }).success).toBe(
      true,
    );
  });

  it('title 空文字でも受理', () => {
    expect(SubordinateSummarySchema.safeParse({ ...baseSummary, title: '' }).success).toBe(true);
  });

  it('memo 空文字でも受理', () => {
    expect(SubordinateSummarySchema.safeParse({ ...baseSummary, memo: '' }).success).toBe(true);
  });

  it('id 空文字を拒否', () => {
    expect(SubordinateSummarySchema.safeParse({ ...baseSummary, id: '' }).success).toBe(false);
  });

  it('createdAt 欠如を拒否', () => {
    const { createdAt: _omit, ...withoutCreatedAt } = baseSummary;
    expect(SubordinateSummarySchema.safeParse(withoutCreatedAt).success).toBe(false);
  });

  it('subordinates の row id が空だと拒否', () => {
    const invalidRows = [{ ...baseRow, id: '' }];
    expect(
      SubordinateSummarySchema.safeParse({ ...baseSummary, subordinates: invalidRows }).success,
    ).toBe(false);
  });
});

describe('SubordinateSummaryCreateSchema', () => {
  it('createdAt / updatedAt を含まずに受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = baseSummary;
    expect(SubordinateSummaryCreateSchema.safeParse(input).success).toBe(true);
  });

  it('subordinates 空配列で create を受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = baseSummary;
    expect(SubordinateSummaryCreateSchema.safeParse({ ...input, subordinates: [] }).success).toBe(
      true,
    );
  });
});

describe('SubordinateSummaryUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(SubordinateSummaryUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('title のみ更新できる', () => {
    expect(SubordinateSummaryUpdateSchema.safeParse({ title: '改訂版' }).success).toBe(true);
  });

  it('subordinates 配列のみ更新できる', () => {
    expect(SubordinateSummaryUpdateSchema.safeParse({ subordinates: [baseRow] }).success).toBe(
      true,
    );
  });

  it('memo のみ更新できる', () => {
    expect(SubordinateSummaryUpdateSchema.safeParse({ memo: '更新' }).success).toBe(true);
  });

  it('id を含めても無視される', () => {
    const result = SubordinateSummaryUpdateSchema.safeParse({ id: 'should-be-ignored' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });
});
