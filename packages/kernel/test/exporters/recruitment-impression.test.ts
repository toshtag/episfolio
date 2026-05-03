import { describe, expect, it } from 'vitest';
import type { RecruitmentImpression } from '../../src/domain/recruitment-impression.js';
import { toRecruitmentImpressionMarkdown } from '../../src/exporters/recruitment-impression.js';

const buildRecord = (overrides: Partial<RecruitmentImpression> = {}): RecruitmentImpression => ({
  id: '01RI00001',
  jobTargetId: '01JT00001',
  selectionProcessNote: '書類選考→一次面接→二次面接→最終面接の4段階。選考期間は約3週間。',
  officeAtmosphere: '受付が明るく、待合室にグリーンが多い。',
  sensoryObservations: [
    { category: '視覚', note: 'オープンフロアで開放的。パーティションが低い。' },
    { category: '聴覚', note: '適度な会話音。BGMなし。' },
  ],
  lifestyleCompatibilityNote: '残業平均20時間/月。在宅週2回可。育児中の社員が多い。',
  redFlagsNote: '面接官が終始時計を気にしていた。',
  overallImpression: '面接官の対応が丁寧で、入社後のキャリアについて具体的に話してくれた。',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('toRecruitmentImpressionMarkdown', () => {
  it('H1 タイトルを含む', () => {
    expect(toRecruitmentImpressionMarkdown(buildRecord())).toContain('# 採用印象メモ');
  });

  it('採用選考プロセスセクションを含む', () => {
    expect(toRecruitmentImpressionMarkdown(buildRecord())).toContain('## 採用選考プロセス観察');
  });

  it('オフィス・職場の雰囲気セクションを含む', () => {
    expect(toRecruitmentImpressionMarkdown(buildRecord())).toContain('## オフィス・職場の雰囲気');
  });

  it('五感観察メモセクションを含む', () => {
    expect(toRecruitmentImpressionMarkdown(buildRecord())).toContain('## 五感観察メモ');
  });

  it('ライフスタイル適合メモセクションを含む', () => {
    expect(toRecruitmentImpressionMarkdown(buildRecord())).toContain('## ライフスタイル適合メモ');
  });

  it('危険信号メモセクションを含む', () => {
    expect(toRecruitmentImpressionMarkdown(buildRecord())).toContain('## 危険信号メモ');
  });

  it('総合印象セクションを含む', () => {
    expect(toRecruitmentImpressionMarkdown(buildRecord())).toContain('## 総合印象');
  });

  it('採用選考プロセスの内容が出力される', () => {
    const md = toRecruitmentImpressionMarkdown(buildRecord());
    expect(md).toContain('書類選考→一次面接→二次面接→最終面接の4段階');
  });

  it('オフィス雰囲気の内容が出力される', () => {
    const md = toRecruitmentImpressionMarkdown(buildRecord());
    expect(md).toContain('受付が明るく、待合室にグリーンが多い');
  });

  it('五感観察のカテゴリと内容が出力される', () => {
    const md = toRecruitmentImpressionMarkdown(buildRecord());
    expect(md).toContain('視覚');
    expect(md).toContain('オープンフロアで開放的');
    expect(md).toContain('聴覚');
    expect(md).toContain('適度な会話音');
  });

  it('五感観察が番号付きで出力される', () => {
    const md = toRecruitmentImpressionMarkdown(buildRecord());
    expect(md).toContain('### 1. 視覚');
    expect(md).toContain('### 2. 聴覚');
  });

  it('五感観察が空のとき「（記録なし）」を出力する', () => {
    const md = toRecruitmentImpressionMarkdown(buildRecord({ sensoryObservations: [] }));
    expect(md).toContain('（記録なし）');
  });

  it('ライフスタイル適合メモが出力される', () => {
    const md = toRecruitmentImpressionMarkdown(buildRecord());
    expect(md).toContain('残業平均20時間/月');
  });

  it('危険信号メモが出力される', () => {
    const md = toRecruitmentImpressionMarkdown(buildRecord());
    expect(md).toContain('面接官が終始時計を気にしていた');
  });

  it('総合印象が出力される', () => {
    const md = toRecruitmentImpressionMarkdown(buildRecord());
    expect(md).toContain('入社後のキャリアについて具体的に話してくれた');
  });

  it('selectionProcessNote が null のとき「（未記入）」になる', () => {
    const md = toRecruitmentImpressionMarkdown(buildRecord({ selectionProcessNote: null }));
    const sections = md.split('## 採用選考プロセス観察');
    expect(sections[1]).toContain('（未記入）');
  });

  it('officeAtmosphere が null のとき「（未記入）」になる', () => {
    const md = toRecruitmentImpressionMarkdown(buildRecord({ officeAtmosphere: null }));
    const sections = md.split('## オフィス・職場の雰囲気');
    expect(sections[1]).toContain('（未記入）');
  });

  it('redFlagsNote が null のとき「（未記入）」になる', () => {
    const md = toRecruitmentImpressionMarkdown(buildRecord({ redFlagsNote: null }));
    const sections = md.split('## 危険信号メモ');
    expect(sections[1]).toContain('（未記入）');
  });

  it('overallImpression が null のとき「（未記入）」になる', () => {
    const md = toRecruitmentImpressionMarkdown(buildRecord({ overallImpression: null }));
    const sections = md.split('## 総合印象');
    expect(sections[1]).toContain('（未記入）');
  });

  it('出力に "null" 文字列を含まない', () => {
    const record = buildRecord({
      selectionProcessNote: null,
      officeAtmosphere: null,
      sensoryObservations: [],
      lifestyleCompatibilityNote: null,
      redFlagsNote: null,
      overallImpression: null,
    });
    expect(toRecruitmentImpressionMarkdown(record)).not.toContain('null');
  });

  it('3 つの五感観察が正しく番号付けされる', () => {
    const record = buildRecord({
      sensoryObservations: [
        { category: '視覚', note: '明るい' },
        { category: '聴覚', note: '静か' },
        { category: '嗅覚', note: 'コーヒーの香り' },
      ],
    });
    const md = toRecruitmentImpressionMarkdown(record);
    expect(md).toContain('### 1. 視覚');
    expect(md).toContain('### 2. 聴覚');
    expect(md).toContain('### 3. 嗅覚');
    expect(md).toContain('コーヒーの香り');
  });
});
