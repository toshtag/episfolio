import { beforeEach, describe, expect, it } from 'vitest';
import type { ResultByType, ResultEntry } from '../../src/domain/result-by-type.js';
import type { ResultByTypeStoragePort } from '../../src/ports/result-by-type-storage-port.js';
import type { ResultByTypeUpdate } from '../../src/schemas/result-by-type.js';

class InMemoryResultByTypeStorage implements ResultByTypeStoragePort {
  private store = new Map<string, ResultByType>();

  async create(result: ResultByType): Promise<ResultByType> {
    this.store.set(result.id, result);
    return result;
  }

  async list(): Promise<ResultByType[]> {
    return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<ResultByType | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: ResultByTypeUpdate): Promise<ResultByType> {
    const current = this.store.get(id);
    if (!current) throw new Error(`ResultByType not found: ${id}`);
    const updated: ResultByType = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: '2026-05-03T12:00:00Z',
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error(`ResultByType not found: ${id}`);
    this.store.delete(id);
  }
}

const buildEntry = (id: string, overrides: Partial<ResultEntry> = {}): ResultEntry => ({
  id,
  resultType: 'revenue',
  situation: '新規顧客開拓に行き詰まっていた',
  action: 'マーケティング担当と連携し提案資料を改善した',
  result: '定価納品が増えた',
  quantification: null,
  skillType: 'outcome',
  note: null,
  ...overrides,
});

const buildResult = (id: string, overrides: Partial<ResultByType> = {}): ResultByType => ({
  id,
  title: '営業での実績',
  entries: [buildEntry('01ENTRY001')],
  memo: '',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('ResultByTypeStoragePort contract', () => {
  let storage: ResultByTypeStoragePort;

  beforeEach(() => {
    storage = new InMemoryResultByTypeStorage();
  });

  describe('create / get', () => {
    it('create した記録を get で取得できる', async () => {
      const result = buildResult('01RESULT001');
      await storage.create(result);
      expect(await storage.get('01RESULT001')).toEqual(result);
    });

    it('entries 配列の中身も保持される', async () => {
      const entries = [
        buildEntry('01ENTRY001'),
        buildEntry('01ENTRY002', { resultType: 'cost', skillType: 'cause' }),
      ];
      await storage.create(buildResult('01RESULT001', { entries }));
      const got = await storage.get('01RESULT001');
      expect(got?.entries).toEqual(entries);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });

    it('quantification が null のエントリを保持できる', async () => {
      const entry = buildEntry('01ENTRY001', { quantification: null });
      await storage.create(buildResult('01RESULT001', { entries: [entry] }));
      const got = await storage.get('01RESULT001');
      expect(got?.entries[0].quantification).toBeNull();
    });

    it('note が null のエントリを保持できる', async () => {
      const entry = buildEntry('01ENTRY001', { note: null });
      await storage.create(buildResult('01RESULT001', { entries: [entry] }));
      const got = await storage.get('01RESULT001');
      expect(got?.entries[0].note).toBeNull();
    });

    it('resultType が cost のエントリを保持できる', async () => {
      const entry = buildEntry('01ENTRY001', { resultType: 'cost' });
      await storage.create(buildResult('01RESULT001', { entries: [entry] }));
      const got = await storage.get('01RESULT001');
      expect(got?.entries[0].resultType).toBe('cost');
    });

    it('resultType が both のエントリを保持できる', async () => {
      const entry = buildEntry('01ENTRY001', { resultType: 'both' });
      await storage.create(buildResult('01RESULT001', { entries: [entry] }));
      const got = await storage.get('01RESULT001');
      expect(got?.entries[0].resultType).toBe('both');
    });

    it('skillType が cause のエントリを保持できる', async () => {
      const entry = buildEntry('01ENTRY001', { skillType: 'cause' });
      await storage.create(buildResult('01RESULT001', { entries: [entry] }));
      const got = await storage.get('01RESULT001');
      expect(got?.entries[0].skillType).toBe('cause');
    });
  });

  describe('list', () => {
    it('作成済みの全件を createdAt 昇順で返す', async () => {
      await storage.create(buildResult('01RESULT002', { createdAt: '2026-05-03T01:00:00Z' }));
      await storage.create(buildResult('01RESULT001', { createdAt: '2026-05-02T00:00:00Z' }));
      const list = await storage.list();
      expect(list.map((r) => r.id)).toEqual(['01RESULT001', '01RESULT002']);
    });

    it('データがない場合は空配列', async () => {
      expect(await storage.list()).toEqual([]);
    });
  });

  describe('update', () => {
    it('title を patch で更新できる', async () => {
      await storage.create(buildResult('01RESULT001', { title: '旧タイトル' }));
      const updated = await storage.update('01RESULT001', { title: '新タイトル' });
      expect(updated.title).toBe('新タイトル');
    });

    it('entries を空配列に更新できる', async () => {
      await storage.create(buildResult('01RESULT001'));
      const updated = await storage.update('01RESULT001', { entries: [] });
      expect(updated.entries).toEqual([]);
    });

    it('entries に複数のエントリを追加できる', async () => {
      await storage.create(buildResult('01RESULT001'));
      const newEntries = [
        buildEntry('01ENTRY001'),
        buildEntry('01ENTRY002', { resultType: 'cost' }),
        buildEntry('01ENTRY003', { resultType: 'both' }),
      ];
      const updated = await storage.update('01RESULT001', { entries: newEntries });
      expect(updated.entries).toHaveLength(3);
    });

    it('memo を更新できる', async () => {
      await storage.create(buildResult('01RESULT001', { memo: '' }));
      const updated = await storage.update('01RESULT001', { memo: '補足メモ' });
      expect(updated.memo).toBe('補足メモ');
    });

    it('id / createdAt は不可変', async () => {
      await storage.create(buildResult('01RESULT001', { createdAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01RESULT001', { title: '新' });
      expect(updated.id).toBe('01RESULT001');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildResult('01RESULT001', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01RESULT001', { title: '新' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { title: '新' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildResult('01RESULT001'));
      await storage.delete('01RESULT001');
      expect(await storage.get('01RESULT001')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.create(buildResult('01RESULT001'));
      await storage.create(buildResult('01RESULT002'));
      await storage.delete('01RESULT001');
      const list = await storage.list();
      expect(list.map((r) => r.id)).toEqual(['01RESULT002']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
