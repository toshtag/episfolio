import type {
  RecruitmentImpression,
  SensoryObservation,
} from '../domain/recruitment-impression.js';

const PLACEHOLDER = '（未記入）';

function val(s: string | null | undefined): string {
  if (s == null) return PLACEHOLDER;
  return s.trim() !== '' ? s : PLACEHOLDER;
}

function renderSensoryObservation(obs: SensoryObservation, index: number): string {
  const lines: string[] = [];
  lines.push(`### ${index + 1}. ${obs.category || '（カテゴリ未設定）'}`);
  lines.push('');
  lines.push(val(obs.note));
  lines.push('');
  return lines.join('\n');
}

export function toRecruitmentImpressionMarkdown(record: RecruitmentImpression): string {
  const lines: string[] = [];
  lines.push('# 採用印象メモ');
  lines.push('');

  lines.push('## 採用選考プロセス観察');
  lines.push('');
  lines.push(val(record.selectionProcessNote));
  lines.push('');

  lines.push('## オフィス・職場の雰囲気');
  lines.push('');
  lines.push(val(record.officeAtmosphere));
  lines.push('');

  lines.push('## 五感観察メモ');
  lines.push('');
  if (record.sensoryObservations.length === 0) {
    lines.push('（記録なし）');
    lines.push('');
  } else {
    record.sensoryObservations.forEach((obs, index) => {
      lines.push(renderSensoryObservation(obs, index));
    });
  }

  lines.push('## ライフスタイル適合メモ');
  lines.push('');
  lines.push(val(record.lifestyleCompatibilityNote));
  lines.push('');

  lines.push('## 危険信号メモ');
  lines.push('');
  lines.push(val(record.redFlagsNote));
  lines.push('');

  lines.push('## 総合印象');
  lines.push('');
  lines.push(val(record.overallImpression));
  lines.push('');

  return lines.join('\n');
}
