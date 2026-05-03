import { describe, expect, it } from 'vitest';
import type { WeakConnection } from '../../src/domain/weak-connection.js';
import { toWeakConnectionMarkdown } from '../../src/exporters/weak-connection.js';

const buildRecord = (overrides: Partial<WeakConnection> = {}): WeakConnection => ({
  id: '01WC00001',
  name: '田中太郎',
  category: 'student_days',
  relation: '大学のゼミ仲間',
  contactStatus: 'not_contacted',
  prospectNote: 'IT 系の会社に勤めているので転職先の紹介を頼めるかも',
  note: null,
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('toWeakConnectionMarkdown', () => {
  it('H1 タイトルを含む', () => {
    expect(toWeakConnectionMarkdown([])).toContain('# 弱いつながり（半径5メートル以内の知り合い）');
  });

  it('空配列のとき「（記録なし）」を出力する', () => {
    expect(toWeakConnectionMarkdown([])).toContain('（記録なし）');
  });

  it('空配列のとき「（記録なし）」は 1 件のみ', () => {
    const count = (toWeakConnectionMarkdown([]).match(/（記録なし）/g) ?? []).length;
    expect(count).toBe(1);
  });

  it('name が H4 見出しに出力される', () => {
    const md = toWeakConnectionMarkdown([buildRecord()]);
    expect(md).toContain('#### 1. 田中太郎');
  });

  it('name が空文字のとき「（未記入）」に置換される', () => {
    const md = toWeakConnectionMarkdown([buildRecord({ name: '' })]);
    expect(md).toContain('（未記入）');
  });

  it('関係性が出力される', () => {
    const md = toWeakConnectionMarkdown([buildRecord()]);
    expect(md).toContain('**関係性**: 大学のゼミ仲間');
  });

  it('relation が空文字のとき「（未記入）」に置換される', () => {
    const md = toWeakConnectionMarkdown([buildRecord({ relation: '' })]);
    expect(md).toContain('**関係性**: （未記入）');
  });

  it('contactStatus: not_contacted → 「未連絡」と出力される', () => {
    const md = toWeakConnectionMarkdown([buildRecord({ contactStatus: 'not_contacted' })]);
    expect(md).toContain('**連絡状況**: 未連絡');
  });

  it('contactStatus: contacted → 「連絡済み」と出力される', () => {
    const md = toWeakConnectionMarkdown([buildRecord({ contactStatus: 'contacted' })]);
    expect(md).toContain('**連絡状況**: 連絡済み');
  });

  it('contactStatus: replied → 「返信あり」と出力される', () => {
    const md = toWeakConnectionMarkdown([buildRecord({ contactStatus: 'replied' })]);
    expect(md).toContain('**連絡状況**: 返信あり');
  });

  it('prospectNote が出力される', () => {
    const md = toWeakConnectionMarkdown([buildRecord()]);
    expect(md).toContain('**転職の糸口**: IT 系の会社に勤めているので転職先の紹介を頼めるかも');
  });

  it('note が null のとき「**メモ**」行を出力しない', () => {
    const md = toWeakConnectionMarkdown([buildRecord({ note: null })]);
    expect(md).not.toContain('**メモ**');
  });

  it('note があるとき出力する', () => {
    const md = toWeakConnectionMarkdown([buildRecord({ note: '退職から5カ月後に連絡予定' })]);
    expect(md).toContain('**メモ**: 退職から5カ月後に連絡予定');
  });

  it('student_days カテゴリの H3 が出力される', () => {
    const md = toWeakConnectionMarkdown([buildRecord({ category: 'student_days' })]);
    expect(md).toContain('### 学生時代の仲間（バイト・ゼミ・サークル）');
  });

  it('hobby カテゴリの H3 が出力される', () => {
    const md = toWeakConnectionMarkdown([buildRecord({ category: 'hobby' })]);
    expect(md).toContain('### 趣味のつながり');
  });

  it('sns カテゴリの H3 が出力される', () => {
    const md = toWeakConnectionMarkdown([buildRecord({ category: 'sns' })]);
    expect(md).toContain('### SNS');
  });

  it('カテゴリ別にグルーピングして出力される', () => {
    const records = [
      buildRecord({ id: '01WC00001', category: 'hobby', name: '趣味仲間' }),
      buildRecord({ id: '01WC00002', category: 'student_days', name: 'ゼミ仲間' }),
    ];
    const md = toWeakConnectionMarkdown(records);
    const idxStudent = md.indexOf('学生時代の仲間');
    const idxHobby = md.indexOf('趣味のつながり');
    expect(idxStudent).toBeGreaterThanOrEqual(0);
    expect(idxHobby).toBeGreaterThanOrEqual(0);
    expect(idxStudent).toBeLessThan(idxHobby);
  });

  it('レコードのないカテゴリは H3 を出力しない', () => {
    const md = toWeakConnectionMarkdown([buildRecord({ category: 'student_days' })]);
    expect(md).not.toContain('### 趣味のつながり');
    expect(md).not.toContain('### SNS');
  });

  it('出力に "null" 文字列を含まない', () => {
    const md = toWeakConnectionMarkdown([buildRecord({ note: null })]);
    expect(md).not.toContain('null');
  });
});
