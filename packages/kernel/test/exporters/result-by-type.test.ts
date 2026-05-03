import { describe, expect, it } from 'vitest';
import type { ResultByType, ResultEntry } from '../../src/domain/result-by-type.js';
import { toResultByTypeMarkdown } from '../../src/exporters/result-by-type.js';

const buildEntry = (overrides: Partial<ResultEntry> = {}): ResultEntry => ({
  id: '01ENTRY001',
  resultType: 'revenue',
  situation: '新規顧客開拓に行き詰まっていた',
  action: 'マーケティング担当と連携し提案資料を改善した',
  result: '定価納品が増えた',
  quantification: null,
  skillType: 'outcome',
  note: null,
  ...overrides,
});

const buildResult = (overrides: Partial<ResultByType> = {}): ResultByType => ({
  id: '01RESULT001',
  title: '営業での実績',
  entries: [buildEntry()],
  memo: '',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('toResultByTypeMarkdown', () => {
  it('H1 タイトルを含む', () => {
    const md = toResultByTypeMarkdown([]);
    expect(md).toContain('# 3 タイプの実績（利益＝売上－コスト）');
  });

  it('空配列のとき「（記録なし）」が出力される', () => {
    const md = toResultByTypeMarkdown([]);
    expect(md).toContain('（記録なし）');
  });

  it('空配列のときセクションヘッダーが出力されない', () => {
    const md = toResultByTypeMarkdown([]);
    expect(md).not.toContain('## ① 売上を上げる');
  });

  it('record のタイトルが H2 で出力される', () => {
    const md = toResultByTypeMarkdown([buildResult()]);
    expect(md).toContain('## 営業での実績');
  });

  it('revenue エントリが「① 売上を上げる」セクションに出力される', () => {
    const entry = buildEntry({ resultType: 'revenue', action: '売上向上アクション' });
    const md = toResultByTypeMarkdown([buildResult({ entries: [entry] })]);
    const sectionIdx = md.indexOf('### ① 売上を上げる');
    const actionIdx = md.indexOf('売上向上アクション');
    expect(sectionIdx).toBeGreaterThan(-1);
    expect(actionIdx).toBeGreaterThan(sectionIdx);
  });

  it('cost エントリが「② コストを下げる」セクションに出力される', () => {
    const entry = buildEntry({ resultType: 'cost', action: 'コスト削減アクション' });
    const md = toResultByTypeMarkdown([buildResult({ entries: [entry] })]);
    const sectionIdx = md.indexOf('### ② コストを下げる');
    const actionIdx = md.indexOf('コスト削減アクション');
    expect(sectionIdx).toBeGreaterThan(-1);
    expect(actionIdx).toBeGreaterThan(sectionIdx);
  });

  it('both エントリが「③ 売上とコストの両方に影響」セクションに出力される', () => {
    const entry = buildEntry({ resultType: 'both', action: '両方に影響したアクション' });
    const md = toResultByTypeMarkdown([buildResult({ entries: [entry] })]);
    const sectionIdx = md.indexOf('### ③ 売上とコストの両方に影響');
    const actionIdx = md.indexOf('両方に影響したアクション');
    expect(sectionIdx).toBeGreaterThan(-1);
    expect(actionIdx).toBeGreaterThan(sectionIdx);
  });

  it('outcome エントリに「成果スキル」ラベルが出力される', () => {
    const entry = buildEntry({ skillType: 'outcome' });
    const md = toResultByTypeMarkdown([buildResult({ entries: [entry] })]);
    expect(md).toContain('[成果スキル]');
  });

  it('cause エントリに「原因スキル」ラベルが出力される', () => {
    const entry = buildEntry({ skillType: 'cause' });
    const md = toResultByTypeMarkdown([buildResult({ entries: [entry] })]);
    expect(md).toContain('[原因スキル]');
  });

  it('quantification が非 null のとき数値化フィールドが出力される', () => {
    const entry = buildEntry({ quantification: '受注率 20% 向上' });
    const md = toResultByTypeMarkdown([buildResult({ entries: [entry] })]);
    expect(md).toContain('**数値化**: 受注率 20% 向上');
  });

  it('quantification が null のとき数値化フィールドが出力されない', () => {
    const entry = buildEntry({ quantification: null });
    const md = toResultByTypeMarkdown([buildResult({ entries: [entry] })]);
    expect(md).not.toContain('**数値化**');
  });

  it('note が非 null のときメモフィールドが出力される', () => {
    const entry = buildEntry({ note: '補足メモ' });
    const md = toResultByTypeMarkdown([buildResult({ entries: [entry] })]);
    expect(md).toContain('**メモ**: 補足メモ');
  });

  it('note が null のときメモフィールドが出力されない', () => {
    const entry = buildEntry({ note: null });
    const md = toResultByTypeMarkdown([buildResult({ entries: [entry] })]);
    expect(md).not.toContain('**メモ**');
  });

  it('action が空のとき「（未記入）」が出力される', () => {
    const entry = buildEntry({ action: '' });
    const md = toResultByTypeMarkdown([buildResult({ entries: [entry] })]);
    expect(md).toContain('**行動**: （未記入）');
  });

  it('record.memo が非空のとき出力される', () => {
    const md = toResultByTypeMarkdown([buildResult({ memo: '全体のメモ' })]);
    expect(md).toContain('**メモ**: 全体のメモ');
  });

  it('record.memo が空のとき出力されない', () => {
    const md = toResultByTypeMarkdown([buildResult({ memo: '' })]);
    const memoCount = (md.match(/\*\*メモ\*\*/g) ?? []).length;
    expect(memoCount).toBe(0);
  });

  it('エントリが存在しないタイプのセクションは出力されない', () => {
    const entry = buildEntry({ resultType: 'revenue' });
    const md = toResultByTypeMarkdown([buildResult({ entries: [entry] })]);
    expect(md).toContain('### ① 売上を上げる');
    expect(md).not.toContain('### ② コストを下げる');
    expect(md).not.toContain('### ③ 売上とコストの両方に影響');
  });

  it('複数 record が順番通りに出力される', () => {
    const first = buildResult({ id: '01RESULT001', title: '最初の実績' });
    const second = buildResult({ id: '01RESULT002', title: '二番目の実績' });
    const md = toResultByTypeMarkdown([first, second]);
    const firstIdx = md.indexOf('最初の実績');
    const secondIdx = md.indexOf('二番目の実績');
    expect(firstIdx).toBeLessThan(secondIdx);
  });

  it('situation が空のとき「状況」フィールドが出力されない', () => {
    const entry = buildEntry({ situation: '' });
    const md = toResultByTypeMarkdown([buildResult({ entries: [entry] })]);
    expect(md).not.toContain('**状況**');
  });

  it('situation が非空のとき「状況」フィールドが出力される', () => {
    const entry = buildEntry({ situation: '状況説明テキスト' });
    const md = toResultByTypeMarkdown([buildResult({ entries: [entry] })]);
    expect(md).toContain('**状況**: 状況説明テキスト');
  });

  it('エントリのインデックス番号が出力される', () => {
    const entry = buildEntry({ resultType: 'revenue' });
    const md = toResultByTypeMarkdown([buildResult({ entries: [entry] })]);
    expect(md).toContain('#### 1. [成果スキル]');
  });

  it('複数エントリが連番で出力される', () => {
    const entries = [
      buildEntry({ id: '01ENTRY001', resultType: 'revenue', skillType: 'outcome' }),
      buildEntry({ id: '01ENTRY002', resultType: 'revenue', skillType: 'cause' }),
    ];
    const md = toResultByTypeMarkdown([buildResult({ entries })]);
    expect(md).toContain('#### 1. [成果スキル]');
    expect(md).toContain('#### 2. [原因スキル]');
  });
});
