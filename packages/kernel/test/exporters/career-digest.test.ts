import { describe, expect, it } from 'vitest';
import type { JobRequirementMapping } from '../../src/domain/job-requirement-mapping.js';
import type { JobTarget } from '../../src/domain/job-target.js';
import type { LifeTimelineEntry } from '../../src/domain/life-timeline-entry.js';
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
  lifeTimelineEntryIds: [],
  userNote: '',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

const baseEntry = (overrides: Partial<LifeTimelineEntry> = {}): LifeTimelineEntry => ({
  id: '01HLT1',
  ageRangeStart: 25,
  ageRangeEnd: 27,
  yearStart: 2018,
  yearEnd: 2020,
  category: 'work',
  summary: '型推論ライブラリ設計',
  detail: '',
  relatedEpisodeIds: [],
  tags: [],
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

describe('toCareerDigestMarkdown', () => {
  it('宛先・イントロ・必須要件・関連経験・アピールポイントを含む Markdown を生成する', () => {
    const target = baseTarget({
      companyName: 'Acme 株式会社',
      jobTitle: 'シニアエンジニア',
      requiredSkills: [{ id: '01HSKL1', text: 'TypeScript 3 年以上' }],
      appealPoints: '型システム設計の経験があります。',
    });
    const mapping = baseMapping({
      requirementSkillId: '01HSKL1',
      lifeTimelineEntryIds: ['01HLT1'],
      userNote: '前職で型推論ライブラリを設計しました。',
    });
    const entry = baseEntry({
      id: '01HLT1',
      yearStart: 2018,
      yearEnd: 2020,
      category: 'work',
      summary: '型推論ライブラリ設計',
      detail: 'any だらけのコードに型推論を導入し、型エラー検出率を 5 倍に高めた。',
    });
    const md = toCareerDigestMarkdown(target, [mapping], [entry]);

    expect(md).toContain('# 職務経歴ダイジェスト：Acme 株式会社 シニアエンジニア');
    expect(md).toContain('Acme 株式会社 ご担当者様');
    expect(md).toContain('### TypeScript 3 年以上');
    expect(md).toContain('前職で型推論ライブラリを設計しました。');
    expect(md).toContain('##### [2018-2020] [仕事] 型推論ライブラリ設計');
    expect(md).toContain('any だらけのコードに型推論を導入し、型エラー検出率を 5 倍に高めた。');
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
    expect(md).toContain('（関連する経験はまだ紐付けされていません）');
  });

  it('マッピングはあるが lifeTimelineEntryIds が空 → userNote のみ表示し関連経験セクションは省略', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
    });
    const mapping = baseMapping({
      requirementSkillId: 'r1',
      lifeTimelineEntryIds: [],
      userNote: 'これから関連経験を整理します。',
    });
    const md = toCareerDigestMarkdown(target, [mapping], []);
    expect(md).toContain('これから関連経験を整理します。');
    expect(md).not.toContain('#### 関連する経験');
  });

  it('マッピングの userNote が空でも、関連 LifeTimelineEntry があれば出力される', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
    });
    const mapping = baseMapping({
      requirementSkillId: 'r1',
      lifeTimelineEntryIds: ['01HLT1'],
      userNote: '',
    });
    const entry = baseEntry({ id: '01HLT1', summary: '経験 A', detail: '詳細 A' });
    const md = toCareerDigestMarkdown(target, [mapping], [entry]);
    expect(md).toContain('#### 関連する経験');
    expect(md).toContain('経験 A');
    expect(md).toContain('詳細 A');
  });

  it('lifeTimelineEntryIds に存在しない LifeTimelineEntry は無視される', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
    });
    const mapping = baseMapping({
      requirementSkillId: 'r1',
      lifeTimelineEntryIds: ['01HLT_GHOST', '01HLT1'],
      userNote: 'ノート',
    });
    const entry = baseEntry({ id: '01HLT1', summary: '実在エントリ' });
    const md = toCareerDigestMarkdown(target, [mapping], [entry]);
    expect(md).toContain('実在エントリ');
    expect(md).not.toContain('01HLT_GHOST');
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
    expect(md).toContain('（関連する経験はまだ紐付けされていません）');
  });

  it('appealPoints が空ならアピールポイントセクション全体を出さない', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
      appealPoints: '   ',
    });
    const md = toCareerDigestMarkdown(target, [], []);
    expect(md).not.toContain('## アピールポイント');
  });

  it('LifeTimelineEntry の detail が空ならその行は省略', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
    });
    const mapping = baseMapping({
      requirementSkillId: 'r1',
      lifeTimelineEntryIds: ['01HLT1'],
    });
    const entry = baseEntry({
      id: '01HLT1',
      summary: '要約のみ',
      detail: '',
    });
    const md = toCareerDigestMarkdown(target, [mapping], [entry]);
    expect(md).toContain('要約のみ');
    expect(md).toContain('#### 関連する経験');
  });

  it('yearStart / yearEnd が null の場合は ageRange 表記にフォールバック', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
    });
    const mapping = baseMapping({
      requirementSkillId: 'r1',
      lifeTimelineEntryIds: ['01HLT1'],
    });
    const entry = baseEntry({
      id: '01HLT1',
      yearStart: null,
      yearEnd: null,
      ageRangeStart: 25,
      ageRangeEnd: 27,
      summary: '若手期間',
    });
    const md = toCareerDigestMarkdown(target, [mapping], [entry]);
    expect(md).toContain('##### [25-27 歳] [仕事] 若手期間');
  });

  it('yearStart === yearEnd なら 1 つの年だけ表示', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
    });
    const mapping = baseMapping({
      requirementSkillId: 'r1',
      lifeTimelineEntryIds: ['01HLT1'],
    });
    const entry = baseEntry({
      id: '01HLT1',
      yearStart: 2020,
      yearEnd: 2020,
      summary: '単年プロジェクト',
    });
    const md = toCareerDigestMarkdown(target, [mapping], [entry]);
    expect(md).toContain('##### [2020] [仕事] 単年プロジェクト');
  });

  it('カテゴリラベルが日本語に変換される', () => {
    const target = baseTarget({
      requiredSkills: [{ id: 'r1', text: '要件 X' }],
    });
    const mapping = baseMapping({
      requirementSkillId: 'r1',
      lifeTimelineEntryIds: ['01HLT1'],
    });
    const entry = baseEntry({
      id: '01HLT1',
      category: 'hobby',
      summary: '趣味エントリ',
    });
    const md = toCareerDigestMarkdown(target, [mapping], [entry]);
    expect(md).toContain('[趣味]');
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
