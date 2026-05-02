import { describe, expect, it } from 'vitest';
import {
  AgentMeetingEmailSchema,
  AgentMeetingEmailUpdateSchema,
} from '../../src/schemas/agent-meeting-email.js';

const baseEmail = {
  id: '01MAIL001',
  agentTrackRecordId: '01AGENT1',
  subject: '面談のご依頼',
  body: '本文テキスト',
  sentAt: '2026-05-01T10:00:00Z',
  memo: 'メモ',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
};

describe('AgentMeetingEmailSchema', () => {
  it('正常系', () => {
    expect(AgentMeetingEmailSchema.safeParse(baseEmail).success).toBe(true);
  });

  it('agentTrackRecordId が null でも受理（汎用テンプレ）', () => {
    expect(
      AgentMeetingEmailSchema.safeParse({ ...baseEmail, agentTrackRecordId: null }).success,
    ).toBe(true);
  });

  it('sentAt が null でも受理（下書き）', () => {
    expect(AgentMeetingEmailSchema.safeParse({ ...baseEmail, sentAt: null }).success).toBe(true);
  });

  it('id 空文字を拒否', () => {
    expect(AgentMeetingEmailSchema.safeParse({ ...baseEmail, id: '' }).success).toBe(false);
  });

  it('agentTrackRecordId 空文字を拒否（null か非空文字のみ）', () => {
    expect(
      AgentMeetingEmailSchema.safeParse({ ...baseEmail, agentTrackRecordId: '' }).success,
    ).toBe(false);
  });

  it('sentAt 空文字を拒否（null か非空文字のみ）', () => {
    expect(AgentMeetingEmailSchema.safeParse({ ...baseEmail, sentAt: '' }).success).toBe(false);
  });

  it('subject / body / memo は空文字を許可', () => {
    expect(
      AgentMeetingEmailSchema.safeParse({
        ...baseEmail,
        subject: '',
        body: '',
        memo: '',
      }).success,
    ).toBe(true);
  });

  it('createdAt 空文字を拒否', () => {
    expect(AgentMeetingEmailSchema.safeParse({ ...baseEmail, createdAt: '' }).success).toBe(false);
  });

  it('updatedAt 空文字を拒否', () => {
    expect(AgentMeetingEmailSchema.safeParse({ ...baseEmail, updatedAt: '' }).success).toBe(false);
  });
});

describe('AgentMeetingEmailUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(AgentMeetingEmailUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('一部のフィールドのみ送れる', () => {
    expect(
      AgentMeetingEmailUpdateSchema.safeParse({ subject: '件名更新', body: '本文更新' }).success,
    ).toBe(true);
  });

  it('sentAt を null で更新できる（下書きに戻す）', () => {
    expect(AgentMeetingEmailUpdateSchema.safeParse({ sentAt: null }).success).toBe(true);
  });

  it('agentTrackRecordId を null で更新できる', () => {
    expect(AgentMeetingEmailUpdateSchema.safeParse({ agentTrackRecordId: null }).success).toBe(
      true,
    );
  });

  it('agentTrackRecordId 空文字を拒否', () => {
    expect(AgentMeetingEmailUpdateSchema.safeParse({ agentTrackRecordId: '' }).success).toBe(false);
  });

  it('sentAt 空文字を拒否', () => {
    expect(AgentMeetingEmailUpdateSchema.safeParse({ sentAt: '' }).success).toBe(false);
  });
});
