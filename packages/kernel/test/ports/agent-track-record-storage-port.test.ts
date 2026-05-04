import { beforeEach, describe, expect, it } from 'vitest';
import type { AgentTrackRecord } from '../../src/domain/agent-track-record.js';
import type { AgentTrackRecordStoragePort } from '../../src/ports/agent-track-record-storage-port.js';
import type { AgentTrackRecordUpdate } from '../../src/schemas/agent-track-record.js';

class InMemoryAgentTrackRecordStorage implements AgentTrackRecordStoragePort {
  private store = new Map<string, AgentTrackRecord>();

  async create(record: AgentTrackRecord): Promise<AgentTrackRecord> {
    this.store.set(record.id, record);
    return record;
  }

  async list(): Promise<AgentTrackRecord[]> {
    return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<AgentTrackRecord | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: AgentTrackRecordUpdate): Promise<AgentTrackRecord> {
    const current = this.store.get(id);
    if (!current) throw new Error(`AgentTrackRecord not found: ${id}`);
    const updated: AgentTrackRecord = {
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
    if (!this.store.has(id)) throw new Error(`AgentTrackRecord not found: ${id}`);
    this.store.delete(id);
  }
}

const buildRecord = (id: string, overrides: Partial<AgentTrackRecord> = {}): AgentTrackRecord => ({
  id,
  companyName: 'リクルートエージェント',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  firstContactDate: null,
  memo: '',
  status: 'active',
  specialtyIndustries: null,
  specialtyJobTypes: null,
  consultantQuality: null,
  hasExclusiveJobs: null,
  providesRecommendationLetter: null,
  recommendationLetterReceived: null,
  numberOfJobsIntroduced: null,
  responseSpeedDays: null,
  overallRating: null,
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

describe('AgentTrackRecordStoragePort contract', () => {
  let storage: AgentTrackRecordStoragePort;

  beforeEach(() => {
    storage = new InMemoryAgentTrackRecordStorage();
  });

  describe('create / get', () => {
    it('create した record を get で取得できる', async () => {
      const r = buildRecord('01AGENT1');
      await storage.create(r);
      expect(await storage.get('01AGENT1')).toEqual(r);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('list', () => {
    it('全件を createdAt 昇順で返す', async () => {
      await storage.create(buildRecord('01AGENT1', { createdAt: '2026-05-02T00:00:00Z' }));
      await storage.create(buildRecord('01AGENT2', { createdAt: '2026-05-01T00:00:00Z' }));
      const list = await storage.list();
      expect(list.map((r) => r.id)).toEqual(['01AGENT2', '01AGENT1']);
    });

    it('レコードがない場合は空配列', async () => {
      expect(await storage.list()).toEqual([]);
    });

    it('active / archived 混在でも全件返す', async () => {
      await storage.create(buildRecord('01AGENT1', { status: 'active' }));
      await storage.create(buildRecord('01AGENT2', { status: 'archived' }));
      expect((await storage.list()).length).toBe(2);
    });
  });

  describe('update', () => {
    it('companyName を patch で更新できる', async () => {
      await storage.create(buildRecord('01AGENT1', { companyName: '旧会社' }));
      const updated = await storage.update('01AGENT1', { companyName: '新会社' });
      expect(updated.companyName).toBe('新会社');
    });

    it('status を archived に変更できる', async () => {
      await storage.create(buildRecord('01AGENT1', { status: 'active' }));
      const updated = await storage.update('01AGENT1', { status: 'archived' });
      expect(updated.status).toBe('archived');
    });

    it('firstContactDate を null から文字列に更新できる', async () => {
      await storage.create(buildRecord('01AGENT1', { firstContactDate: null }));
      const updated = await storage.update('01AGENT1', {
        firstContactDate: '2026-05-10T10:00:00Z',
      });
      expect(updated.firstContactDate).toBe('2026-05-10T10:00:00Z');
    });

    it('firstContactDate を文字列から null に更新できる', async () => {
      await storage.create(buildRecord('01AGENT1', { firstContactDate: '2026-05-10T10:00:00Z' }));
      const updated = await storage.update('01AGENT1', { firstContactDate: null });
      expect(updated.firstContactDate).toBeNull();
    });

    it('id / createdAt は不可変', async () => {
      await storage.create(buildRecord('01AGENT1', { createdAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01AGENT1', { memo: '変更' });
      expect(updated.id).toBe('01AGENT1');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildRecord('01AGENT1', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01AGENT1', { memo: '変更' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { memo: 'x' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildRecord('01AGENT1'));
      await storage.delete('01AGENT1');
      expect(await storage.get('01AGENT1')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.create(buildRecord('01AGENT1'));
      await storage.create(buildRecord('01AGENT2'));
      await storage.delete('01AGENT1');
      const list = await storage.list();
      expect(list.map((r) => r.id)).toEqual(['01AGENT2']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
