import { describe, expect, it } from 'vitest';
import type { Episode } from '../../src/domain/episode.js';
import type { JobRequirementMapping } from '../../src/domain/job-requirement-mapping.js';
import type { JobTarget } from '../../src/domain/job-target.js';
import { toCareerDigestMarkdown } from '../../src/exporters/career-digest.js';

const baseTarget = (overrides: Partial<JobTarget> = {}): JobTarget => ({
  id: '01HJOB1',
  companyName: 'Acme 株式会社',
  jobTitle: 'シニアエンジニア',
  jobDescription: '',
  status: 'applying',
  requiredSkills: [],
  preferredSkills: [],
  concerns: '',
  appealPoints: '',
  annualHolidays: null,
  workingHoursPerDay: null,
  commuteTimeMinutes: null,
  employmentType: null,
  flexTimeAvailable: null,
  remoteWorkAvailable: null,
  averagePaidLeaveTaken: null,
  vacancyReason: null,
  currentTeamSize: null,
  wageType: null,
  basicSalary: null,
  fixedOvertimeHours: null,
  bonusBaseMonths: null,
  hasFutureRaisePromise: null,
  futureRaisePromiseInContract: null,
  applicationRoute: null,
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

const baseMapping = (overrides: Partial<JobRequirementMapping> = {}): JobRequirementMapping => ({
  id: '01HJM1',
  jobTargetId: '01HJOB1',
  requirementSkillId: '01HSKL1',
  episodeIds: [],
  userNote: '',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

const baseEpisode = (overrides: Partial<Episode> = {}): Episode => ({
  id: '01HEP1',
  title: 'タイトル',
  background: '',
  problem: '',
  action: '',
  ingenuity: '',
  result: '',
  metrics: '',
  beforeAfter: '',
  reproducibility: '',
  relatedSkills: [],
  personalFeeling: '',
  externalFeedback: '',
  remoteLLMAllowed: false,
  tags: [],
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

describe('toCareerDigestMarkdown', () => {
  it('宛先・イントロ・必須要件・関連 Episode・アピールポイントを含む Markdown を生成する', () => {
    const target = baseTarget({
      companyName: 'Acme 株式会社',
      jobTitle: 'シニアエンジニア',
      requiredSkills: [{ id: '01HSKL1', text: 'TypeScript 3 年以上' }],
      appealPoints: '型システム設計の経験があります。',
    });
    const mapping = baseMapping({
      requirementSkillId: '01HSKL1',
      episodeIds: ['01HEP1'],
      userNote: '前職で型推論ライブラリを設計しました。',
    });
    const ep = baseEpisode({
      id: '01HEP1',
      title: '型推論ライブラリ設計',
      background: '社内ツールが any だらけだった',
      action: '型推論を中核に置き直した',
      result: '型エラー検出率が 5 倍に',
    });
    const md = toCareerDigestMarkdown(target, [mapping], [ep]);

    expect(md).toContain('# 職務経歴ダイジェスト：Acme 株式会社 シニアエンジニア');
    expect(md).toContain('Acme 株式会社 ご担当者様');
    expect(md).toContain('### TypeScript 3 年以上');
    expect(md).toContain('前職で型推論ライブラリを設計しました。');
    expect(md).toContain('##### 型推論ライブラリ設計');
    expect(md).toContain('- **背景**: 社内ツールが any だらけだった');
    expect(md).toContain('- **取り組み**: 型推論を中核に置き直した');
    expect(md).toContain('- **結果**: 型エラー検出率が 5 倍に');
    expect(md).toContain('## アピールポイント');
    expect(md).toContain('型システム設計の経験があります。');
  });

  it('必須要件は jobTarget.requiredSkills の順序で並ぶ', () => {
    const target = baseTarget({
      requiredSkills: [
        { id: 'r1', text: '要件 A' },
        { id: 'r2', text: '要件 B' },
        { id: 'r3', text: '要件 C' },
      ],
    });
    const md = toCareerDigestMarkdown(target, [], []);
    const idxA = md.indexOf('### 要件 A');
    const idxB = md.indexOf('### 要件 B');
    const idxC = md.indexOf('### 要件 C');
    expect(idxA).toBeGreaterThan(-1);
    expect(idxA).toBeLessThan(idxB);
    expect(idxB).toBeLessThan(idxC);
  });

  it('要件にマッピングがない場合は「まだ紐付けされていません」と出す', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
    });
    const md = toCareerDigestMarkdown(target, [], []);
    expect(md).toContain('### 要件 X');
    expect(md).toContain('（このエピソードはまだ紐付けされていません）');
  });

  it('マッピングはあるが episodeIds が空 → userNote のみ表示し関連エピソードセクションは省略', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
    });
    const mapping = baseMapping({
      requirementSkillId: 'r1',
      episodeIds: [],
      userNote: 'これから関連経験を整理します。',
    });
    const md = toCareerDigestMarkdown(target, [mapping], []);
    expect(md).toContain('これから関連経験を整理します。');
    expect(md).not.toContain('#### 関連エピソード');
  });

  it('マッピングの userNote が空でも、関連 Episode があれば出力される', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
    });
    const mapping = baseMapping({
      requirementSkillId: 'r1',
      episodeIds: ['01HEP1'],
      userNote: '',
    });
    const ep = baseEpisode({ id: '01HEP1', title: 'タイトル A', result: '結果' });
    const md = toCareerDigestMarkdown(target, [mapping], [ep]);
    expect(md).toContain('#### 関連エピソード');
    expect(md).toContain('##### タイトル A');
    expect(md).toContain('- **結果**: 結果');
  });

  it('episodeIds に存在しない Episode は無視される', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
    });
    const mapping = baseMapping({
      requirementSkillId: 'r1',
      episodeIds: ['01HEP_GHOST', '01HEP1'],
      userNote: 'ノート',
    });
    const ep = baseEpisode({ id: '01HEP1', title: '実在エピソード' });
    const md = toCareerDigestMarkdown(target, [mapping], [ep]);
    expect(md).toContain('##### 実在エピソード');
    expect(md).not.toContain('01HEP_GHOST');
  });

  it('requirementSkillId が jobTarget.requiredSkills に無いマッピングは無視される', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
    });
    const stale = baseMapping({
      requirementSkillId: 'r_deleted',
      userNote: '削除済み要件のメモ',
    });
    const md = toCareerDigestMarkdown(target, [stale], []);
    expect(md).not.toContain('削除済み要件のメモ');
    expect(md).toContain('（このエピソードはまだ紐付けされていません）');
  });

  it('appealPoints が空ならアピールポイントセクション全体を出さない', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
      appealPoints: '   ',
    });
    const md = toCareerDigestMarkdown(target, [], []);
    expect(md).not.toContain('## アピールポイント');
  });

  it('Episode の background / action / result が一部空ならその行だけ省略', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
    });
    const mapping = baseMapping({
      requirementSkillId: 'r1',
      episodeIds: ['01HEP1'],
    });
    const ep = baseEpisode({
      id: '01HEP1',
      title: 'T',
      background: '背景あり',
      action: '',
      result: '',
    });
    const md = toCareerDigestMarkdown(target, [mapping], [ep]);
    expect(md).toContain('- **背景**: 背景あり');
    expect(md).not.toContain('- **取り組み**:');
    expect(md).not.toContain('- **結果**:');
  });

  it('concerns（気がかり）はダイジェスト本文に出力しない', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
      concerns: '英語面接に不安があります',
    });
    const md = toCareerDigestMarkdown(target, [], []);
    expect(md).not.toContain('英語面接に不安');
    expect(md).not.toContain('## 気がかり');
  });

  it('必須要件が空でもクラッシュせず宛先 + イントロは出力される', () => {
    const target = baseTarget({ requiredSkills: [] });
    const md = toCareerDigestMarkdown(target, [], []);
    expect(md).toContain('## 必須要件への対応');
    expect(md).toContain('Acme 株式会社 ご担当者様');
  });
});
