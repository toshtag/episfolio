import { describe, expect, it } from 'vitest';
import type {
  IronApplicationMotive,
  StandardApplicationMotive,
} from '../../src/domain/application-motive.js';
import { composeApplicationMotiveText } from '../../src/exporters/application-motive.js';

const common = {
  id: '01APPMO01',
  jobTargetId: '01JOBTG1',
  formattedText: '',
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
};

const standardMotive: StandardApplicationMotive = {
  ...common,
  style: 'standard',
  companyFuture: 'DX 推進による業界変革',
  contributionAction: 'プロダクト開発の高速化',
  leveragedExperience: 'スタートアップでの新規事業立ち上げ経験',
  infoSourceType: null,
  infoSourceUrl: '',
  targetDepartment: '',
  departmentChallenge: '',
};

const ironMotive: IronApplicationMotive = {
  ...common,
  id: '01APPMO02',
  style: 'iron',
  positiveInfluence: '顧客の行動変容に立ち会えた瞬間',
  beforeAfterFact: '導入前 CSV 手作業 → 導入後 90% 自動化',
  selfIdentification: 'provider',
  providerSwitchMoment: 'OSS コントリビュートで「使われる側」の視点を得た',
  valueAnalysisType: 'marketIn',
  valueAnalysisDetail: '顧客課題起点でプロダクトを設計',
  postJoinActionPlan: '入社 3 ヶ月で既存顧客ヒアリング 20 社実施',
};

describe('composeApplicationMotiveText（standard）', () => {
  it('3 フィールドが揃っている場合に定型フォーマットの文を生成する', () => {
    const result = composeApplicationMotiveText(standardMotive);
    expect(result).toBe(
      '私はDX 推進による業界変革を達成するために、貴社を志望しています。' +
        '具体的には、プロダクト開発の高速化に貢献すべく、私の経験のスタートアップでの新規事業立ち上げ経験を生かしてまいります。',
    );
  });

  it('全フィールドが空文字の場合は空文字を返す', () => {
    const result = composeApplicationMotiveText({
      ...standardMotive,
      companyFuture: '',
      contributionAction: '',
      leveragedExperience: '',
    });
    expect(result).toBe('');
  });

  it('一部が空文字でも空でないフィールドを含む場合はテンプレを展開する', () => {
    const result = composeApplicationMotiveText({
      ...standardMotive,
      companyFuture: '持続可能な社会の実現',
      contributionAction: '',
      leveragedExperience: '',
    });
    expect(result).toContain('持続可能な社会の実現');
    expect(result).toContain('貴社を志望しています。');
  });

  it('フィールドを変えると別の文章になる', () => {
    const a = composeApplicationMotiveText(standardMotive);
    const b = composeApplicationMotiveText({
      ...standardMotive,
      companyFuture: 'X',
      contributionAction: 'Y',
      leveragedExperience: 'Z',
    });
    expect(a).not.toBe(b);
  });

  it('後方互換: MotiveComponents 形式（style なし）でも動作する', () => {
    const result = composeApplicationMotiveText({
      companyFuture: 'DX 推進による業界変革',
      contributionAction: 'プロダクト開発の高速化',
      leveragedExperience: 'スタートアップでの新規事業立ち上げ経験',
    });
    expect(result).toBe(
      '私はDX 推進による業界変革を達成するために、貴社を志望しています。' +
        '具体的には、プロダクト開発の高速化に貢献すべく、私の経験のスタートアップでの新規事業立ち上げ経験を生かしてまいります。',
    );
  });
});

describe('composeApplicationMotiveText（iron）', () => {
  it('全フィールドが揃っている場合に 6 段フォーマットを生成する', () => {
    const result = composeApplicationMotiveText(ironMotive);
    expect(result).toContain('【肯定的影響】顧客の行動変容に立ち会えた瞬間');
    expect(result).toContain('【Before→After の事実】導入前 CSV 手作業 → 導入後 90% 自動化');
    expect(result).toContain('【自己認識】提供者');
    expect(result).toContain(
      '【提供者への転換点】OSS コントリビュートで「使われる側」の視点を得た',
    );
    expect(result).toContain('【価値分析】マーケットイン型：顧客課題起点でプロダクトを設計');
    expect(result).toContain('【入社後の行動計画】入社 3 ヶ月で既存顧客ヒアリング 20 社実施');
  });

  it('空フィールドは出力から省略される', () => {
    const result = composeApplicationMotiveText({
      ...ironMotive,
      positiveInfluence: '',
      beforeAfterFact: '',
    });
    expect(result).not.toContain('【肯定的影響】');
    expect(result).not.toContain('【Before→After');
    expect(result).toContain('【自己認識】');
  });

  it('全フィールドが空の場合は空文字を返す', () => {
    const result = composeApplicationMotiveText({
      ...ironMotive,
      positiveInfluence: '',
      beforeAfterFact: '',
      selfIdentification: null,
      providerSwitchMoment: '',
      valueAnalysisType: null,
      valueAnalysisDetail: '',
      postJoinActionPlan: '',
    });
    expect(result).toBe('');
  });

  it('selfIdentification=fan のラベルが正しい', () => {
    const result = composeApplicationMotiveText({ ...ironMotive, selfIdentification: 'fan' });
    expect(result).toContain('【自己認識】ファン');
  });

  it('selfIdentification=transitioning のラベルが正しい', () => {
    const result = composeApplicationMotiveText({
      ...ironMotive,
      selfIdentification: 'transitioning',
    });
    expect(result).toContain('【自己認識】移行中');
  });

  it('valueAnalysisType=productOut のラベルが正しい', () => {
    const result = composeApplicationMotiveText({ ...ironMotive, valueAnalysisType: 'productOut' });
    expect(result).toContain('【価値分析】プロダクトアウト型');
  });

  it('フィールドを変えると別の出力になる', () => {
    const a = composeApplicationMotiveText(ironMotive);
    const b = composeApplicationMotiveText({ ...ironMotive, positiveInfluence: '別の影響' });
    expect(a).not.toBe(b);
  });
});
