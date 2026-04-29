import { describe, expect, it } from 'vitest';
import { computeUnifiedDiff, formatUnifiedDiff } from '../../src/exporters/revision-diff.js';

describe('computeUnifiedDiff', () => {
  it('同一内容のとき context ハンクのみ返す', () => {
    const hunks = computeUnifiedDiff('hello\nworld', 'hello\nworld');
    expect(hunks.every((h) => h.kind === 'context')).toBe(true);
  });

  it('1行追加を検出する', () => {
    const hunks = computeUnifiedDiff('a\nb', 'a\nX\nb');
    const added = hunks.filter((h) => h.kind === 'added');
    expect(added).toHaveLength(1);
    const addedHunk = added[0];
    if (addedHunk) expect(addedHunk.lines).toContain('X');
  });

  it('1行削除を検出する', () => {
    const hunks = computeUnifiedDiff('a\nX\nb', 'a\nb');
    const removed = hunks.filter((h) => h.kind === 'removed');
    expect(removed).toHaveLength(1);
    const removedHunk = removed[0];
    if (removedHunk) expect(removedHunk.lines).toContain('X');
  });

  it('全置換を検出する', () => {
    const hunks = computeUnifiedDiff('old', 'new');
    const kinds = hunks.map((h) => h.kind);
    expect(kinds).toContain('removed');
    expect(kinds).toContain('added');
  });

  it('空→内容 の追加を検出する', () => {
    const hunks = computeUnifiedDiff('', 'hello');
    expect(hunks.some((h) => h.kind === 'added')).toBe(true);
  });

  it('内容→空 の削除を検出する', () => {
    const hunks = computeUnifiedDiff('hello', '');
    expect(hunks.some((h) => h.kind === 'removed')).toBe(true);
  });

  it('両方空のとき空配列を返す', () => {
    const hunks = computeUnifiedDiff('', '');
    expect(hunks).toHaveLength(0);
  });
});

describe('formatUnifiedDiff', () => {
  it('added は + プレフィックスになる', () => {
    const hunks = computeUnifiedDiff('a', 'a\nb');
    const formatted = formatUnifiedDiff(hunks);
    expect(formatted).toContain('+b');
  });

  it('removed は - プレフィックスになる', () => {
    const hunks = computeUnifiedDiff('a\nb', 'a');
    const formatted = formatUnifiedDiff(hunks);
    expect(formatted).toContain('-b');
  });

  it('context は スペース プレフィックスになる', () => {
    const hunks = computeUnifiedDiff('a\nb', 'a\nc');
    const formatted = formatUnifiedDiff(hunks);
    expect(formatted).toContain(' a');
  });
});
