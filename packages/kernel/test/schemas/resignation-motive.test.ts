import { describe, expect, it } from 'vitest';
import {
  ResignationMotiveSchema,
  ResignationMotiveUpdateSchema,
} from '../../src/schemas/resignation-motive.js';

const base = {
  id: '01RESIGN1',
  companyDissatisfaction: '成長機会が少ない',
  jobDissatisfaction: '裁量が小さい',
  compensationDissatisfaction: '市場水準より低い',
  relationshipDissatisfaction: '上司との方向性の違い',
  resolutionIntent: '自律的に動ける環境に移る',
  note: null,
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
};

describe('ResignationMotiveSchema', () => {
  it('正常系', () => {
    expect(ResignationMotiveSchema.safeParse(base).success).toBe(true);
  });

  it('note が null でも受理', () => {
    expect(ResignationMotiveSchema.safeParse({ ...base, note: null }).success).toBe(true);
  });

  it('note が文字列でも受理', () => {
    expect(ResignationMotiveSchema.safeParse({ ...base, note: '補足メモ' }).success).toBe(true);
  });

  it('文字列フィールドは空文字を許可', () => {
    expect(
      ResignationMotiveSchema.safeParse({
        ...base,
        companyDissatisfaction: '',
        jobDissatisfaction: '',
        compensationDissatisfaction: '',
        relationshipDissatisfaction: '',
        resolutionIntent: '',
      }).success,
    ).toBe(true);
  });

  it('id 空文字を拒否', () => {
    expect(ResignationMotiveSchema.safeParse({ ...base, id: '' }).success).toBe(false);
  });

  it('createdAt 空文字を拒否', () => {
    expect(ResignationMotiveSchema.safeParse({ ...base, createdAt: '' }).success).toBe(false);
  });

  it('updatedAt 空文字を拒否', () => {
    expect(ResignationMotiveSchema.safeParse({ ...base, updatedAt: '' }).success).toBe(false);
  });

  it('note が undefined を拒否（null か string のみ）', () => {
    const { note: _n, ...withoutNote } = base;
    expect(ResignationMotiveSchema.safeParse(withoutNote).success).toBe(false);
  });
});

describe('ResignationMotiveUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(ResignationMotiveUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('一部のフィールドのみ送れる', () => {
    expect(
      ResignationMotiveUpdateSchema.safeParse({ resolutionIntent: '事業会社に移る' }).success,
    ).toBe(true);
  });

  it('note を null で更新できる', () => {
    expect(ResignationMotiveUpdateSchema.safeParse({ note: null }).success).toBe(true);
  });

  it('note を文字列で更新できる', () => {
    expect(ResignationMotiveUpdateSchema.safeParse({ note: 'メモ追加' }).success).toBe(true);
  });
});
