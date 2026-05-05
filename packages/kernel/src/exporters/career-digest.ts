import type { JobRequirementMapping } from '../domain/job-requirement-mapping.js';
import type { JobTarget } from '../domain/job-target.js';
import type { LifeTimelineEntry } from '../domain/life-timeline-entry.js';

const CATEGORY_LABEL: Record<LifeTimelineEntry['category'], string> = {
  education: '学び',
  work: '仕事',
  family: '家族',
  health: '健康',
  hobby: '趣味',
  other: 'その他',
};

function formatPeriod(entry: LifeTimelineEntry): string {
  if (entry.yearStart !== null && entry.yearEnd !== null) {
    return entry.yearStart === entry.yearEnd
      ? `${entry.yearStart}`
      : `${entry.yearStart}-${entry.yearEnd}`;
  }
  return `${entry.ageRangeStart}-${entry.ageRangeEnd} 歳`;
}

/**
 * 職務経歴ダイジェスト用の Markdown を生成する。
 *
 * 求人の必須要件 (`JobTarget.requiredSkills`) を順に並べ、各要件に対して
 * `JobRequirementMapping` で紐付けられたユーザーノートと関連 LifeTimelineEntry
 * をメール本文として組み立てる。AI は使わない純関数。
 *
 * 安全な無視ポリシー:
 * - `mappings` のうち `requirementSkillId` が `jobTarget.requiredSkills` の
 *   いずれにも一致しないものは無視される（要件削除との競合を吸収）
 * - `lifeTimelineEntryIds` が `entries` 引数に存在しない場合はスキップされる
 *   （LifeTimelineEntry 削除との競合を吸収）
 * - `appealPoints` が空ならアピールポイントセクションは出力されない
 */
export function toCareerDigestMarkdown(
  jobTarget: JobTarget,
  mappings: JobRequirementMapping[],
  entries: LifeTimelineEntry[],
): string {
  const entryById = new Map(entries.map((e) => [e.id, e]));
  const mappingByReq = new Map(mappings.map((m) => [m.requirementSkillId, m]));

  const lines: string[] = [];

  lines.push(`# 職務経歴ダイジェスト：${jobTarget.companyName} ${jobTarget.jobTitle}`);
  lines.push('');
  lines.push(`${jobTarget.companyName} ご担当者様`);
  lines.push('');
  lines.push(`${jobTarget.jobTitle} のポジションへの応募にあたり、必須要件への対応をまとめます。`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 必須要件への対応');
  lines.push('');

  for (const req of jobTarget.requiredSkills) {
    lines.push(`### ${req.text}`);
    lines.push('');

    const mapping = mappingByReq.get(req.id);
    if (!mapping) {
      lines.push('（関連する経験はまだ紐付けされていません）');
      lines.push('');
      continue;
    }

    if (mapping.userNote.trim() !== '') {
      lines.push(mapping.userNote);
      lines.push('');
    }

    const linkedEntries = mapping.lifeTimelineEntryIds
      .map((id) => entryById.get(id))
      .filter((e): e is LifeTimelineEntry => e !== undefined);

    if (linkedEntries.length > 0) {
      lines.push('#### 関連する経験');
      lines.push('');
      for (const entry of linkedEntries) {
        const period = formatPeriod(entry);
        const category = CATEGORY_LABEL[entry.category];
        lines.push(`##### [${period}] [${category}] ${entry.summary}`);
        lines.push('');
        if (entry.detail.trim() !== '') {
          lines.push(entry.detail);
          lines.push('');
        }
      }
    }
  }

  if (jobTarget.appealPoints.trim() !== '') {
    lines.push('---');
    lines.push('');
    lines.push('## アピールポイント');
    lines.push('');
    lines.push(jobTarget.appealPoints);
    lines.push('');
  }

  return lines.join('\n');
}
