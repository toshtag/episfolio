import { describe, expect, it } from 'vitest';
import type { BossReference } from '../../src/domain/boss-reference.js';
import { toBossReferenceMarkdown } from '../../src/exporters/boss-reference.js';

const baseAxisValues = {
  logicVsEmotion: 2,
  resultVsProcess: 3,
  soloVsTeam: 4,
  futureVsTradition: 1,
  sharesPrivate: 5,
  teachingSkill: 2,
  listening: 3,
  busyness: 4,
};

const baseRef: BossReference = {
  id: '01HBOSS1',
  bossName: '田中部長',
  companyName: '株式会社サンプル',
  period: '2020年4月〜2023年3月',
  axisValues: baseAxisValues,
  q1: '金融系のシステム開発',
  q2: '勤怠管理システムの刷新プロジェクト',
  q3: null,
  q4: null,
  q5: null,
  q6: '人材系企業の IT 企画室の部長',
  q7: null,
  q8: null,
  q9: null,
  q10: null,
  q11: null,
  strengthEpisode: 'チェックの細かいシステムエンジニア畑のキャリアを客観的に伝えられる',
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
};

describe('toBossReferenceMarkdown', () => {
  it('bossName と companyName をタイトルに含む', () => {
    const md = toBossReferenceMarkdown(baseRef);
    expect(md).toContain('田中部長');
    expect(md).toContain('株式会社サンプル');
  });

  it('bossName が null のとき companyName だけタイトルに出る', () => {
    const md = toBossReferenceMarkdown({ ...baseRef, bossName: null });
    expect(md).toContain('株式会社サンプル');
    expect(md).not.toContain('null');
  });

  it('period を含む', () => {
    const md = toBossReferenceMarkdown(baseRef);
    expect(md).toContain('2020年4月〜2023年3月');
  });

  it('タイプ分析チャートセクションを含む', () => {
    const md = toBossReferenceMarkdown(baseRef);
    expect(md).toContain('## タイプ分析チャート');
  });

  it('8 軸ラベルが全て出力される', () => {
    const md = toBossReferenceMarkdown(baseRef);
    expect(md).toContain('論理重視');
    expect(md).toContain('感性重視');
    expect(md).toContain('結果重視');
    expect(md).toContain('チームワーク重視');
    expect(md).toContain('未来重視');
    expect(md).toContain('伝統重視');
    expect(md).toContain('プライベートを話す');
    expect(md).toContain('教えるのが得意');
    expect(md).toContain('話を聞く');
    expect(md).toContain('忙しい');
    expect(md).toContain('ゆとりがある');
  });

  it('スライダー値に対応する ● が出力される', () => {
    const md = toBossReferenceMarkdown(baseRef);
    expect(md).toContain('●');
    expect(md).toContain('○');
  });

  it('11の質問セクションを含む', () => {
    const md = toBossReferenceMarkdown(baseRef);
    expect(md).toContain('## 11の質問');
  });

  it('q1 の回答が含まれる', () => {
    const md = toBossReferenceMarkdown(baseRef);
    expect(md).toContain('金融系のシステム開発');
  });

  it('null の質問は（未記入）を出力する', () => {
    const md = toBossReferenceMarkdown(baseRef);
    expect(md).toContain('（未記入）');
  });

  it('強みエピソードセクションを含む', () => {
    const md = toBossReferenceMarkdown(baseRef);
    expect(md).toContain('## 強みエピソード');
    expect(md).toContain('チェックの細かいシステムエンジニア畑のキャリアを客観的に伝えられる');
  });

  it('strengthEpisode が null のとき（未記入）を出力する', () => {
    const md = toBossReferenceMarkdown({ ...baseRef, strengthEpisode: null });
    expect(md).toContain('## 強みエピソード');
    expect(md).toContain('（未記入）');
  });

  it('3 セクション（チャート/質問テーブル/強みエピソード）の順序が正しい', () => {
    const md = toBossReferenceMarkdown(baseRef);
    const chartIdx = md.indexOf('## タイプ分析チャート');
    const qaIdx = md.indexOf('## 11の質問');
    const epIdx = md.indexOf('## 強みエピソード');
    expect(chartIdx).toBeLessThan(qaIdx);
    expect(qaIdx).toBeLessThan(epIdx);
  });
});
