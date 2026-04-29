import type { LifeTimelineEntry } from '../domain/life-timeline-entry.js';

const CATEGORY_LABEL: Record<LifeTimelineEntry['category'], string> = {
  education: '学業',
  work: '仕事',
  family: '家族',
  health: '健康',
  hobby: '趣味',
  other: 'その他',
};

export function toJibunTaizenMarkdown(entries: LifeTimelineEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.ageRangeStart - b.ageRangeStart);

  const header = `# 自分大全\n\n| 年齢 | 年 | カテゴリ | 概要 | タグ |\n|------|-----|---------|------|------|\n`;

  const rows = sorted.map((e) => {
    const age =
      e.ageRangeStart === e.ageRangeEnd
        ? `${e.ageRangeStart}歳`
        : `${e.ageRangeStart}〜${e.ageRangeEnd}歳`;
    const year =
      e.yearStart == null
        ? ''
        : e.yearEnd == null || e.yearStart === e.yearEnd
          ? `${e.yearStart}`
          : `${e.yearStart}〜${e.yearEnd}`;
    const category = CATEGORY_LABEL[e.category];
    const tags = e.tags.join(', ');
    return `| ${age} | ${year} | ${category} | ${e.summary} | ${tags} |`;
  });

  return header + rows.join('\n') + '\n';
}
