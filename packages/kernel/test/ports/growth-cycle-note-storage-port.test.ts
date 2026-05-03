import { beforeEach, describe, expect, it } from 'vitest';
import type { GrowthCycleNote } from '../../src/domain/growth-cycle-note.js';
import type { GrowthCycleNoteStoragePort } from '../../src/ports/growth-cycle-note-storage-port.js';
import type { GrowthCycleNoteUpdate } from '../../src/schemas/growth-cycle-note.js';

class InMemoryGrowthCycleNoteStorage implements GrowthCycleNoteStoragePort {
  private store = new Map<string, GrowthCycleNote>();

  async create(record: GrowthCycleNote): Promise<GrowthCycleNote> {
    this.store.set(record.id, record);
    return record;
  }

  async listByJobTarget(jobTargetId: string): Promise<GrowthCycleNote[]> {
    return Array.from(this.store.values())
      .filter((r) => r.jobTargetId === jobTargetId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<GrowthCycleNote | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: GrowthCycleNoteUpdate): Promise<GrowthCycleNote> {
    const current = this.store.get(id);
    if (!current) throw new Error(`GrowthCycleNote not found: ${id}`);
    const updated: GrowthCycleNote = {
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
    if (!this.store.has(id)) throw new Error(`GrowthCycleNote not found: ${id}`);
    this.store.delete(id);
  }
}

const buildRecord = (id: string, overrides: Partial<GrowthCycleNote> = {}): GrowthCycleNote => ({
  id,
  jobTargetId: '01JT00001',
  growthStage: 'stable_expansion',
  stageNote: '売上安定、黒字化継続',
  isLongTermSuitable: true,
  note: '腰を据えて働ける環境',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('GrowthCycleNoteStoragePort contract', () => {
  let storage: GrowthCycleNoteStoragePort;

  beforeEach(() => {
    storage = new InMemoryGrowthCycleNoteStorage();
  });

  describe('create / get', () => {
    it('create したレコードを get で取得できる', async () => {
      const record = buildRecord('01GC00001');
      await storage.create(record);
      expect(await storage.get('01GC00001')).toEqual(record);
    });

    it('nullable フィールドが null でも保存できる', async () => {
      const record = buildRecord('01GC00001', { stageNote: null, note: null });
      await storage.create(record);
      const got = await storage.get('01GC00001');
      expect(got?.stageNote).toBeNull();
      expect(got?.note).toBeNull();
    });

    it('growthStage が null でも保存できる', async () => {
      const record = buildRecord('01GC00001', { growthStage: null });
      await storage.create(record);
      expect((await storage.get('01GC00001'))?.growthStage).toBeNull();
    });

    it('isLongTermSuitable が false でも保存できる', async () => {
      const record = buildRecord('01GC00001', { isLongTermSuitable: false });
      await storage.create(record);
      expect((await storage.get('01GC00001'))?.isLongTermSuitable).toBe(false);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('listByJobTarget', () => {
    it('同一 jobTargetId のレコードのみ返す', async () => {
      await storage.create(buildRecord('01GC00001', { jobTargetId: '01JT00001' }));
      await storage.create(buildRecord('01GC00002', { jobTargetId: '01JT00002' }));
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01GC00001']);
    });

    it('同一 jobTargetId の複数レコードを createdAt 降順で返す', async () => {
      await storage.create(
        buildRecord('01GC00001', { jobTargetId: '01JT00001', createdAt: '2026-05-01T00:00:00Z' }),
      );
      await storage.create(
        buildRecord('01GC00002', { jobTargetId: '01JT00001', createdAt: '2026-05-03T00:00:00Z' }),
      );
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01GC00002', '01GC00001']);
    });

    it('該当レコードがない場合は空配列', async () => {
      expect(await storage.listByJobTarget('non-existent')).toEqual([]);
    });
  });

  describe('update', () => {
    it('growthStage を更新できる', async () => {
      await storage.create(buildRecord('01GC00001', { growthStage: 'startup' }));
      const updated = await storage.update('01GC00001', { growthStage: 'growth' });
      expect(updated.growthStage).toBe('growth');
    });

    it('growthStage を null に更新できる', async () => {
      await storage.create(buildRecord('01GC00001', { growthStage: 'stable_expansion' }));
      const updated = await storage.update('01GC00001', { growthStage: null });
      expect(updated.growthStage).toBeNull();
    });

    it('isLongTermSuitable を更新できる', async () => {
      await storage.create(buildRecord('01GC00001', { isLongTermSuitable: true }));
      const updated = await storage.update('01GC00001', { isLongTermSuitable: false });
      expect(updated.isLongTermSuitable).toBe(false);
    });

    it('note を更新できる', async () => {
      await storage.create(buildRecord('01GC00001', { note: '旧メモ' }));
      const updated = await storage.update('01GC00001', { note: '再確認が必要' });
      expect(updated.note).toBe('再確認が必要');
    });

    it('id / jobTargetId / createdAt は不可変', async () => {
      await storage.create(
        buildRecord('01GC00001', { jobTargetId: '01JT00001', createdAt: '2026-01-01T00:00:00Z' }),
      );
      const updated = await storage.update('01GC00001', { note: '更新後メモ' });
      expect(updated.id).toBe('01GC00001');
      expect(updated.jobTargetId).toBe('01JT00001');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildRecord('01GC00001', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01GC00001', { note: '更新後' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { note: '更新' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildRecord('01GC00001'));
      await storage.delete('01GC00001');
      expect(await storage.get('01GC00001')).toBeNull();
    });

    it('削除後 listByJobTarget から消える', async () => {
      await storage.create(buildRecord('01GC00001', { jobTargetId: '01JT00001' }));
      await storage.create(buildRecord('01GC00002', { jobTargetId: '01JT00001' }));
      await storage.delete('01GC00001');
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01GC00002']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
