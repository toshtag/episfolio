import type { MicrochopSkill } from '../domain/microchop-skill.js';

const PLACEHOLDER = '（未記入）';

function val(s: string | null | undefined): string {
  if (s == null) return PLACEHOLDER;
  return s.trim() !== '' ? s : PLACEHOLDER;
}

function renderRecord(record: MicrochopSkill, index: number): string {
  const lines: string[] = [];
  lines.push(`### ${index + 1}. ${val(record.jobTitle)}（${val(record.industry)}）`);
  lines.push('');

  const transferable = record.tasks.filter((t) => t.transferable);
  const notTransferable = record.tasks.filter((t) => !t.transferable);

  if (record.tasks.length > 0) {
    lines.push('#### みじん切りタスク');
    lines.push('');
    if (transferable.length > 0) {
      lines.push('**他業界でも通用するタスク**');
      for (const t of transferable) {
        lines.push(`- ${t.label}`);
      }
      lines.push('');
    }
    if (notTransferable.length > 0) {
      lines.push('**職種・業界固有のタスク**');
      for (const t of notTransferable) {
        lines.push(`- ${t.label}`);
      }
      lines.push('');
    }
  }

  lines.push(`#### 汎用スキルまとめ`);
  lines.push('');
  lines.push(val(record.transferableSkills));
  lines.push('');

  if (record.note != null && record.note.trim() !== '') {
    lines.push(`#### メモ`);
    lines.push('');
    lines.push(record.note);
    lines.push('');
  }

  return lines.join('\n');
}

export function toMicrochopSkillMarkdown(records: MicrochopSkill[]): string {
  const lines: string[] = [];
  lines.push('# 仕事のみじん切り（職種名の檻から出る）');
  lines.push('');
  if (records.length === 0) {
    lines.push('（記録なし）');
    lines.push('');
  } else {
    records.forEach((record, index) => {
      lines.push(renderRecord(record, index));
    });
  }
  return lines.join('\n');
}
