import type { GrowthCycleNote, GrowthStage } from '../domain/growth-cycle-note.js';

const PLACEHOLDER = '（未記入）';

function val(s: string | null | undefined): string {
  if (s == null) return PLACEHOLDER;
  return s.trim() !== '' ? s : PLACEHOLDER;
}

function stageLabel(stage: GrowthStage | null): string {
  switch (stage) {
    case 'startup':
      return '🌱 創業期（売上が計上されていない段階）';
    case 'growth':
      return '📈 成長初期（売上が計上されているが黒字化していない段階）';
    case 'stable_expansion':
      return '🏢 安定・拡大期（売上が計上され、少なくとも一期は黒字化した段階）';
    default:
      return PLACEHOLDER;
  }
}

export function toGrowthCycleNoteMarkdown(record: GrowthCycleNote): string {
  const lines: string[] = [];
  lines.push('# 企業の成長サイクル分析');
  lines.push('');

  lines.push('## 成長段階');
  lines.push('');
  lines.push(stageLabel(record.growthStage));
  lines.push('');

  lines.push('## 成長段階のメモ');
  lines.push('');
  lines.push(val(record.stageNote));
  lines.push('');

  lines.push('## 長期就労の適性');
  lines.push('');
  lines.push(
    record.isLongTermSuitable ? '✅ 腰を据えて長く働ける企業' : '⚠️ 長期就労には注意が必要',
  );
  lines.push('');

  lines.push('## 総合メモ');
  lines.push('');
  lines.push(val(record.note));
  lines.push('');

  return lines.join('\n');
}
