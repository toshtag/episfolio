import { describe, expect, it } from 'vitest';
import type { StrengthFromWeakness } from '../../src/domain/strength-from-weakness.js';
import { toStrengthFromWeaknessMarkdown } from '../../src/exporters/strength-from-weakness.js';

const buildRecord = (overrides: Partial<StrengthFromWeakness> = {}): StrengthFromWeakness => ({
  id: '01SFW0001',
  weaknessLabel: '1年での早期退職',
  blankType: 'early_resign',
  background: '営業が辛くて1年で退職した',
  reframe: '現場の本音を理解できる採用担当者になれる',
  targetCompanyProfile: '社員の弱みを受け入れる文化がある会社',
  note: null,
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('toStrengthFromWeaknessMarkdown', () => {
  it('H1 タイトルを含む', () => {
    expect(toStrengthFromWeaknessMarkdown([])).toContain('# 弱みを武器に変える（発想転換）');
  });

  it('空配列のとき「（記録なし）」を出力する', () => {
    expect(toStrengthFromWeaknessMarkdown([])).toContain('（記録なし）');
  });

  it('空配列のとき「（記録なし）」は 1 件のみ', () => {
    const count = (toStrengthFromWeaknessMarkdown([]).match(/（記録なし）/g) ?? []).length;
    expect(count).toBe(1);
  });

  it('weaknessLabel が H3 見出しに出力される', () => {
    const md = toStrengthFromWeaknessMarkdown([buildRecord()]);
    expect(md).toContain('### 1. 1年での早期退職');
  });

  it('blankType のラベルが出力される', () => {
    const md = toStrengthFromWeaknessMarkdown([buildRecord({ blankType: 'early_resign' })]);
    expect(md).toContain('**種別**: 早期退職');
  });

  it('blankType leave のラベルが出力される', () => {
    const md = toStrengthFromWeaknessMarkdown([buildRecord({ blankType: 'leave' })]);
    expect(md).toContain('**種別**: 休職');
  });

  it('blankType unemployed のラベルが出力される', () => {
    const md = toStrengthFromWeaknessMarkdown([buildRecord({ blankType: 'unemployed' })]);
    expect(md).toContain('**種別**: 無職期間');
  });

  it('blankType other のラベルが出力される', () => {
    const md = toStrengthFromWeaknessMarkdown([buildRecord({ blankType: 'other' })]);
    expect(md).toContain('**種別**: その他');
  });

  it('blankType が null のとき種別行を出力しない', () => {
    const md = toStrengthFromWeaknessMarkdown([buildRecord({ blankType: null })]);
    expect(md).not.toContain('**種別**');
  });

  it('background が出力される', () => {
    const md = toStrengthFromWeaknessMarkdown([
      buildRecord({ background: '介護のために退職した' }),
    ]);
    expect(md).toContain('**背景**: 介護のために退職した');
  });

  it('background が空文字のとき背景行を出力しない', () => {
    const md = toStrengthFromWeaknessMarkdown([buildRecord({ background: '' })]);
    expect(md).not.toContain('**背景**');
  });

  it('reframe が出力される', () => {
    const md = toStrengthFromWeaknessMarkdown([buildRecord({ reframe: '弱みを語れる強み' })]);
    expect(md).toContain('**発想転換**: 弱みを語れる強み');
  });

  it('reframe が空文字のとき「（未記入）」に置換される', () => {
    const md = toStrengthFromWeaknessMarkdown([buildRecord({ reframe: '' })]);
    expect(md).toContain('**発想転換**: （未記入）');
  });

  it('targetCompanyProfile が出力される', () => {
    const md = toStrengthFromWeaknessMarkdown([
      buildRecord({ targetCompanyProfile: '副業 OK の成長企業' }),
    ]);
    expect(md).toContain('**受け入れてくれる会社像**: 副業 OK の成長企業');
  });

  it('targetCompanyProfile が空文字のとき「（未記入）」に置換される', () => {
    const md = toStrengthFromWeaknessMarkdown([buildRecord({ targetCompanyProfile: '' })]);
    expect(md).toContain('**受け入れてくれる会社像**: （未記入）');
  });

  it('note が null のとき出力しない', () => {
    const md = toStrengthFromWeaknessMarkdown([buildRecord({ note: null })]);
    expect(md).not.toContain('**メモ**');
  });

  it('note があるとき出力する', () => {
    const md = toStrengthFromWeaknessMarkdown([buildRecord({ note: '面接で使う' })]);
    expect(md).toContain('**メモ**: 面接で使う');
  });

  it('weaknessLabel が空文字のとき「（未記入）」に置換される', () => {
    const md = toStrengthFromWeaknessMarkdown([buildRecord({ weaknessLabel: '' })]);
    expect(md).toContain('（未記入）');
  });

  it('複数レコードが番号付きで出力される', () => {
    const records = [
      buildRecord({ id: '01SFW0001', weaknessLabel: '一つ目の弱み' }),
      buildRecord({ id: '01SFW0002', weaknessLabel: '二つ目の弱み' }),
    ];
    const md = toStrengthFromWeaknessMarkdown(records);
    const idx1 = md.indexOf('### 1. 一つ目の弱み');
    const idx2 = md.indexOf('### 2. 二つ目の弱み');
    expect(idx1).toBeGreaterThanOrEqual(0);
    expect(idx2).toBeGreaterThan(idx1);
  });

  it('出力に "null" 文字列を含まない', () => {
    const md = toStrengthFromWeaknessMarkdown([buildRecord({ blankType: null, note: null })]);
    expect(md).not.toContain('null');
  });
});
