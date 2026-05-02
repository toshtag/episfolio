import { describe, expect, it } from 'vitest';
import {
  AssetTypeSchema,
  WorkAssetSummarySchema,
  WorkAssetSummaryUpdateSchema,
} from '../../src/schemas/work-asset-summary.js';

const baseAsset = {
  id: '01HASSET1',
  title: '新規顧客向け提案書',
  assetType: 'proposal' as const,
  jobContext: null,
  period: null,
  role: null,
  summary: null,
  strengthEpisode: null,
  talkingPoints: null,
  maskingNote: null,
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
};

describe('AssetTypeSchema', () => {
  const validTypes = [
    'proposal',
    'source-code',
    'slide',
    'minutes',
    'weekly-report',
    'comparison-table',
    'document',
    'other',
  ] as const;

  for (const t of validTypes) {
    it(`${t} を受理`, () => {
      expect(AssetTypeSchema.safeParse(t).success).toBe(true);
    });
  }

  it('未知の値を拒否', () => {
    expect(AssetTypeSchema.safeParse('spreadsheet').success).toBe(false);
  });

  it('空文字を拒否', () => {
    expect(AssetTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('WorkAssetSummarySchema', () => {
  it('正常系（nullable フィールドあり）', () => {
    expect(WorkAssetSummarySchema.safeParse(baseAsset).success).toBe(true);
  });

  it('全フィールドに値があっても受理', () => {
    const allFilled = {
      ...baseAsset,
      jobContext: 'SaaS 営業部門向け提案フェーズ',
      period: '2023年10月〜2023年12月',
      role: '提案リード',
      summary: '顧客の課題を整理し、コスト削減試算を含む提案書を作成',
      strengthEpisode: '3 週間で競合 2 社を差し置いて受注につなげた',
      talkingPoints: '数字で語れる成果、提案プロセスのリード経験',
      maskingNote: '顧客名・金額は伏字。社内ロゴは差し替え',
    };
    expect(WorkAssetSummarySchema.safeParse(allFilled).success).toBe(true);
  });

  it('assetType が未知の値だと拒否', () => {
    expect(WorkAssetSummarySchema.safeParse({ ...baseAsset, assetType: 'spreadsheet' }).success).toBe(
      false,
    );
  });

  it('title 空文字を拒否', () => {
    expect(WorkAssetSummarySchema.safeParse({ ...baseAsset, title: '' }).success).toBe(false);
  });

  it('id 空文字を拒否', () => {
    expect(WorkAssetSummarySchema.safeParse({ ...baseAsset, id: '' }).success).toBe(false);
  });

  it('createdAt 欠如を拒否', () => {
    const { createdAt: _omit, ...withoutCreatedAt } = baseAsset;
    expect(WorkAssetSummarySchema.safeParse(withoutCreatedAt).success).toBe(false);
  });

  it('全 assetType enum を受理', () => {
    const types = [
      'proposal',
      'source-code',
      'slide',
      'minutes',
      'weekly-report',
      'comparison-table',
      'document',
      'other',
    ];
    for (const t of types) {
      expect(WorkAssetSummarySchema.safeParse({ ...baseAsset, assetType: t }).success).toBe(true);
    }
  });
});

describe('WorkAssetSummaryUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(WorkAssetSummaryUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('title のみ更新できる', () => {
    expect(WorkAssetSummaryUpdateSchema.safeParse({ title: '改訂版提案書' }).success).toBe(true);
  });

  it('assetType を変更できる', () => {
    expect(WorkAssetSummaryUpdateSchema.safeParse({ assetType: 'slide' }).success).toBe(true);
  });

  it('summary を null で更新できる', () => {
    expect(WorkAssetSummaryUpdateSchema.safeParse({ summary: null }).success).toBe(true);
  });

  it('talkingPoints と maskingNote を同時に更新できる', () => {
    expect(
      WorkAssetSummaryUpdateSchema.safeParse({
        talkingPoints: '提案スピードと数字の説明',
        maskingNote: '金額は伏字',
      }).success,
    ).toBe(true);
  });

  it('title 空文字を拒否', () => {
    expect(WorkAssetSummaryUpdateSchema.safeParse({ title: '' }).success).toBe(false);
  });

  it('assetType に未知の値を拒否', () => {
    expect(WorkAssetSummaryUpdateSchema.safeParse({ assetType: 'spreadsheet' }).success).toBe(false);
  });

  it('id を含めても無視される（pick されていない）', () => {
    const result = WorkAssetSummaryUpdateSchema.safeParse({ id: 'should-be-ignored' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });
});
