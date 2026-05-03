import { beforeEach, describe, expect, it } from 'vitest';
import type { SalaryBenchmark } from '../../src/domain/salary-benchmark.js';
import type { SalaryBenchmarkStoragePort } from '../../src/ports/salary-benchmark-storage-port.js';
import type { SalaryBenchmarkUpdate } from '../../src/schemas/salary-benchmark.js';

class InMemorySalaryBenchmarkStorage implements SalaryBenchmarkStoragePort {
  private store = new Map<string, SalaryBenchmark>();

  async create(record: SalaryBenchmark): Promise<SalaryBenchmark> {
    this.store.set(record.id, record);
    return record;
  }

  async listByJobTarget(jobTargetId: string): Promise<SalaryBenchmark[]> {
    return Array.from(this.store.values())
      .filter((r) => r.jobTargetId === jobTargetId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<SalaryBenchmark | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: SalaryBenchmarkUpdate): Promise<SalaryBenchmark> {
    const current = this.store.get(id);
    if (!current) throw new Error(`SalaryBenchmark not found: ${id}`);
    const updated: SalaryBenchmark = {
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
    if (!this.store.has(id)) throw new Error(`SalaryBenchmark not found: ${id}`);
    this.store.delete(id);
  }
}

const buildRecord = (id: string, overrides: Partial<SalaryBenchmark> = {}): SalaryBenchmark => ({
  id,
  jobTargetId: '01JT00001',
  averageSalaryAtCompany: 620,
  expectedSalaryRangeMin: 450,
  expectedSalaryRangeMax: 700,
  personalSalaryBenchmark: 550,
  isMismatchedCompany: false,
  dataSource: 'EDINET 有価証券報告書',
  note: '業界平均と比較して妥当',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('SalaryBenchmarkStoragePort contract', () => {
  let storage: SalaryBenchmarkStoragePort;

  beforeEach(() => {
    storage = new InMemorySalaryBenchmarkStorage();
  });

  describe('create / get', () => {
    it('create したレコードを get で取得できる', async () => {
      const record = buildRecord('01SB00001');
      await storage.create(record);
      expect(await storage.get('01SB00001')).toEqual(record);
    });

    it('nullable フィールドが null でも保存できる', async () => {
      const record = buildRecord('01SB00001', {
        averageSalaryAtCompany: null,
        expectedSalaryRangeMin: null,
        expectedSalaryRangeMax: null,
        personalSalaryBenchmark: null,
        dataSource: null,
        note: null,
      });
      await storage.create(record);
      const got = await storage.get('01SB00001');
      expect(got?.averageSalaryAtCompany).toBeNull();
      expect(got?.dataSource).toBeNull();
    });

    it('isMismatchedCompany が true でも保存できる', async () => {
      const record = buildRecord('01SB00001', { isMismatchedCompany: true });
      await storage.create(record);
      expect((await storage.get('01SB00001'))?.isMismatchedCompany).toBe(true);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('listByJobTarget', () => {
    it('同一 jobTargetId のレコードのみ返す', async () => {
      await storage.create(buildRecord('01SB00001', { jobTargetId: '01JT00001' }));
      await storage.create(buildRecord('01SB00002', { jobTargetId: '01JT00002' }));
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01SB00001']);
    });

    it('同一 jobTargetId の複数レコードを createdAt 降順で返す', async () => {
      await storage.create(
        buildRecord('01SB00001', { jobTargetId: '01JT00001', createdAt: '2026-05-01T00:00:00Z' }),
      );
      await storage.create(
        buildRecord('01SB00002', { jobTargetId: '01JT00001', createdAt: '2026-05-03T00:00:00Z' }),
      );
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01SB00002', '01SB00001']);
    });

    it('該当レコードがない場合は空配列', async () => {
      expect(await storage.listByJobTarget('non-existent')).toEqual([]);
    });
  });

  describe('update', () => {
    it('isMismatchedCompany を更新できる', async () => {
      await storage.create(buildRecord('01SB00001', { isMismatchedCompany: false }));
      const updated = await storage.update('01SB00001', { isMismatchedCompany: true });
      expect(updated.isMismatchedCompany).toBe(true);
    });

    it('averageSalaryAtCompany を null に更新できる', async () => {
      await storage.create(buildRecord('01SB00001', { averageSalaryAtCompany: 600 }));
      const updated = await storage.update('01SB00001', { averageSalaryAtCompany: null });
      expect(updated.averageSalaryAtCompany).toBeNull();
    });

    it('note を更新できる', async () => {
      await storage.create(buildRecord('01SB00001', { note: '旧メモ' }));
      const updated = await storage.update('01SB00001', { note: '再調査が必要' });
      expect(updated.note).toBe('再調査が必要');
    });

    it('id / jobTargetId / createdAt は不可変', async () => {
      await storage.create(
        buildRecord('01SB00001', { jobTargetId: '01JT00001', createdAt: '2026-01-01T00:00:00Z' }),
      );
      const updated = await storage.update('01SB00001', { note: '更新後メモ' });
      expect(updated.id).toBe('01SB00001');
      expect(updated.jobTargetId).toBe('01JT00001');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildRecord('01SB00001', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01SB00001', { note: '更新後' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { note: '更新' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildRecord('01SB00001'));
      await storage.delete('01SB00001');
      expect(await storage.get('01SB00001')).toBeNull();
    });

    it('削除後 listByJobTarget から消える', async () => {
      await storage.create(buildRecord('01SB00001', { jobTargetId: '01JT00001' }));
      await storage.create(buildRecord('01SB00002', { jobTargetId: '01JT00001' }));
      await storage.delete('01SB00001');
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01SB00002']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
