import type { Episode } from '../domain/episode.js';
import type { JobRequirementMapping } from '../domain/job-requirement-mapping.js';
import type { JobTarget } from '../domain/job-target.js';

/**
 * 書籍 3-11「職務経歴ダイジェスト」用の Markdown を生成する。
 *
 * 求人の必須要件 (`JobTarget.requiredSkills`) を順に並べ、各要件に対して
 * `JobRequirementMapping` で紐付けられたユーザーノートと関連 Episode を
 * メール本文として組み立てる。AI は使わない純関数。
 *
 * 安全な無視ポリシー:
 * - `mappings` のうち `requirementSkillId` が `jobTarget.requiredSkills` の
 *   いずれにも一致しないものは無視される（要件削除との競合を吸収）
 * - `episodeIds` が `episodes` 引数に存在しない場合はスキップされる
 *   （Episode 削除との競合を吸収）
 * - `appealPoints` が空ならアピールポイントセクションは出力されない
 */
export function toCareerDigestMarkdown(
  jobTarget: JobTarget,
  mappings: JobRequirementMapping[],
  episodes: Episode[],
): string {
  const episodeById = new Map(episodes.map((e) => [e.id, e]));
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
      lines.push('（このエピソードはまだ紐付けされていません）');
      lines.push('');
      continue;
    }

    if (mapping.userNote.trim() !== '') {
      lines.push(mapping.userNote);
      lines.push('');
    }

    const linkedEpisodes = mapping.episodeIds
      .map((id) => episodeById.get(id))
      .filter((e): e is Episode => e !== undefined);

    if (linkedEpisodes.length > 0) {
      lines.push('#### 関連エピソード');
      lines.push('');
      for (const ep of linkedEpisodes) {
        lines.push(`##### ${ep.title}`);
        lines.push('');
        if (ep.background.trim() !== '') {
          lines.push(`- **背景**: ${ep.background}`);
        }
        if (ep.action.trim() !== '') {
          lines.push(`- **取り組み**: ${ep.action}`);
        }
        if (ep.result.trim() !== '') {
          lines.push(`- **結果**: ${ep.result}`);
        }
        lines.push('');
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
