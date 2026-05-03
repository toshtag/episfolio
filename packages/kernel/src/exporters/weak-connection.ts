import type {
  ContactStatus,
  WeakConnection,
  WeakConnectionCategory,
} from '../domain/weak-connection.js';

const PLACEHOLDER = '（未記入）';

const CATEGORY_LABELS: Record<WeakConnectionCategory, string> = {
  student_days: '学生時代の仲間（バイト・ゼミ・サークル）',
  family_network: '親族の仕事仲間',
  business_card: '名刺交換した顧客・取引先',
  hobby: '趣味のつながり',
  sns: 'SNS',
};

const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  not_contacted: '未連絡',
  contacted: '連絡済み',
  replied: '返信あり',
};

function val(s: string | null | undefined): string {
  if (s == null) return PLACEHOLDER;
  return s.trim() !== '' ? s : PLACEHOLDER;
}

function renderRecord(record: WeakConnection, index: number): string {
  const lines: string[] = [];
  const nameLabel = record.name.trim() !== '' ? record.name : PLACEHOLDER;
  lines.push(`#### ${index + 1}. ${nameLabel}`);
  lines.push('');
  lines.push(`- **関係性**: ${val(record.relation)}`);
  lines.push(`- **連絡状況**: ${CONTACT_STATUS_LABELS[record.contactStatus]}`);
  lines.push(`- **転職の糸口**: ${val(record.prospectNote)}`);
  if (record.note != null && record.note.trim() !== '') {
    lines.push(`- **メモ**: ${record.note}`);
  }
  lines.push('');
  return lines.join('\n');
}

export function toWeakConnectionMarkdown(records: WeakConnection[]): string {
  const lines: string[] = [];
  lines.push('# 弱いつながり（半径5メートル以内の知り合い）');
  lines.push('');

  if (records.length === 0) {
    lines.push('（記録なし）');
    lines.push('');
    return lines.join('\n');
  }

  const categories: WeakConnectionCategory[] = [
    'student_days',
    'family_network',
    'business_card',
    'hobby',
    'sns',
  ];

  for (const cat of categories) {
    const group = records.filter((r) => r.category === cat);
    if (group.length === 0) continue;
    lines.push(`### ${CATEGORY_LABELS[cat]}`);
    lines.push('');
    group.forEach((record, index) => {
      lines.push(renderRecord(record, index));
    });
  }

  return lines.join('\n');
}
