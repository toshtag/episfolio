import { beforeEach, describe, expect, it } from 'vitest';
import type { AgentMeetingEmail } from '../../src/domain/agent-meeting-email.js';
import type { AgentMeetingEmailStoragePort } from '../../src/ports/agent-meeting-email-storage-port.js';
import type { AgentMeetingEmailUpdate } from '../../src/schemas/agent-meeting-email.js';

class InMemoryAgentMeetingEmailStorage implements AgentMeetingEmailStoragePort {
  private store = new Map<string, AgentMeetingEmail>();

  async save(email: AgentMeetingEmail): Promise<AgentMeetingEmail> {
    this.store.set(email.id, email);
    return email;
  }

  async listByAgent(agentTrackRecordId: string): Promise<AgentMeetingEmail[]> {
    return Array.from(this.store.values())
      .filter((e) => e.agentTrackRecordId === agentTrackRecordId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async list(): Promise<AgentMeetingEmail[]> {
    return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<AgentMeetingEmail | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: AgentMeetingEmailUpdate): Promise<AgentMeetingEmail> {
    const current = this.store.get(id);
    if (!current) throw new Error(`AgentMeetingEmail not found: ${id}`);
    const updated: AgentMeetingEmail = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: '2026-05-02T12:00:00Z',
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error(`AgentMeetingEmail not found: ${id}`);
    this.store.delete(id);
  }
}

const buildEmail = (id: string, overrides: Partial<AgentMeetingEmail> = {}): AgentMeetingEmail => ({
  id,
  agentTrackRecordId: '01AGENT1',
  subject: '面談のご依頼',
  body: '本文テキスト',
  sentAt: null,
  memo: '',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

describe('AgentMeetingEmailStoragePort contract', () => {
  let storage: AgentMeetingEmailStoragePort;

  beforeEach(() => {
    storage = new InMemoryAgentMeetingEmailStorage();
  });

  describe('save / get', () => {
    it('save した email を get で取得できる', async () => {
      const e = buildEmail('01MAIL001');
      await storage.save(e);
      expect(await storage.get('01MAIL001')).toEqual(e);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('list', () => {
    it('全件を createdAt 昇順で返す', async () => {
      await storage.save(buildEmail('01MAIL002', { createdAt: '2026-05-02T00:00:00Z' }));
      await storage.save(buildEmail('01MAIL001', { createdAt: '2026-05-01T00:00:00Z' }));
      const list = await storage.list();
      expect(list.map((e) => e.id)).toEqual(['01MAIL001', '01MAIL002']);
    });

    it('レコードがない場合は空配列', async () => {
      expect(await storage.list()).toEqual([]);
    });

    it('agentTrackRecordId が null の email も全件に含まれる', async () => {
      await storage.save(buildEmail('01MAIL001', { agentTrackRecordId: '01AGENT1' }));
      await storage.save(buildEmail('01MAIL002', { agentTrackRecordId: null }));
      expect((await storage.list()).length).toBe(2);
    });
  });

  describe('listByAgent', () => {
    it('指定 agentTrackRecordId の email のみ返す', async () => {
      await storage.save(buildEmail('01MAIL001', { agentTrackRecordId: '01AGENT1' }));
      await storage.save(buildEmail('01MAIL002', { agentTrackRecordId: '01AGENT2' }));
      await storage.save(buildEmail('01MAIL003', { agentTrackRecordId: '01AGENT1' }));
      const list = await storage.listByAgent('01AGENT1');
      expect(list.map((e) => e.id)).toEqual(['01MAIL001', '01MAIL003']);
    });

    it('該当なしの場合は空配列', async () => {
      expect(await storage.listByAgent('01AGENT_NONE')).toEqual([]);
    });

    it('createdAt 昇順で返す', async () => {
      await storage.save(
        buildEmail('01MAIL002', {
          agentTrackRecordId: '01AGENT1',
          createdAt: '2026-05-02T00:00:00Z',
        }),
      );
      await storage.save(
        buildEmail('01MAIL001', {
          agentTrackRecordId: '01AGENT1',
          createdAt: '2026-05-01T00:00:00Z',
        }),
      );
      const list = await storage.listByAgent('01AGENT1');
      expect(list.map((e) => e.id)).toEqual(['01MAIL001', '01MAIL002']);
    });
  });

  describe('update', () => {
    it('subject を patch で更新できる', async () => {
      await storage.save(buildEmail('01MAIL001', { subject: '旧件名' }));
      const updated = await storage.update('01MAIL001', { subject: '新件名' });
      expect(updated.subject).toBe('新件名');
    });

    it('sentAt を null から文字列に更新できる', async () => {
      await storage.save(buildEmail('01MAIL001', { sentAt: null }));
      const updated = await storage.update('01MAIL001', { sentAt: '2026-05-10T10:00:00Z' });
      expect(updated.sentAt).toBe('2026-05-10T10:00:00Z');
    });

    it('sentAt を文字列から null に更新できる（下書きに戻す）', async () => {
      await storage.save(buildEmail('01MAIL001', { sentAt: '2026-05-10T10:00:00Z' }));
      const updated = await storage.update('01MAIL001', { sentAt: null });
      expect(updated.sentAt).toBeNull();
    });

    it('agentTrackRecordId を null に更新できる', async () => {
      await storage.save(buildEmail('01MAIL001', { agentTrackRecordId: '01AGENT1' }));
      const updated = await storage.update('01MAIL001', { agentTrackRecordId: null });
      expect(updated.agentTrackRecordId).toBeNull();
    });

    it('id / createdAt は不可変', async () => {
      await storage.save(buildEmail('01MAIL001', { createdAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01MAIL001', { memo: '変更' });
      expect(updated.id).toBe('01MAIL001');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.save(buildEmail('01MAIL001', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01MAIL001', { memo: '変更' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { memo: 'x' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.save(buildEmail('01MAIL001'));
      await storage.delete('01MAIL001');
      expect(await storage.get('01MAIL001')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.save(buildEmail('01MAIL001'));
      await storage.save(buildEmail('01MAIL002'));
      await storage.delete('01MAIL001');
      const list = await storage.list();
      expect(list.map((e) => e.id)).toEqual(['01MAIL002']);
    });

    it('削除後 listByAgent から消える', async () => {
      await storage.save(buildEmail('01MAIL001', { agentTrackRecordId: '01AGENT1' }));
      await storage.save(buildEmail('01MAIL002', { agentTrackRecordId: '01AGENT1' }));
      await storage.delete('01MAIL001');
      const list = await storage.listByAgent('01AGENT1');
      expect(list.map((e) => e.id)).toEqual(['01MAIL002']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
