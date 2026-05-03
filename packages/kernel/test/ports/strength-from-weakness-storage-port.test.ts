import { beforeEach, describe, expect, it } from 'vitest';
import type { StrengthFromWeakness } from '../../src/domain/strength-from-weakness.js';
import type { StrengthFromWeaknessStoragePort } from '../../src/ports/strength-from-weakness-storage-port.js';
import type { StrengthFromWeaknessUpdate } from '../../src/schemas/strength-from-weakness.js';

class InMemoryStrengthFromWeaknessStorage implements StrengthFromWeaknessStoragePort {
  private store = new Map<string, StrengthFromWeakness>();

  async create(record: StrengthFromWeakness): Promise<StrengthFromWeakness> {
    this.store.set(record.id, record);
    return record;
  }

  async list(): Promise<StrengthFromWeakness[]> {
    return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<StrengthFromWeakness | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: StrengthFromWeaknessUpdate): Promise<StrengthFromWeakness> {
    const current = this.store.get(id);
    if (!current) throw new Error(`StrengthFromWeakness not found: ${id}`);
    const updated: StrengthFromWeakness = {
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
    if (!this.store.has(id)) throw new Error(`StrengthFromWeakness not found: ${id}`);
    this.store.delete(id);
  }
}

const buildRecord = (
  id: string,
  overrides: Partial<StrengthFromWeakness> = {},
): StrengthFromWeakness => ({
  id,
  weaknessLabel: '1年での早期退職',
  blankType: 'early_resign',
  background: '営業が辛くて1年で退職した',
  reframe: '現場の本音を理解できる採用担当者になれる',
  targetCompanyProfile: '社員の弱みを受け入れる文化がある会社',
  note: null,
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('StrengthFromWeaknessStoragePort contract', () => {
  let storage: StrengthFromWeaknessStoragePort;

  beforeEach(() => {
    storage = new InMemoryStrengthFromWeaknessStorage();
  });

  describe('create / get', () => {
    it('create したレコードを get で取得できる', async () => {
      const record = buildRecord('01SFW0001');
      await storage.create(record);
      expect(await storage.get('01SFW0001')).toEqual(record);
    });

    it('blankType が null でも保存できる', async () => {
      const record = buildRecord('01SFW0001', { blankType: null });
      await storage.create(record);
      expect((await storage.get('01SFW0001'))?.blankType).toBeNull();
    });

    it('note が null でも保存できる', async () => {
      const record = buildRecord('01SFW0001', { note: null });
      await storage.create(record);
      expect((await storage.get('01SFW0001'))?.note).toBeNull();
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('list', () => {
    it('全件を createdAt 昇順で返す', async () => {
      await storage.create(buildRecord('01SFW0002', { createdAt: '2026-05-03T01:00:00Z' }));
      await storage.create(buildRecord('01SFW0001', { createdAt: '2026-05-02T00:00:00Z' }));
      const list = await storage.list();
      expect(list.map((r) => r.id)).toEqual(['01SFW0001', '01SFW0002']);
    });

    it('データがない場合は空配列', async () => {
      expect(await storage.list()).toEqual([]);
    });
  });

  describe('update', () => {
    it('weaknessLabel を更新できる', async () => {
      await storage.create(buildRecord('01SFW0001', { weaknessLabel: '旧' }));
      const updated = await storage.update('01SFW0001', { weaknessLabel: '新' });
      expect(updated.weaknessLabel).toBe('新');
    });

    it('blankType を null に更新できる', async () => {
      await storage.create(buildRecord('01SFW0001', { blankType: 'leave' }));
      const updated = await storage.update('01SFW0001', { blankType: null });
      expect(updated.blankType).toBeNull();
    });

    it('reframe を更新できる', async () => {
      await storage.create(buildRecord('01SFW0001', { reframe: '旧' }));
      const updated = await storage.update('01SFW0001', { reframe: '新' });
      expect(updated.reframe).toBe('新');
    });

    it('targetCompanyProfile を更新できる', async () => {
      await storage.create(buildRecord('01SFW0001', { targetCompanyProfile: '旧' }));
      const updated = await storage.update('01SFW0001', { targetCompanyProfile: '新' });
      expect(updated.targetCompanyProfile).toBe('新');
    });

    it('note を null に更新できる', async () => {
      await storage.create(buildRecord('01SFW0001', { note: '何か' }));
      const updated = await storage.update('01SFW0001', { note: null });
      expect(updated.note).toBeNull();
    });

    it('id / createdAt は不可変', async () => {
      await storage.create(buildRecord('01SFW0001', { createdAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01SFW0001', { weaknessLabel: '新' });
      expect(updated.id).toBe('01SFW0001');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildRecord('01SFW0001', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01SFW0001', { weaknessLabel: '新' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { weaknessLabel: '新' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildRecord('01SFW0001'));
      await storage.delete('01SFW0001');
      expect(await storage.get('01SFW0001')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.create(buildRecord('01SFW0001'));
      await storage.create(buildRecord('01SFW0002'));
      await storage.delete('01SFW0001');
      expect((await storage.list()).map((r) => r.id)).toEqual(['01SFW0002']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
