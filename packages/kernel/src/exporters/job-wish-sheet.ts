import type { JobWishCompany, JobWishSheet } from '../domain/job-wish-sheet.js';

function renderConditions(sheet: JobWishSheet): string[] {
  const lines: string[] = [];
  if (sheet.desiredIndustry.trim() !== '') lines.push(`- 希望業界: ${sheet.desiredIndustry}`);
  if (sheet.desiredRole.trim() !== '') lines.push(`- 希望職種: ${sheet.desiredRole}`);
  if (sheet.desiredSalary.trim() !== '') lines.push(`- 希望年収: ${sheet.desiredSalary}`);
  if (sheet.desiredLocation.trim() !== '') lines.push(`- 希望勤務地: ${sheet.desiredLocation}`);
  if (sheet.desiredWorkStyle.trim() !== '') lines.push(`- 希望働き方: ${sheet.desiredWorkStyle}`);
  if (sheet.otherConditions.trim() !== '') lines.push(`- その他条件: ${sheet.otherConditions}`);
  return lines;
}

function renderCompanies(companies: JobWishCompany[]): string[] {
  if (companies.length === 0) return [];
  return companies.map((c) => (c.note.trim() !== '' ? `- ${c.name} — ${c.note}` : `- ${c.name}`));
}

export function toJobWishSheetMarkdown(sheet: JobWishSheet): string {
  const lines: string[] = [];

  const heading = sheet.title.trim() !== '' ? sheet.title : '転職希望シート';
  lines.push(`# ${heading}`);
  lines.push('');

  lines.push('## 希望条件');
  lines.push('');
  const conditionLines = renderConditions(sheet);
  if (conditionLines.length > 0) {
    lines.push(...conditionLines);
  } else {
    lines.push('（未入力）');
  }
  lines.push('');

  lines.push('## ■ A グループ（最優先）');
  lines.push('');
  const aLines = renderCompanies(sheet.groupACompanies);
  if (aLines.length > 0) {
    lines.push(...aLines);
  } else {
    lines.push('（なし）');
  }
  lines.push('');

  lines.push('## ■ B グループ（興味あり）');
  lines.push('');
  const bLines = renderCompanies(sheet.groupBCompanies);
  if (bLines.length > 0) {
    lines.push(...bLines);
  } else {
    lines.push('（なし）');
  }
  lines.push('');

  lines.push('## ■ C グループ（ストレッチ・保険）');
  lines.push('');
  const cLines = renderCompanies(sheet.groupCCompanies);
  if (cLines.length > 0) {
    lines.push(...cLines);
  } else {
    lines.push('（なし）');
  }
  lines.push('');

  if (sheet.memo.trim() !== '') {
    lines.push('## メモ');
    lines.push('');
    lines.push(sheet.memo);
    lines.push('');
  }

  return lines.join('\n');
}
