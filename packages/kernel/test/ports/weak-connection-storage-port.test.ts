import { beforeEach, describe, expect, it } from 'vitest';
import type { WeakConnection } from '../../src/domain/weak-connection.js';
import type { WeakConnectionStoragePort } from '../../src/ports/weak-connection-storage-port.js';
import type { WeakConnectionUpdate } from '../../src/schemas/weak-connection.js';

class InMemoryWeakConnectionStorage implements WeakConnectionStoragePort {
  private store = new Map<string, WeakConnection>();

  async create(record: WeakConnection): Promise<WeakConnection> {
    this.store.set(record.id, record);
    return record;
  }

  async list(): Promise<WeakConnection[]> {
    return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<WeakConnection | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: WeakConnectionUpdate): Promise<WeakConnection> {
    const current = this.store.get(id);
    if (!current) throw new Error(`WeakConnection not found: ${id}`);
    const updated: WeakConnection = {
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
    if (!this.store.has(id)) throw new Error(`WeakConnection not found: ${id}`);
    this.store.delete(id);
  }
}

const buildRecord = (id: string, overrides: Partial<WeakConnection> = {}): WeakConnection => ({
  id,
  name: '田中太郎',
  category: 'student_days',
  relation: '大学のゼミ仲間',
  contactStatus: 'not_contacted',
  prospectNote: 'IT 系の会社に勤めているので転職先の紹介を頼めるかも',
  note: null,
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('WeakConnectionStoragePort contract', () => {
  let storage: WeakConnectionStoragePort;

  beforeEach(() => {
    storage = new InMemoryWeakConnectionStorage();
  });

  describe('create / get', () => {
    it('create したレコードを get で取得できる', async () => {
      const record = buildRecord('01WC00001');
      await storage.create(record);
      expect(await storage.get('01WC00001')).toEqual(record);
    });

    it('note が null でも保存できる', async () => {
      const record = buildRecord('01WC00001', { note: null });
      await storage.create(record);
      expect((await storage.get('01WC00001'))?.note).toBeNull();
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('list', () => {
    it('全件を createdAt 昇順で返す', async () => {
      await storage.create(buildRecord('01WC00002', { createdAt: '2026-05-03T01:00:00Z' }));
      await storage.create(buildRecord('01WC00001', { createdAt: '2026-05-02T00:00:00Z' }));
      const list = await storage.list();
      expect(list.map((r) => r.id)).toEqual(['01WC00001', '01WC00002']);
    });

    it('データがない場合は空配列', async () => {
      expect(await storage.list()).toEqual([]);
    });
  });

  describe('update', () => {
    it('name を更新できる', async () => {
      await storage.create(buildRecord('01WC00001', { name: '旧名前' }));
      const updated = await storage.update('01WC00001', { name: '新名前' });
      expect(updated.name).toBe('新名前');
    });

    it('category を更新できる', async () => {
      await storage.create(buildRecord('01WC00001', { category: 'student_days' }));
      const updated = await storage.update('01WC00001', { category: 'hobby' });
      expect(updated.category).toBe('hobby');
    });

    it('contactStatus を更新できる', async () => {
      await storage.create(buildRecord('01WC00001', { contactStatus: 'not_contacted' }));
      const updated = await storage.update('01WC00001', { contactStatus: 'replied' });
      expect(updated.contactStatus).toBe('replied');
    });

    it('prospectNote を更新できる', async () => {
      await storage.create(buildRecord('01WC00001', { prospectNote: '旧' }));
      const updated = await storage.update('01WC00001', { prospectNote: '新' });
      expect(updated.prospectNote).toBe('新');
    });

    it('note を null に更新できる', async () => {
      await storage.create(buildRecord('01WC00001', { note: '何か' }));
      const updated = await storage.update('01WC00001', { note: null });
      expect(updated.note).toBeNull();
    });

    it('id / createdAt は不可変', async () => {
      await storage.create(buildRecord('01WC00001', { createdAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01WC00001', { name: '新' });
      expect(updated.id).toBe('01WC00001');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildRecord('01WC00001', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01WC00001', { name: '新' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { name: '新' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildRecord('01WC00001'));
      await storage.delete('01WC00001');
      expect(await storage.get('01WC00001')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.create(buildRecord('01WC00001'));
      await storage.create(buildRecord('01WC00002'));
      await storage.delete('01WC00001');
      expect((await storage.list()).map((r) => r.id)).toEqual(['01WC00002']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
