import { describe, expect, it } from 'vitest';
import type { WorkAssetSummary } from '../../src/domain/work-asset-summary.js';
import { toWorkAssetSummaryMarkdown } from '../../src/exporters/work-asset-summary.js';

const baseAsset: WorkAssetSummary = {
  id: '01HASSET1',
  title: '新規顧客向け提案書',
  assetType: 'proposal',
  jobContext: 'SaaS 営業部門向け提案フェーズ',
  period: '2023年10月〜2023年12月',
  role: '提案リード',
  summary: '顧客の課題を整理し、コスト削減試算を含む提案書を作成',
  strengthEpisode: '3 週間で競合 2 社を差し置いて受注につなげた',
  talkingPoints: '数字で語れる成果、提案プロセスのリード経験',
  maskingNote: '顧客名・金額は伏字。社内ロゴは差し替え',
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
};

describe('toWorkAssetSummaryMarkdown', () => {
  it('タイトルを H1 に含む', () => {
    const md = toWorkAssetSummaryMarkdown(baseAsset);
    expect(md).toContain('# 仕事資料 — 新規顧客向け提案書');
  });

  it('assetType の日本語ラベルを出力する', () => {
    const md = toWorkAssetSummaryMarkdown(baseAsset);
    expect(md).toContain('**資料種別**: 提案書');
  });

  it('全 assetType の日本語ラベルが正しい', () => {
    const cases: Array<[WorkAssetSummary['assetType'], string]> = [
      ['proposal', '提案書'],
      ['source-code', 'ソースコード'],
      ['slide', 'スライド'],
      ['minutes', '議事録'],
      ['weekly-report', '週次報告'],
      ['comparison-table', '比較表'],
      ['document', '文書'],
      ['other', 'その他'],
    ];
    for (const [type, label] of cases) {
      const md = toWorkAssetSummaryMarkdown({ ...baseAsset, assetType: type });
      expect(md).toContain(`**資料種別**: ${label}`);
    }
  });

  it('jobContext が存在するとき出力する', () => {
    const md = toWorkAssetSummaryMarkdown(baseAsset);
    expect(md).toContain('**業務コンテキスト**: SaaS 営業部門向け提案フェーズ');
  });

  it('jobContext が null のとき出力しない', () => {
    const md = toWorkAssetSummaryMarkdown({ ...baseAsset, jobContext: null });
    expect(md).not.toContain('業務コンテキスト');
  });

  it('period が存在するとき出力する', () => {
    const md = toWorkAssetSummaryMarkdown(baseAsset);
    expect(md).toContain('**作成期間**: 2023年10月〜2023年12月');
  });

  it('period が null のとき出力しない', () => {
    const md = toWorkAssetSummaryMarkdown({ ...baseAsset, period: null });
    expect(md).not.toContain('作成期間');
  });

  it('role が存在するとき出力する', () => {
    const md = toWorkAssetSummaryMarkdown(baseAsset);
    expect(md).toContain('**担当役割**: 提案リード');
  });

  it('role が null のとき出力しない', () => {
    const md = toWorkAssetSummaryMarkdown({ ...baseAsset, role: null });
    expect(md).not.toContain('担当役割');
  });

  it('概要セクションに summary を出力する', () => {
    const md = toWorkAssetSummaryMarkdown(baseAsset);
    expect(md).toContain('## 概要');
    expect(md).toContain('顧客の課題を整理し、コスト削減試算を含む提案書を作成');
  });

  it('summary が null のとき（未記入）を出力する', () => {
    const md = toWorkAssetSummaryMarkdown({ ...baseAsset, summary: null });
    expect(md).toContain('## 概要');
    const after = md.slice(md.indexOf('## 概要'));
    expect(after).toContain('（未記入）');
  });

  it('強みエピソードセクションを含む', () => {
    const md = toWorkAssetSummaryMarkdown(baseAsset);
    expect(md).toContain('## 強みエピソード');
    expect(md).toContain('3 週間で競合 2 社を差し置いて受注につなげた');
  });

  it('strengthEpisode が null のとき（未記入）を出力する', () => {
    const md = toWorkAssetSummaryMarkdown({ ...baseAsset, strengthEpisode: null });
    const after = md.slice(md.indexOf('## 強みエピソード'));
    expect(after).toContain('（未記入）');
  });

  it('面接での話すポイントセクションを含む', () => {
    const md = toWorkAssetSummaryMarkdown(baseAsset);
    expect(md).toContain('## 面接での話すポイント');
    expect(md).toContain('数字で語れる成果、提案プロセスのリード経験');
  });

  it('talkingPoints が null のとき（未記入）を出力する', () => {
    const md = toWorkAssetSummaryMarkdown({ ...baseAsset, talkingPoints: null });
    const after = md.slice(md.indexOf('## 面接での話すポイント'));
    expect(after).toContain('（未記入）');
  });

  it('機微情報のマスク方針セクションを含む', () => {
    const md = toWorkAssetSummaryMarkdown(baseAsset);
    expect(md).toContain('## 機微情報のマスク方針');
    expect(md).toContain('顧客名・金額は伏字。社内ロゴは差し替え');
  });

  it('maskingNote が null のとき（未記入）を出力する', () => {
    const md = toWorkAssetSummaryMarkdown({ ...baseAsset, maskingNote: null });
    const after = md.slice(md.indexOf('## 機微情報のマスク方針'));
    expect(after).toContain('（未記入）');
  });

  it('出力に "null" 文字列を含まない（nullable フィールドすべて null）', () => {
    const md = toWorkAssetSummaryMarkdown({
      ...baseAsset,
      jobContext: null,
      period: null,
      role: null,
      summary: null,
      strengthEpisode: null,
      talkingPoints: null,
      maskingNote: null,
    });
    expect(md).not.toContain('null');
  });

  it('セクション順序（概要 → 強み → 話すポイント → マスク方針）が正しい', () => {
    const md = toWorkAssetSummaryMarkdown(baseAsset);
    const summaryIdx = md.indexOf('## 概要');
    const strengthIdx = md.indexOf('## 強みエピソード');
    const talkingIdx = md.indexOf('## 面接での話すポイント');
    const maskingIdx = md.indexOf('## 機微情報のマスク方針');
    expect(summaryIdx).toBeLessThan(strengthIdx);
    expect(strengthIdx).toBeLessThan(talkingIdx);
    expect(talkingIdx).toBeLessThan(maskingIdx);
  });
});
