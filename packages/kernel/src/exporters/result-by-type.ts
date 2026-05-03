import type { ResultByType, ResultEntry, ResultType } from '../domain/result-by-type.js';

const PLACEHOLDER = '（未記入）';

const RESULT_TYPE_LABELS: Record<ResultType, string> = {
  revenue: '① 売上を上げる',
  cost: '② コストを下げる',
  both: '③ 売上とコストの両方に影響',
};

const RESULT_TYPE_ORDER: ResultType[] = ['revenue', 'cost', 'both'];

const SKILL_TYPE_LABELS = {
  outcome: '成果スキル',
  cause: '原因スキル',
} as const;

function val(s: string | null | undefined): string {
  if (s == null) return PLACEHOLDER;
  return s.trim() !== '' ? s : PLACEHOLDER;
}

function renderEntry(entry: ResultEntry, index: number): string {
  const lines: string[] = [];
  const skillLabel = SKILL_TYPE_LABELS[entry.skillType];
  lines.push(`#### ${index + 1}. [${skillLabel}]`);
  lines.push('');
  if (entry.situation.trim()) {
    lines.push(`- **状況**: ${val(entry.situation)}`);
  }
  lines.push(`- **行動**: ${val(entry.action)}`);
  lines.push(`- **結果**: ${val(entry.result)}`);
  if (entry.quantification != null && entry.quantification.trim() !== '') {
    lines.push(`- **数値化**: ${entry.quantification}`);
  }
  if (entry.note != null && entry.note.trim() !== '') {
    lines.push(`- **メモ**: ${entry.note}`);
  }
  lines.push('');
  return lines.join('\n');
}

function renderResultByType(record: ResultByType): string {
  const lines: string[] = [];
  lines.push(`## ${val(record.title)}`);
  lines.push('');

  const grouped = new Map<ResultType, ResultEntry[]>();
  for (const type of RESULT_TYPE_ORDER) {
    grouped.set(type, []);
  }
  for (const entry of record.entries) {
    grouped.get(entry.resultType)?.push(entry);
  }

  for (const type of RESULT_TYPE_ORDER) {
    const group = grouped.get(type) ?? [];
    if (group.length === 0) continue;
    lines.push(`### ${RESULT_TYPE_LABELS[type]}`);
    lines.push('');
    group.forEach((entry, index) => {
      lines.push(renderEntry(entry, index));
    });
  }

  if (record.memo.trim()) {
    lines.push(`**メモ**: ${record.memo}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function toResultByTypeMarkdown(records: ResultByType[]): string {
  const lines: string[] = [];
  lines.push('# 3 タイプの実績（利益＝売上－コスト）');
  lines.push('');

  if (records.length === 0) {
    lines.push('（記録なし）');
    lines.push('');
    return lines.join('\n');
  }

  for (const record of records) {
    lines.push(renderResultByType(record));
  }

  return lines.join('\n');
}
