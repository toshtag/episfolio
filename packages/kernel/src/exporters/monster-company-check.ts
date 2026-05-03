import type { MonsterCompanyCheck, ResignationEntry } from '../domain/monster-company-check.js';

const PLACEHOLDER = '（未記入）';

function val(s: string | null | undefined): string {
  if (s == null) return PLACEHOLDER;
  return s.trim() !== '' ? s : PLACEHOLDER;
}

function renderResignationEntry(entry: ResignationEntry, index: number): string {
  const lines: string[] = [];
  lines.push(`### ${index + 1}. 退職エントリ`);
  lines.push('');
  lines.push(`- **URL**: ${val(entry.url)}`);
  lines.push(`- **要約**: ${val(entry.summary)}`);
  lines.push('');
  return lines.join('\n');
}

export function toMonsterCompanyCheckMarkdown(record: MonsterCompanyCheck): string {
  const lines: string[] = [];
  lines.push('# モンスター企業チェック');
  lines.push('');

  lines.push('## 厚労省公表事案');
  lines.push('');
  lines.push(`- **公表日**: ${val(record.casePublicationDate)}`);
  lines.push(`- **違反法条**: ${val(record.violationLaw)}`);
  lines.push(`- **事案概要**: ${val(record.caseSummary)}`);
  lines.push(`- **公表事案 URL**: ${val(record.mhlwCaseUrl)}`);
  lines.push('');

  lines.push('## 退職エントリ');
  lines.push('');
  if (record.resignationEntries.length === 0) {
    lines.push('（記録なし）');
    lines.push('');
  } else {
    record.resignationEntries.forEach((entry, index) => {
      lines.push(renderResignationEntry(entry, index));
    });
  }

  lines.push('## 隠れモンスター部署メモ');
  lines.push('');
  lines.push(val(record.hiddenMonsterNote));
  lines.push('');

  return lines.join('\n');
}
