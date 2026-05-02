import { describe, expect, it } from 'vitest';
import {
  AgentTrackRecordSchema,
  AgentTrackRecordStatusSchema,
  AgentTrackRecordUpdateSchema,
} from '../../src/schemas/agent-track-record.js';

const baseRecord = {
  id: '01AGENT1',
  companyName: 'リクルートエージェント',
  contactName: '田中 太郎',
  contactEmail: 'tanaka@example.com',
  contactPhone: '03-0000-0000',
  firstContactDate: '2026-05-01T00:00:00Z',
  memo: '初回面談済み',
  status: 'active' as const,
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
};

describe('AgentTrackRecordStatusSchema', () => {
  it.each(['active', 'archived'])('%s を受理', (status) => {
    expect(AgentTrackRecordStatusSchema.safeParse(status).success).toBe(true);
  });

  it('未知の値を拒否', () => {
    expect(AgentTrackRecordStatusSchema.safeParse('inactive').success).toBe(false);
    expect(AgentTrackRecordStatusSchema.safeParse('').success).toBe(false);
  });
});

describe('AgentTrackRecordSchema', () => {
  it('正常系', () => {
    expect(AgentTrackRecordSchema.safeParse(baseRecord).success).toBe(true);
  });

  it('firstContactDate が null でも受理', () => {
    expect(
      AgentTrackRecordSchema.safeParse({ ...baseRecord, firstContactDate: null }).success,
    ).toBe(true);
  });

  it('id 空文字を拒否', () => {
    expect(AgentTrackRecordSchema.safeParse({ ...baseRecord, id: '' }).success).toBe(false);
  });

  it('companyName 空文字を拒否', () => {
    expect(AgentTrackRecordSchema.safeParse({ ...baseRecord, companyName: '' }).success).toBe(false);
  });

  it('contactName / contactEmail / contactPhone / memo は空文字を許可', () => {
    expect(
      AgentTrackRecordSchema.safeParse({
        ...baseRecord,
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        memo: '',
      }).success,
    ).toBe(true);
  });

  it('firstContactDate 空文字を拒否（null か非空文字のみ）', () => {
    expect(
      AgentTrackRecordSchema.safeParse({ ...baseRecord, firstContactDate: '' }).success,
    ).toBe(false);
  });

  it('未知の status を拒否', () => {
    expect(
      AgentTrackRecordSchema.safeParse({ ...baseRecord, status: 'inactive' as 'active' }).success,
    ).toBe(false);
  });
});

describe('AgentTrackRecordUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(AgentTrackRecordUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('一部のフィールドのみ送れる', () => {
    expect(
      AgentTrackRecordUpdateSchema.safeParse({ companyName: '新会社名', status: 'archived' })
        .success,
    ).toBe(true);
  });

  it('firstContactDate を null で更新できる', () => {
    expect(AgentTrackRecordUpdateSchema.safeParse({ firstContactDate: null }).success).toBe(true);
  });

  it('未知の status を拒否', () => {
    expect(
      AgentTrackRecordUpdateSchema.safeParse({ status: 'unknown' as 'active' }).success,
    ).toBe(false);
  });

  it('companyName 空文字を拒否', () => {
    expect(AgentTrackRecordUpdateSchema.safeParse({ companyName: '' }).success).toBe(false);
  });
});
