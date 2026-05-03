import type { HiddenGemNote } from '../domain/hidden-gem-note.js';

const PLACEHOLDER = '（未記入）';

function val(s: string | null | undefined): string {
  if (s == null) return PLACEHOLDER;
  return s.trim() !== '' ? s : PLACEHOLDER;
}

function flag(b: boolean, yes: string, no: string): string {
  return b ? yes : no;
}

export function toHiddenGemNoteMarkdown(record: HiddenGemNote): string {
  const lines: string[] = [];
  lines.push('# 隠れた優良企業チェック');
  lines.push('');

  lines.push('## GNT企業100選への掲載');
  lines.push('');
  lines.push(flag(record.isGntListed, '✅ 掲載あり', '❌ 掲載なし'));
  lines.push('');

  lines.push('## 検索キーワード');
  lines.push('');
  lines.push(val(record.nicheKeywords));
  lines.push('');

  lines.push('## モンスター企業になりにくい仕組み');
  lines.push('');
  lines.push(flag(record.hasAntiMonsterMechanism, '✅ 仕組みあり', '❌ 確認できず'));
  lines.push('');
  lines.push(val(record.mechanismNote));
  lines.push('');

  lines.push('## 転職サイトでの採用状況');
  lines.push('');
  lines.push(
    flag(
      record.isHiringOnJobSites,
      '📋 転職サイトで募集中',
      '🔍 転職サイトに掲載なし（直接コンタクト要）',
    ),
  );
  lines.push('');

  lines.push('## 直接コンタクトのメモ');
  lines.push('');
  lines.push(val(record.directContactNote));
  lines.push('');

  lines.push('## 総合メモ');
  lines.push('');
  lines.push(val(record.note));
  lines.push('');

  return lines.join('\n');
}
