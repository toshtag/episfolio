import { beforeEach, describe, expect, it } from 'vitest';
import type { MonsterCompanyCheck } from '../../src/domain/monster-company-check.js';
import type { MonsterCompanyCheckStoragePort } from '../../src/ports/monster-company-check-storage-port.js';
import type { MonsterCompanyCheckUpdate } from '../../src/schemas/monster-company-check.js';

class InMemoryMonsterCompanyCheckStorage implements MonsterCompanyCheckStoragePort {
  private store = new Map<string, MonsterCompanyCheck>();

  async create(record: MonsterCompanyCheck): Promise<MonsterCompanyCheck> {
    this.store.set(record.id, record);
    return record;
  }

  async listByJobTarget(jobTargetId: string): Promise<MonsterCompanyCheck[]> {
    return Array.from(this.store.values())
      .filter((r) => r.jobTargetId === jobTargetId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<MonsterCompanyCheck | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: MonsterCompanyCheckUpdate): Promise<MonsterCompanyCheck> {
    const current = this.store.get(id);
    if (!current) throw new Error(`MonsterCompanyCheck not found: ${id}`);
    const updated: MonsterCompanyCheck = {
      ...current,
      ...patch,
      id: current.id,
      jobTargetId: current.jobTargetId,
      createdAt: current.createdAt,
      updatedAt: '2026-05-03T12:00:00Z',
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error(`MonsterCompanyCheck not found: ${id}`);
    this.store.delete(id);
  }
}

const buildRecord = (id: string, overrides: Partial<MonsterCompanyCheck> = {}): MonsterCompanyCheck => ({
  id,
  jobTargetId: '01JT00001',
  mhlwCaseUrl: 'https://example.com/case',
  violationLaw: '労働基準法第32条',
  caseSummary: '時間外労働が月100時間を超える違反',
  casePublicationDate: '2024-03-15',
  resignationEntries: [{ url: 'https://example.com/quit', summary: '残業が多くて退職' }],
  hiddenMonsterNote: '開発部署の口コミに注意',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('MonsterCompanyCheckStoragePort contract', () => {
  let storage: MonsterCompanyCheckStoragePort;

  beforeEach(() => {
    storage = new InMemoryMonsterCompanyCheckStorage();
  });

  describe('create / get', () => {
    it('create したレコードを get で取得できる', async () => {
      const record = buildRecord('01MCC0001');
      await storage.create(record);
      expect(await storage.get('01MCC0001')).toEqual(record);
    });

    it('nullable フィールドが null でも保存できる', async () => {
      const record = buildRecord('01MCC0001', {
        mhlwCaseUrl: null,
        violationLaw: null,
        caseSummary: null,
        casePublicationDate: null,
        hiddenMonsterNote: null,
      });
      await storage.create(record);
      const got = await storage.get('01MCC0001');
      expect(got?.mhlwCaseUrl).toBeNull();
      expect(got?.hiddenMonsterNote).toBeNull();
    });

    it('resignationEntries が空配列でも保存できる', async () => {
      const record = buildRecord('01MCC0001', { resignationEntries: [] });
      await storage.create(record);
      expect((await storage.get('01MCC0001'))?.resignationEntries).toEqual([]);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('listByJobTarget', () => {
    it('同一 jobTargetId のレコードのみ返す', async () => {
      await storage.create(buildRecord('01MCC0001', { jobTargetId: '01JT00001' }));
      await storage.create(buildRecord('01MCC0002', { jobTargetId: '01JT00002' }));
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01MCC0001']);
    });

    it('同一 jobTargetId の複数レコードを createdAt 降順で返す', async () => {
      await storage.create(buildRecord('01MCC0001', {
        jobTargetId: '01JT00001',
        createdAt: '2026-05-01T00:00:00Z',
      }));
      await storage.create(buildRecord('01MCC0002', {
        jobTargetId: '01JT00001',
        createdAt: '2026-05-03T00:00:00Z',
      }));
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01MCC0002', '01MCC0001']);
    });

    it('該当レコードがない場合は空配列', async () => {
      expect(await storage.listByJobTarget('non-existent')).toEqual([]);
    });
  });

  describe('update', () => {
    it('violationLaw を更新できる', async () => {
      await storage.create(buildRecord('01MCC0001', { violationLaw: '旧法条' }));
      const updated = await storage.update('01MCC0001', { violationLaw: '労働安全衛生法第65条' });
      expect(updated.violationLaw).toBe('労働安全衛生法第65条');
    });

    it('hiddenMonsterNote を null に更新できる', async () => {
      await storage.create(buildRecord('01MCC0001', { hiddenMonsterNote: '何か' }));
      const updated = await storage.update('01MCC0001', { hiddenMonsterNote: null });
      expect(updated.hiddenMonsterNote).toBeNull();
    });

    it('resignationEntries を更新できる', async () => {
      await storage.create(buildRecord('01MCC0001'));
      const newEntries = [{ url: 'https://new.com', summary: '新しい退職エントリ' }];
      const updated = await storage.update('01MCC0001', { resignationEntries: newEntries });
      expect(updated.resignationEntries).toEqual(newEntries);
    });

    it('id / jobTargetId / createdAt は不可変', async () => {
      await storage.create(buildRecord('01MCC0001', {
        jobTargetId: '01JT00001',
        createdAt: '2026-01-01T00:00:00Z',
      }));
      const updated = await storage.update('01MCC0001', { violationLaw: '新法条' });
      expect(updated.id).toBe('01MCC0001');
      expect(updated.jobTargetId).toBe('01JT00001');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildRecord('01MCC0001', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01MCC0001', { violationLaw: '新法条' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { violationLaw: '新法条' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildRecord('01MCC0001'));
      await storage.delete('01MCC0001');
      expect(await storage.get('01MCC0001')).toBeNull();
    });

    it('削除後 listByJobTarget から消える', async () => {
      await storage.create(buildRecord('01MCC0001', { jobTargetId: '01JT00001' }));
      await storage.create(buildRecord('01MCC0002', { jobTargetId: '01JT00001' }));
      await storage.delete('01MCC0001');
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01MCC0002']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
