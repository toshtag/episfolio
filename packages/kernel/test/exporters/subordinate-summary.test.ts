import { describe, expect, it } from 'vitest';
import type { SubordinateRow, SubordinateSummary } from '../../src/domain/subordinate-summary.js';
import { toSubordinateSummaryMarkdown } from '../../src/exporters/subordinate-summary.js';

const baseRow: SubordinateRow = {
  id: '01ROW0001',
  name: '田中太郎',
  strength: '言語化能力に長けている',
  achievement: 'メンバーに方法を共有してチームを底上げした',
  teamRole: 'リーダー気質、先生ポジション',
  challenge: '同僚の成績に目移りして自分の仕事を後回しにする',
  guidance: '「最大のリーダーシップは自分が実行すること」と伝えた',
  change: '上司や先輩にアドバイスを求めるようになった',
  futureCareer: '研修担当・人事制度の構築',
};

const baseSummary: SubordinateSummary = {
  id: '01SUMMARY1',
  title: '営業部 5 名のマネジメント実績',
  subordinates: [baseRow],
  memo: '面接で個別に補足する',
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
};

describe('toSubordinateSummaryMarkdown', () => {
  it('タイトルを H1 に含む', () => {
    const md = toSubordinateSummaryMarkdown(baseSummary);
    expect(md).toContain('# 営業部 5 名のマネジメント実績');
  });

  it('title が空文字のとき既定のタイトル「部下まとめシート」を使う', () => {
    const md = toSubordinateSummaryMarkdown({ ...baseSummary, title: '' });
    expect(md).toContain('# 部下まとめシート');
  });

  it('subordinates が空配列のとき「（部下情報なし）」を出力', () => {
    const md = toSubordinateSummaryMarkdown({ ...baseSummary, subordinates: [] });
    expect(md).toContain('（部下情報なし）');
  });

  it('1 件の部下の全フィールドを出力する', () => {
    const md = toSubordinateSummaryMarkdown(baseSummary);
    expect(md).toContain('## 1. 田中太郎');
    expect(md).toContain('**強み**: 言語化能力に長けている');
    expect(md).toContain('**実績**: メンバーに方法を共有してチームを底上げした');
    expect(md).toContain('**チーム内の役割・性格**: リーダー気質、先生ポジション');
    expect(md).toContain('### 課題と指導、変化');
    expect(md).toContain('- **課題**: 同僚の成績に目移りして自分の仕事を後回しにする');
    expect(md).toContain('- **指導**: 「最大のリーダーシップは自分が実行すること」と伝えた');
    expect(md).toContain('- **変化**: 上司や先輩にアドバイスを求めるようになった');
    expect(md).toContain('**将来的に進みたい仕事**: 研修担当・人事制度の構築');
  });

  it('複数の部下を区切り線で順序通り出力する', () => {
    const rows: SubordinateRow[] = [
      { ...baseRow, id: '01ROW0001', name: '田中' },
      { ...baseRow, id: '01ROW0002', name: '佐藤' },
      { ...baseRow, id: '01ROW0003', name: '鈴木' },
    ];
    const md = toSubordinateSummaryMarkdown({ ...baseSummary, subordinates: rows });
    const tIdx = md.indexOf('## 1. 田中');
    const sIdx = md.indexOf('## 2. 佐藤');
    const sz = md.indexOf('## 3. 鈴木');
    expect(tIdx).toBeGreaterThanOrEqual(0);
    expect(sIdx).toBeGreaterThan(tIdx);
    expect(sz).toBeGreaterThan(sIdx);
    const sepCount = (md.match(/^---$/gm) ?? []).length;
    expect(sepCount).toBe(2);
  });

  it('maskNames: true で部下名を「部下 N」に置換する', () => {
    const rows: SubordinateRow[] = [
      { ...baseRow, id: '01ROW0001', name: '田中' },
      { ...baseRow, id: '01ROW0002', name: '佐藤' },
    ];
    const md = toSubordinateSummaryMarkdown(
      { ...baseSummary, subordinates: rows },
      { maskNames: true },
    );
    expect(md).not.toContain('田中');
    expect(md).not.toContain('佐藤');
    expect(md).toContain('## 1. 部下 1');
    expect(md).toContain('## 2. 部下 2');
  });

  it('maskNames: false（既定）で本名を出力する', () => {
    const md = toSubordinateSummaryMarkdown(baseSummary);
    expect(md).toContain('田中太郎');
  });

  it('name が空文字のとき maskNames 指定なしでも「部下 N」にフォールバックする', () => {
    const rows: SubordinateRow[] = [{ ...baseRow, id: '01ROW0001', name: '' }];
    const md = toSubordinateSummaryMarkdown({ ...baseSummary, subordinates: rows });
    expect(md).toContain('## 1. 部下 1');
  });

  it('row フィールドが空文字のとき「（未記入）」を出力する', () => {
    const emptyRow: SubordinateRow = {
      ...baseRow,
      strength: '',
      achievement: '',
      teamRole: '',
      challenge: '',
      guidance: '',
      change: '',
      futureCareer: '',
    };
    const md = toSubordinateSummaryMarkdown({ ...baseSummary, subordinates: [emptyRow] });
    expect(md).toContain('**強み**: （未記入）');
    expect(md).toContain('**実績**: （未記入）');
    expect(md).toContain('**チーム内の役割・性格**: （未記入）');
    expect(md).toContain('- **課題**: （未記入）');
    expect(md).toContain('- **指導**: （未記入）');
    expect(md).toContain('- **変化**: （未記入）');
    expect(md).toContain('**将来的に進みたい仕事**: （未記入）');
  });

  it('memo がある場合「## メモ」セクションを出力する', () => {
    const md = toSubordinateSummaryMarkdown(baseSummary);
    expect(md).toContain('## メモ');
    expect(md).toContain('面接で個別に補足する');
  });

  it('memo が空文字のとき「## メモ」セクションを出力しない', () => {
    const md = toSubordinateSummaryMarkdown({ ...baseSummary, memo: '' });
    expect(md).not.toContain('## メモ');
  });

  it('出力に "null" 文字列を含まない', () => {
    const md = toSubordinateSummaryMarkdown(baseSummary);
    expect(md).not.toContain('null');
  });
});
