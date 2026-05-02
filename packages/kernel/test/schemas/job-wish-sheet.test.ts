import { describe, expect, it } from 'vitest';
import { JobWishSheetSchema, JobWishSheetUpdateSchema } from '../../src/schemas/job-wish-sheet.js';

const baseSheet = {
  id: '01WISH001',
  agentTrackRecordId: '01AGENT1',
  title: '転職希望シート 2026',
  desiredIndustry: 'IT・Web',
  desiredRole: 'プロダクトマネージャー',
  desiredSalary: '800万円以上',
  desiredLocation: '東京・リモート可',
  desiredWorkStyle: 'フレックス・週3在宅',
  otherConditions: '英語使用可能環境',
  groupACompanies: [{ id: '01COMP01', name: '株式会社アルファ', note: '製品志向が強い' }],
  groupBCompanies: [{ id: '01COMP02', name: '株式会社ベータ', note: '' }],
  groupCCompanies: [],
  memo: '面談後に再評価',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
};

describe('JobWishSheetSchema', () => {
  it('正常系', () => {
    expect(JobWishSheetSchema.safeParse(baseSheet).success).toBe(true);
  });

  it('agentTrackRecordId が null でも受理', () => {
    expect(JobWishSheetSchema.safeParse({ ...baseSheet, agentTrackRecordId: null }).success).toBe(
      true,
    );
  });

  it('groupACompanies が空配列でも受理', () => {
    expect(JobWishSheetSchema.safeParse({ ...baseSheet, groupACompanies: [] }).success).toBe(true);
  });

  it('全 group が空配列でも受理', () => {
    expect(
      JobWishSheetSchema.safeParse({
        ...baseSheet,
        groupACompanies: [],
        groupBCompanies: [],
        groupCCompanies: [],
      }).success,
    ).toBe(true);
  });

  it('文字列系フィールドが空文字でも受理', () => {
    expect(
      JobWishSheetSchema.safeParse({
        ...baseSheet,
        title: '',
        desiredIndustry: '',
        desiredRole: '',
        desiredSalary: '',
        desiredLocation: '',
        desiredWorkStyle: '',
        otherConditions: '',
        memo: '',
      }).success,
    ).toBe(true);
  });

  it('id 空文字を拒否', () => {
    expect(JobWishSheetSchema.safeParse({ ...baseSheet, id: '' }).success).toBe(false);
  });

  it('agentTrackRecordId 空文字を拒否（null か非空文字のみ）', () => {
    expect(JobWishSheetSchema.safeParse({ ...baseSheet, agentTrackRecordId: '' }).success).toBe(
      false,
    );
  });

  it('createdAt 空文字を拒否', () => {
    expect(JobWishSheetSchema.safeParse({ ...baseSheet, createdAt: '' }).success).toBe(false);
  });

  it('updatedAt 空文字を拒否', () => {
    expect(JobWishSheetSchema.safeParse({ ...baseSheet, updatedAt: '' }).success).toBe(false);
  });

  it('企業の id 空文字を拒否', () => {
    expect(
      JobWishSheetSchema.safeParse({
        ...baseSheet,
        groupACompanies: [{ id: '', name: '会社', note: '' }],
      }).success,
    ).toBe(false);
  });

  it('企業の name / note は空文字を許可', () => {
    expect(
      JobWishSheetSchema.safeParse({
        ...baseSheet,
        groupACompanies: [{ id: '01COMP01', name: '', note: '' }],
      }).success,
    ).toBe(true);
  });
});

describe('JobWishSheetUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(JobWishSheetUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('一部のフィールドのみ送れる', () => {
    expect(
      JobWishSheetUpdateSchema.safeParse({ title: '新タイトル', desiredRole: '新職種' }).success,
    ).toBe(true);
  });

  it('agentTrackRecordId を null で更新できる', () => {
    expect(JobWishSheetUpdateSchema.safeParse({ agentTrackRecordId: null }).success).toBe(true);
  });

  it('agentTrackRecordId 空文字を拒否', () => {
    expect(JobWishSheetUpdateSchema.safeParse({ agentTrackRecordId: '' }).success).toBe(false);
  });

  it('groupACompanies を空配列で更新できる', () => {
    expect(JobWishSheetUpdateSchema.safeParse({ groupACompanies: [] }).success).toBe(true);
  });
});
