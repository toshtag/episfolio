import { describe, expect, it } from 'vitest';
import type { CompanyCertification } from '../../src/domain/company-certification.js';
import { toCompanyCertificationMarkdown } from '../../src/exporters/company-certification.js';

const buildRecord = (overrides: Partial<CompanyCertification> = {}): CompanyCertification => ({
  id: '01CC00001',
  jobTargetId: '01JT00001',
  hasKurumin: true,
  hasPlatinumKurumin: false,
  hasTomoni: true,
  eruboshiLevel: 3,
  hasPlatinumEruboshi: false,
  note: 'くるみん・トモニン取得済み。えるぼし認定レベル3。',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('toCompanyCertificationMarkdown', () => {
  it('H1 タイトルを含む', () => {
    expect(toCompanyCertificationMarkdown(buildRecord())).toContain('# 認定・認証チェック');
  });

  it('くるみん認定セクションを含む', () => {
    expect(toCompanyCertificationMarkdown(buildRecord())).toContain(
      '## くるみん認定（子育て支援）',
    );
  });

  it('トモニンマークセクションを含む', () => {
    expect(toCompanyCertificationMarkdown(buildRecord())).toContain(
      '## トモニンマーク（介護支援）',
    );
  });

  it('えるぼし認定セクションを含む', () => {
    expect(toCompanyCertificationMarkdown(buildRecord())).toContain(
      '## えるぼし認定（女性活躍推進）',
    );
  });

  it('総合メモセクションを含む', () => {
    expect(toCompanyCertificationMarkdown(buildRecord())).toContain('## 総合メモ');
  });

  it('hasKurumin が true のとき「くるみん認定取得」を出力する', () => {
    expect(
      toCompanyCertificationMarkdown(buildRecord({ hasKurumin: true, hasPlatinumKurumin: false })),
    ).toContain('くるみん認定取得');
  });

  it('hasPlatinumKurumin が true のとき「プラチナくるみん」を出力する', () => {
    expect(toCompanyCertificationMarkdown(buildRecord({ hasPlatinumKurumin: true }))).toContain(
      'プラチナくるみん',
    );
  });

  it('hasKurumin が false のとき「❌ 未取得」を出力する（くるみんセクション）', () => {
    const md = toCompanyCertificationMarkdown(
      buildRecord({ hasKurumin: false, hasPlatinumKurumin: false }),
    );
    const section = md.split('## くるみん認定')[1].split('## ')[0];
    expect(section).toContain('❌ 未取得');
  });

  it('hasTomoni が true のとき「🤝 トモニンマーク取得」を出力する', () => {
    expect(toCompanyCertificationMarkdown(buildRecord({ hasTomoni: true }))).toContain(
      '🤝 トモニンマーク取得',
    );
  });

  it('hasTomoni が false のとき「❌ 未取得」を出力する', () => {
    const md = toCompanyCertificationMarkdown(buildRecord({ hasTomoni: false }));
    const section = md.split('## トモニンマーク')[1].split('## ')[0];
    expect(section).toContain('❌ 未取得');
  });

  it('eruboshiLevel が 3 のとき「レベル3」を出力する', () => {
    expect(toCompanyCertificationMarkdown(buildRecord({ eruboshiLevel: 3 }))).toContain('レベル3');
  });

  it('eruboshiLevel が 2 のとき「レベル2」を出力する', () => {
    expect(toCompanyCertificationMarkdown(buildRecord({ eruboshiLevel: 2 }))).toContain('レベル2');
  });

  it('eruboshiLevel が 1 のとき「レベル1」を出力する', () => {
    expect(toCompanyCertificationMarkdown(buildRecord({ eruboshiLevel: 1 }))).toContain('レベル1');
  });

  it('eruboshiLevel が null のとき「えるぼし未認定」を出力する', () => {
    expect(
      toCompanyCertificationMarkdown(
        buildRecord({ eruboshiLevel: null, hasPlatinumEruboshi: false }),
      ),
    ).toContain('えるぼし未認定');
  });

  it('hasPlatinumEruboshi が true のとき「プラチナえるぼし認定」を出力する', () => {
    expect(toCompanyCertificationMarkdown(buildRecord({ hasPlatinumEruboshi: true }))).toContain(
      'プラチナえるぼし認定',
    );
  });

  it('note の内容が出力される', () => {
    const md = toCompanyCertificationMarkdown(buildRecord());
    expect(md).toContain('くるみん・トモニン取得済み');
  });

  it('note が null のとき「（未記入）」になる', () => {
    const md = toCompanyCertificationMarkdown(buildRecord({ note: null }));
    const sections = md.split('## 総合メモ');
    expect(sections[1]).toContain('（未記入）');
  });

  it('出力に "null" 文字列を含まない', () => {
    const record = buildRecord({
      eruboshiLevel: null,
      note: null,
    });
    expect(toCompanyCertificationMarkdown(record)).not.toContain('null');
  });
});
