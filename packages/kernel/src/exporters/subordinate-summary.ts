import type { SubordinateRow, SubordinateSummary } from '../domain/subordinate-summary.js';

const PLACEHOLDER = '（未記入）';

function val(s: string): string {
  return s.trim() !== '' ? s : PLACEHOLDER;
}

function renderRow(row: SubordinateRow, index: number, maskNames: boolean): string[] {
  const lines: string[] = [];
  const displayName = maskNames || row.name.trim() === '' ? `部下 ${index + 1}` : row.name;

  lines.push(`## ${index + 1}. ${displayName}`);
  lines.push('');
  lines.push(`**強み**: ${val(row.strength)}`);
  lines.push(`**実績**: ${val(row.achievement)}`);
  lines.push(`**チーム内の役割・性格**: ${val(row.teamRole)}`);
  lines.push('');
  lines.push('### 課題と指導、変化');
  lines.push('');
  lines.push(`- **課題**: ${val(row.challenge)}`);
  lines.push(`- **指導**: ${val(row.guidance)}`);
  lines.push(`- **変化**: ${val(row.change)}`);
  lines.push('');
  lines.push(`**将来的に進みたい仕事**: ${val(row.futureCareer)}`);
  lines.push('');

  return lines;
}

export type SubordinateSummaryMarkdownOptions = {
  maskNames?: boolean;
};

export function toSubordinateSummaryMarkdown(
  summary: SubordinateSummary,
  options: SubordinateSummaryMarkdownOptions = {},
): string {
  const maskNames = options.maskNames ?? false;
  const lines: string[] = [];

  const heading = summary.title.trim() !== '' ? summary.title : '部下まとめシート';
  lines.push(`# ${heading}`);
  lines.push('');

  if (summary.subordinates.length === 0) {
    lines.push('（部下情報なし）');
    lines.push('');
  } else {
    summary.subordinates.forEach((row, index) => {
      if (index > 0) {
        lines.push('---');
        lines.push('');
      }
      lines.push(...renderRow(row, index, maskNames));
    });
  }

  if (summary.memo.trim() !== '') {
    lines.push('## メモ');
    lines.push('');
    lines.push(summary.memo);
    lines.push('');
  }

  return lines.join('\n');
}
