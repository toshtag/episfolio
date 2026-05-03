import type {
  BusinessUnitType,
  BusinessUnitTypeMatch,
} from '../domain/business-unit-type-match.js';

const PLACEHOLDER = '（未記入）';

function val(s: string | null | undefined): string {
  if (s == null) return PLACEHOLDER;
  return s.trim() !== '' ? s : PLACEHOLDER;
}

function unitTypeLabel(type: BusinessUnitType | null): string {
  switch (type) {
    case 'star':
      return '花形事業部（スター）';
    case 'support':
      return '縁の下の力持ち事業部';
    case 'challenge':
      return 'チャレンジ事業部';
    case 'turnaround':
      return '立て直し事業部';
    default:
      return PLACEHOLDER;
  }
}

export function toBusinessUnitTypeMatchMarkdown(record: BusinessUnitTypeMatch): string {
  const lines: string[] = [];
  lines.push('# 事業部タイプ相性チェック');
  lines.push('');

  lines.push('## 企業の事業部タイプ');
  lines.push('');
  lines.push(unitTypeLabel(record.companyUnitType));
  lines.push('');

  lines.push('## 自己タイプ');
  lines.push('');
  lines.push(unitTypeLabel(record.selfType));
  lines.push('');

  lines.push('## タイプ一致確認');
  lines.push('');
  lines.push(record.isMatchConfirmed ? '✅ 一致確認済み' : '❌ 未確認');
  lines.push('');

  lines.push('## マッチング分析メモ');
  lines.push('');
  lines.push(val(record.matchNote));
  lines.push('');

  lines.push('## 志望動機ドラフト');
  lines.push('');
  lines.push(val(record.motivationDraft));
  lines.push('');

  lines.push('## 総合メモ');
  lines.push('');
  lines.push(val(record.note));
  lines.push('');

  return lines.join('\n');
}
