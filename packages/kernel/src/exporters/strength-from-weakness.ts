import type { BlankType, StrengthFromWeakness } from '../domain/strength-from-weakness.js';

const PLACEHOLDER = '（未記入）';

const BLANK_TYPE_LABELS: Record<BlankType, string> = {
  leave: '休職',
  unemployed: '無職期間',
  early_resign: '早期退職',
  other: 'その他',
};

function val(s: string | null | undefined): string {
  if (s == null) return PLACEHOLDER;
  return s.trim() !== '' ? s : PLACEHOLDER;
}

function renderRecord(record: StrengthFromWeakness, index: number): string {
  const lines: string[] = [];
  lines.push(`### ${index + 1}. ${val(record.weaknessLabel)}`);
  lines.push('');
  if (record.blankType != null) {
    lines.push(`- **種別**: ${BLANK_TYPE_LABELS[record.blankType]}`);
  }
  if (record.background.trim() !== '') {
    lines.push(`- **背景**: ${record.background}`);
  }
  lines.push(`- **発想転換**: ${val(record.reframe)}`);
  lines.push(`- **受け入れてくれる会社像**: ${val(record.targetCompanyProfile)}`);
  if (record.note != null && record.note.trim() !== '') {
    lines.push(`- **メモ**: ${record.note}`);
  }
  lines.push('');
  return lines.join('\n');
}

export function toStrengthFromWeaknessMarkdown(records: StrengthFromWeakness[]): string {
  const lines: string[] = [];
  lines.push('# 弱みを武器に変える（発想転換）');
  lines.push('');
  if (records.length === 0) {
    lines.push('（記録なし）');
    lines.push('');
  } else {
    records.forEach((record, index) => {
      lines.push(renderRecord(record, index));
    });
  }
  return lines.join('\n');
}
