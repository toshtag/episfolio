import { beforeEach, describe, expect, it } from 'vitest';
import type { CompanyCertification } from '../../src/domain/company-certification.js';
import type { CompanyCertificationStoragePort } from '../../src/ports/company-certification-storage-port.js';
import type { CompanyCertificationUpdate } from '../../src/schemas/company-certification.js';

class InMemoryCompanyCertificationStorage implements CompanyCertificationStoragePort {
  private store = new Map<string, CompanyCertification>();

  async create(record: CompanyCertification): Promise<CompanyCertification> {
    this.store.set(record.id, record);
    return record;
  }

  async listByJobTarget(jobTargetId: string): Promise<CompanyCertification[]> {
    return Array.from(this.store.values())
      .filter((r) => r.jobTargetId === jobTargetId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<CompanyCertification | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: CompanyCertificationUpdate): Promise<CompanyCertification> {
    const current = this.store.get(id);
    if (!current) throw new Error(`CompanyCertification not found: ${id}`);
    const updated: CompanyCertification = {
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
    if (!this.store.has(id)) throw new Error(`CompanyCertification not found: ${id}`);
    this.store.delete(id);
  }
}

const buildRecord = (
  id: string,
  overrides: Partial<CompanyCertification> = {},
): CompanyCertification => ({
  id,
  jobTargetId: '01JT00001',
  hasKurumin: true,
  hasPlatinumKurumin: false,
  hasTomoni: true,
  eruboshiLevel: 3,
  hasPlatinumEruboshi: false,
  note: 'くるみん・トモニン取得。えるぼしレベル3。',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('CompanyCertificationStoragePort contract', () => {
  let storage: CompanyCertificationStoragePort;

  beforeEach(() => {
    storage = new InMemoryCompanyCertificationStorage();
  });

  describe('create / get', () => {
    it('create したレコードを get で取得できる', async () => {
      const record = buildRecord('01CC00001');
      await storage.create(record);
      expect(await storage.get('01CC00001')).toEqual(record);
    });

    it('eruboshiLevel が null でも保存できる', async () => {
      const record = buildRecord('01CC00001', { eruboshiLevel: null });
      await storage.create(record);
      expect((await storage.get('01CC00001'))?.eruboshiLevel).toBeNull();
    });

    it('note が null でも保存できる', async () => {
      const record = buildRecord('01CC00001', { note: null });
      await storage.create(record);
      expect((await storage.get('01CC00001'))?.note).toBeNull();
    });

    it('hasPlatinumEruboshi が true でも保存できる', async () => {
      const record = buildRecord('01CC00001', { hasPlatinumEruboshi: true });
      await storage.create(record);
      expect((await storage.get('01CC00001'))?.hasPlatinumEruboshi).toBe(true);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('listByJobTarget', () => {
    it('同一 jobTargetId のレコードのみ返す', async () => {
      await storage.create(buildRecord('01CC00001', { jobTargetId: '01JT00001' }));
      await storage.create(buildRecord('01CC00002', { jobTargetId: '01JT00002' }));
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01CC00001']);
    });

    it('同一 jobTargetId の複数レコードを createdAt 降順で返す', async () => {
      await storage.create(
        buildRecord('01CC00001', { jobTargetId: '01JT00001', createdAt: '2026-05-01T00:00:00Z' }),
      );
      await storage.create(
        buildRecord('01CC00002', { jobTargetId: '01JT00001', createdAt: '2026-05-03T00:00:00Z' }),
      );
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01CC00002', '01CC00001']);
    });

    it('該当レコードがない場合は空配列', async () => {
      expect(await storage.listByJobTarget('non-existent')).toEqual([]);
    });
  });

  describe('update', () => {
    it('hasKurumin を更新できる', async () => {
      await storage.create(buildRecord('01CC00001', { hasKurumin: true }));
      const updated = await storage.update('01CC00001', { hasKurumin: false });
      expect(updated.hasKurumin).toBe(false);
    });

    it('eruboshiLevel を null に更新できる', async () => {
      await storage.create(buildRecord('01CC00001', { eruboshiLevel: 3 }));
      const updated = await storage.update('01CC00001', { eruboshiLevel: null });
      expect(updated.eruboshiLevel).toBeNull();
    });

    it('note を更新できる', async () => {
      await storage.create(buildRecord('01CC00001', { note: '旧メモ' }));
      const updated = await storage.update('01CC00001', { note: '追加調査が必要' });
      expect(updated.note).toBe('追加調査が必要');
    });

    it('id / jobTargetId / createdAt は不可変', async () => {
      await storage.create(
        buildRecord('01CC00001', { jobTargetId: '01JT00001', createdAt: '2026-01-01T00:00:00Z' }),
      );
      const updated = await storage.update('01CC00001', { note: '更新後メモ' });
      expect(updated.id).toBe('01CC00001');
      expect(updated.jobTargetId).toBe('01JT00001');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildRecord('01CC00001', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01CC00001', { note: '更新後' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { note: '更新' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildRecord('01CC00001'));
      await storage.delete('01CC00001');
      expect(await storage.get('01CC00001')).toBeNull();
    });

    it('削除後 listByJobTarget から消える', async () => {
      await storage.create(buildRecord('01CC00001', { jobTargetId: '01JT00001' }));
      await storage.create(buildRecord('01CC00002', { jobTargetId: '01JT00001' }));
      await storage.delete('01CC00001');
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01CC00002']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
