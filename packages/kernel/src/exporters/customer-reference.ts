import type { CustomerReference } from '../domain/customer-reference.js';

const B2B_LABELS: Array<{ key: keyof CustomerReference; label: string }> = [
  { key: 'industry', label: '業界' },
  { key: 'companyScale', label: '会社規模' },
  { key: 'counterpartRole', label: '直接コミュニケーションを取る相手の役職' },
  { key: 'typicalRequests', label: 'よく受ける要求・リクエスト' },
];

const B2C_LABELS: Array<{ key: keyof CustomerReference; label: string }> = [
  { key: 'ageRange', label: '年齢層' },
  { key: 'familyStatus', label: '家族構成' },
  { key: 'residence', label: '居住地' },
  { key: 'incomeRange', label: '収入帯' },
];

const EXPERIENCE_LABELS: Array<{ key: keyof CustomerReference; label: string }> = [
  { key: 'hardestExperience', label: '顧客の厳しさを感じた経験' },
  { key: 'claimContent', label: '受けたクレームの内容' },
  { key: 'responseTime', label: '対応にかかった時間' },
];

const PLACEHOLDER = '（未記入）';

function renderRows(
  ref: CustomerReference,
  labels: Array<{ key: keyof CustomerReference; label: string }>,
): string {
  const rows = labels.map(({ key, label }) => {
    const value = ref[key];
    const text = typeof value === 'string' && value.length > 0 ? value : PLACEHOLDER;
    return `| ${label} | ${text} |`;
  });
  return ['| 項目 | 内容 |', '|---|---|', ...rows].join('\n');
}

export function toCustomerReferenceMarkdown(ref: CustomerReference): string {
  const titleSubject = ref.customerLabel ?? ref.companyName;
  const lines: string[] = [];

  lines.push(`# 顧客リファレンス — ${titleSubject}`);
  lines.push('');
  lines.push(`**所属企業**: ${ref.companyName}`);
  lines.push(`**担当期間**: ${ref.period}`);
  lines.push(`**顧客タイプ**: ${ref.customerType === 'b2b' ? 'BtoB' : 'BtoC'}`);
  lines.push('');

  lines.push('## 顧客の属性と傾向分析');
  lines.push('');
  lines.push(renderRows(ref, ref.customerType === 'b2b' ? B2B_LABELS : B2C_LABELS));
  lines.push('');

  lines.push('## クレーム経験と対応');
  lines.push('');
  lines.push(renderRows(ref, EXPERIENCE_LABELS));
  lines.push('');

  lines.push('## 強みエピソード');
  lines.push('');
  lines.push(ref.strengthEpisode ?? PLACEHOLDER);
  lines.push('');

  lines.push('## 間接的に関わる仕事への転換アイデア');
  lines.push('');
  lines.push(ref.indirectRoleIdea ?? PLACEHOLDER);
  lines.push('');

  return lines.join('\n');
}
