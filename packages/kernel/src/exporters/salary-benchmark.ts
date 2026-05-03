import type { SalaryBenchmark } from '../domain/salary-benchmark.js';

const PLACEHOLDER = '（未記入）';

function val(s: string | null | undefined): string {
  if (s == null) return PLACEHOLDER;
  return s.trim() !== '' ? s : PLACEHOLDER;
}

function formatSalary(amount: number | null): string {
  if (amount == null) return PLACEHOLDER;
  return `${amount.toLocaleString('ja-JP')} 万円`;
}

export function toSalaryBenchmarkMarkdown(record: SalaryBenchmark): string {
  const lines: string[] = [];
  lines.push('# 給料分析');
  lines.push('');

  lines.push('## 企業の平均年間給与');
  lines.push('');
  lines.push(formatSalary(record.averageSalaryAtCompany));
  lines.push('');

  lines.push('## 求人票の年収レンジ');
  lines.push('');
  if (record.expectedSalaryRangeMin == null && record.expectedSalaryRangeMax == null) {
    lines.push(PLACEHOLDER);
  } else {
    const min =
      record.expectedSalaryRangeMin != null
        ? `${record.expectedSalaryRangeMin.toLocaleString('ja-JP')} 万円`
        : '下限不明';
    const max =
      record.expectedSalaryRangeMax != null
        ? `${record.expectedSalaryRangeMax.toLocaleString('ja-JP')} 万円`
        : '上限不明';
    lines.push(`${min} 〜 ${max}`);
  }
  lines.push('');

  lines.push('## 自分の給与相場');
  lines.push('');
  lines.push(formatSalary(record.personalSalaryBenchmark));
  lines.push('');

  lines.push('## 「見合わない企業」フラグ');
  lines.push('');
  lines.push(record.isMismatchedCompany ? '⚠️ 見合わない企業' : '✅ 問題なし');
  lines.push('');

  lines.push('## 参照情報源');
  lines.push('');
  lines.push(val(record.dataSource));
  lines.push('');

  lines.push('## メモ');
  lines.push('');
  lines.push(val(record.note));
  lines.push('');

  return lines.join('\n');
}
