import { describe, expect, it } from 'vitest';
import { composeApplicationMotiveText } from '../../src/exporters/application-motive.js';

describe('composeApplicationMotiveText', () => {
  it('3 フィールドが揃っている場合に書籍フォーマットの文を生成する', () => {
    const result = composeApplicationMotiveText({
      companyFuture: 'DX 推進による業界変革',
      contributionAction: 'プロダクト開発の高速化',
      leveragedExperience: 'スタートアップでの新規事業立ち上げ経験',
    });
    expect(result).toBe(
      '私はDX 推進による業界変革を達成するために、貴社を志望しています。' +
        '具体的には、プロダクト開発の高速化に貢献すべく、私の経験のスタートアップでの新規事業立ち上げ経験を生かしてまいります。',
    );
  });

  it('全フィールドが空文字の場合は空文字を返す', () => {
    const result = composeApplicationMotiveText({
      companyFuture: '',
      contributionAction: '',
      leveragedExperience: '',
    });
    expect(result).toBe('');
  });

  it('一部が空文字でも空でないフィールドを含む場合はテンプレを展開する', () => {
    const result = composeApplicationMotiveText({
      companyFuture: '持続可能な社会の実現',
      contributionAction: '',
      leveragedExperience: '',
    });
    expect(result).toContain('持続可能な社会の実現');
    expect(result).toContain('貴社を志望しています。');
  });

  it('formattedText は参照先フィールドを変えると別の文章になる', () => {
    const a = composeApplicationMotiveText({
      companyFuture: 'A',
      contributionAction: 'B',
      leveragedExperience: 'C',
    });
    const b = composeApplicationMotiveText({
      companyFuture: 'X',
      contributionAction: 'Y',
      leveragedExperience: 'Z',
    });
    expect(a).not.toBe(b);
  });
});
