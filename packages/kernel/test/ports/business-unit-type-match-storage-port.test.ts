import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessUnitTypeMatch } from '../../src/domain/business-unit-type-match.js';
import type { BusinessUnitTypeMatchStoragePort } from '../../src/ports/business-unit-type-match-storage-port.js';
import type { BusinessUnitTypeMatchUpdate } from '../../src/schemas/business-unit-type-match.js';

class InMemoryBusinessUnitTypeMatchStorage implements BusinessUnitTypeMatchStoragePort {
  private store = new Map<string, BusinessUnitTypeMatch>();

  async create(record: BusinessUnitTypeMatch): Promise<BusinessUnitTypeMatch> {
    this.store.set(record.id, record);
    return record;
  }

  async listByJobTarget(jobTargetId: string): Promise<BusinessUnitTypeMatch[]> {
    return Array.from(this.store.values())
      .filter((r) => r.jobTargetId === jobTargetId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<BusinessUnitTypeMatch | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: BusinessUnitTypeMatchUpdate): Promise<BusinessUnitTypeMatch> {
    const current = this.store.get(id);
    if (!current) throw new Error(`BusinessUnitTypeMatch not found: ${id}`);
    const updated: BusinessUnitTypeMatch = {
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
    if (!this.store.has(id)) throw new Error(`BusinessUnitTypeMatch not found: ${id}`);
    this.store.delete(id);
  }
}

const buildRecord = (
  id: string,
  overrides: Partial<BusinessUnitTypeMatch> = {},
): BusinessUnitTypeMatch => ({
  id,
  jobTargetId: '01JT00001',
  companyUnitType: 'star',
  selfType: 'challenge',
  isMatchConfirmed: false,
  matchNote: null,
  motivationDraft: null,
  note: null,
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('BusinessUnitTypeMatchStoragePort contract', () => {
  let storage: BusinessUnitTypeMatchStoragePort;

  beforeEach(() => {
    storage = new InMemoryBusinessUnitTypeMatchStorage();
  });

  describe('create / get', () => {
    it('create したレコードを get で取得できる', async () => {
      const record = buildRecord('01BU00001');
      await storage.create(record);
      expect(await storage.get('01BU00001')).toEqual(record);
    });

    it('companyUnitType が null でも保存できる', async () => {
      const record = buildRecord('01BU00001', { companyUnitType: null });
      await storage.create(record);
      expect((await storage.get('01BU00001'))?.companyUnitType).toBeNull();
    });

    it('selfType が null でも保存できる', async () => {
      const record = buildRecord('01BU00001', { selfType: null });
      await storage.create(record);
      expect((await storage.get('01BU00001'))?.selfType).toBeNull();
    });

    it('isMatchConfirmed が true でも保存できる', async () => {
      const record = buildRecord('01BU00001', { isMatchConfirmed: true });
      await storage.create(record);
      expect((await storage.get('01BU00001'))?.isMatchConfirmed).toBe(true);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('listByJobTarget', () => {
    it('同一 jobTargetId のレコードのみ返す', async () => {
      await storage.create(buildRecord('01BU00001', { jobTargetId: '01JT00001' }));
      await storage.create(buildRecord('01BU00002', { jobTargetId: '01JT00002' }));
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01BU00001']);
    });

    it('同一 jobTargetId の複数レコードを createdAt 降順で返す', async () => {
      await storage.create(
        buildRecord('01BU00001', { jobTargetId: '01JT00001', createdAt: '2026-05-01T00:00:00Z' }),
      );
      await storage.create(
        buildRecord('01BU00002', { jobTargetId: '01JT00001', createdAt: '2026-05-03T00:00:00Z' }),
      );
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01BU00002', '01BU00001']);
    });

    it('該当レコードがない場合は空配列', async () => {
      expect(await storage.listByJobTarget('non-existent')).toEqual([]);
    });
  });

  describe('update', () => {
    it('companyUnitType を更新できる', async () => {
      await storage.create(buildRecord('01BU00001', { companyUnitType: 'star' }));
      const updated = await storage.update('01BU00001', { companyUnitType: 'support' });
      expect(updated.companyUnitType).toBe('support');
    });

    it('selfType を null に更新できる', async () => {
      await storage.create(buildRecord('01BU00001', { selfType: 'challenge' }));
      const updated = await storage.update('01BU00001', { selfType: null });
      expect(updated.selfType).toBeNull();
    });

    it('isMatchConfirmed を true に更新できる', async () => {
      await storage.create(buildRecord('01BU00001', { isMatchConfirmed: false }));
      const updated = await storage.update('01BU00001', { isMatchConfirmed: true });
      expect(updated.isMatchConfirmed).toBe(true);
    });

    it('note を更新できる', async () => {
      await storage.create(buildRecord('01BU00001', { note: '旧メモ' }));
      const updated = await storage.update('01BU00001', { note: '新しいメモ' });
      expect(updated.note).toBe('新しいメモ');
    });

    it('id / jobTargetId / createdAt は不可変', async () => {
      await storage.create(
        buildRecord('01BU00001', { jobTargetId: '01JT00001', createdAt: '2026-01-01T00:00:00Z' }),
      );
      const updated = await storage.update('01BU00001', { note: '更新後メモ' });
      expect(updated.id).toBe('01BU00001');
      expect(updated.jobTargetId).toBe('01JT00001');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildRecord('01BU00001', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01BU00001', { note: '更新後' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { note: '更新' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildRecord('01BU00001'));
      await storage.delete('01BU00001');
      expect(await storage.get('01BU00001')).toBeNull();
    });

    it('削除後 listByJobTarget から消える', async () => {
      await storage.create(buildRecord('01BU00001', { jobTargetId: '01JT00001' }));
      await storage.create(buildRecord('01BU00002', { jobTargetId: '01JT00001' }));
      await storage.delete('01BU00001');
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01BU00002']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
