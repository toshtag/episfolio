import type { StrengthArrow, StrengthArrowType } from '../domain/strength-arrow.js';

const PLACEHOLDER = '（未記入）';
const SECTION_LABELS: Record<StrengthArrowType, string> = {
  interest: '興味（質問された経験）',
  evaluation: '評価（褒められた経験）',
  request: '依頼（頼まれた経験）',
};
const TYPE_ORDER: StrengthArrowType[] = ['interest', 'evaluation', 'request'];

function val(s: string | null | undefined): string {
  if (s == null) return PLACEHOLDER;
  return s.trim() !== '' ? s : PLACEHOLDER;
}

function renderArrow(arrow: StrengthArrow, index: number): string {
  const lines: string[] = [];
  lines.push(`### ${index + 1}. ${val(arrow.description)}`);
  lines.push('');
  lines.push(`- **相手**: ${val(arrow.source)}`);
  if (arrow.occurredAt != null) {
    lines.push(`- **時期**: ${arrow.occurredAt}`);
  }
  if (arrow.relatedEpisodeIds.length > 0) {
    lines.push(`- **関連エピソード**: ${arrow.relatedEpisodeIds.join(', ')}`);
  }
  if (arrow.note != null && arrow.note.trim() !== '') {
    lines.push(`- **メモ**: ${arrow.note}`);
  }
  lines.push('');
  return lines.join('\n');
}

export function toStrengthArrowMarkdown(arrows: StrengthArrow[]): string {
  const lines: string[] = [];
  lines.push('# 三つの矢印（強み発掘）');
  lines.push('');

  const grouped = new Map<StrengthArrowType, StrengthArrow[]>();
  for (const type of TYPE_ORDER) {
    grouped.set(type, []);
  }
  for (const arrow of arrows) {
    grouped.get(arrow.type)?.push(arrow);
  }

  for (const type of TYPE_ORDER) {
    const group = grouped.get(type) ?? [];
    lines.push(`## ${SECTION_LABELS[type]}`);
    lines.push('');
    if (group.length === 0) {
      lines.push('（記録なし）');
      lines.push('');
    } else {
      group.forEach((arrow, index) => {
        lines.push(renderArrow(arrow, index));
      });
    }
  }

  return lines.join('\n');
}
