import type { BossReference } from '../domain/boss-reference.js';

const AXIS_LABELS: Array<{ left: string; right: string; key: keyof BossReference['axisValues'] }> =
  [
    { left: '論理重視', right: '感性重視', key: 'logicVsEmotion' },
    { left: '結果重視', right: 'プロセス重視', key: 'resultVsProcess' },
    { left: '単独プレー重視', right: 'チームワーク重視', key: 'soloVsTeam' },
    { left: '未来重視', right: '伝統重視', key: 'futureVsTradition' },
    { left: 'プライベートを話す', right: 'プライベートを話さない', key: 'sharesPrivate' },
    { left: '教えるのが得意', right: '教えるのが苦手', key: 'teachingSkill' },
    { left: '話を聞く', right: '話を聞かない', key: 'listening' },
    { left: '忙しい', right: 'ゆとりがある', key: 'busyness' },
  ];

const Q_LABELS: string[] = [
  '上司はこれまでどんな業界・会社でどんな仕事をしていたか',
  '上司とした仕事の中で一番記憶に残っているものは何か',
  '上司の厳しさを感じた経験はどんなものか',
  '評価面談や1on1・普段の指導で求められた内容は何か',
  '評価面談や1on1・普段の指導で叱られた時の言葉は何か',
  '上司はどんな仕事をしているか',
  '上司は何に対して怒りや不安を覚えるか',
  '上司は何をすると評価するか',
  '上司が目指していること・したい仕事は何か',
  '上司の評価基準は何か（上司の上司は何で評価するのか）',
  '上司があなたに求めていることは何か',
];

function renderBar(value: number): string {
  const dots = Array.from({ length: 5 }, (_, i) => (i + 1 === value ? '●' : '○'));
  return dots.join('');
}

function renderAxisChart(ref: BossReference): string {
  const rows = AXIS_LABELS.map(({ left, right, key }) => {
    const bar = renderBar(ref.axisValues[key]);
    return `| ${left} | ${bar} | ${right} |`;
  });
  return ['| 左 | スケール | 右 |', '|---|:---:|---|', ...rows].join('\n');
}

function renderQuestionsTable(ref: BossReference): string {
  const qKeys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11'] as const;
  const timeLabels = [
    '過去',
    '過去',
    '過去',
    '過去',
    '過去',
    '現在',
    '現在',
    '現在',
    '未来',
    '未来',
    '未来',
  ];
  const rows = qKeys.map((key, i) => {
    const answer = ref[key] ?? '（未記入）';
    return `| ${timeLabels[i]} | ${Q_LABELS[i]} | ${answer} |`;
  });
  return ['| 時制 | 上司を分析する視点 | 回答 |', '|---|---|---|', ...rows].join('\n');
}

export function toBossReferenceMarkdown(ref: BossReference): string {
  const bossLabel = ref.bossName ? `${ref.bossName}（${ref.companyName}）` : ref.companyName;
  const lines: string[] = [];

  lines.push(`# 上司リファレンス — ${bossLabel}`);
  lines.push('');
  lines.push(`**在籍期間**: ${ref.period}`);
  lines.push('');

  lines.push('## タイプ分析チャート');
  lines.push('');
  lines.push(renderAxisChart(ref));
  lines.push('');

  lines.push('## 11の質問');
  lines.push('');
  lines.push(renderQuestionsTable(ref));
  lines.push('');

  lines.push('## 強みエピソード');
  lines.push('');
  lines.push(ref.strengthEpisode ?? '（未記入）');
  lines.push('');

  return lines.join('\n');
}
