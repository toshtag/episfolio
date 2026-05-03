import type { CompanyCertification } from '../domain/company-certification.js';

const PLACEHOLDER = '（未記入）';

function val(s: string | null | undefined): string {
  if (s == null) return PLACEHOLDER;
  return s.trim() !== '' ? s : PLACEHOLDER;
}

function flag(b: boolean, yes: string, no: string): string {
  return b ? yes : no;
}

function eruboshiLabel(level: number | null, hasPlatinum: boolean): string {
  if (hasPlatinum) return '⭐⭐⭐⭐ プラチナえるぼし認定';
  if (level === 3) return '⭐⭐⭐ えるぼし認定（レベル3）';
  if (level === 2) return '⭐⭐ えるぼし認定（レベル2）';
  if (level === 1) return '⭐ えるぼし認定（レベル1）';
  return '❌ えるぼし未認定';
}

export function toCompanyCertificationMarkdown(record: CompanyCertification): string {
  const lines: string[] = [];
  lines.push('# 認定・認証チェック');
  lines.push('');

  lines.push('## くるみん認定（子育て支援）');
  lines.push('');
  lines.push(flag(record.hasPlatinumKurumin, '🌸 プラチナくるみん認定取得', flag(record.hasKurumin, '🌸 くるみん認定取得', '❌ 未取得')));
  lines.push('');

  lines.push('## トモニンマーク（介護支援）');
  lines.push('');
  lines.push(flag(record.hasTomoni, '🤝 トモニンマーク取得', '❌ 未取得'));
  lines.push('');

  lines.push('## えるぼし認定（女性活躍推進）');
  lines.push('');
  lines.push(eruboshiLabel(record.eruboshiLevel, record.hasPlatinumEruboshi));
  lines.push('');

  lines.push('## 総合メモ');
  lines.push('');
  lines.push(val(record.note));
  lines.push('');

  return lines.join('\n');
}
