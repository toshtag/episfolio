import { beforeEach, describe, expect, it } from 'vitest';
import type { HiddenGemNote } from '../../src/domain/hidden-gem-note.js';
import type { HiddenGemNoteStoragePort } from '../../src/ports/hidden-gem-note-storage-port.js';
import type { HiddenGemNoteUpdate } from '../../src/schemas/hidden-gem-note.js';

class InMemoryHiddenGemNoteStorage implements HiddenGemNoteStoragePort {
  private store = new Map<string, HiddenGemNote>();

  async create(record: HiddenGemNote): Promise<HiddenGemNote> {
    this.store.set(record.id, record);
    return record;
  }

  async listByJobTarget(jobTargetId: string): Promise<HiddenGemNote[]> {
    return Array.from(this.store.values())
      .filter((r) => r.jobTargetId === jobTargetId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<HiddenGemNote | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: HiddenGemNoteUpdate): Promise<HiddenGemNote> {
    const current = this.store.get(id);
    if (!current) throw new Error(`HiddenGemNote not found: ${id}`);
    const updated: HiddenGemNote = {
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
    if (!this.store.has(id)) throw new Error(`HiddenGemNote not found: ${id}`);
    this.store.delete(id);
  }
}

const buildRecord = (id: string, overrides: Partial<HiddenGemNote> = {}): HiddenGemNote => ({
  id,
  jobTargetId: '01JT00001',
  isGntListed: true,
  nicheKeywords: 'ニッチトップ シェアNO.1',
  hasAntiMonsterMechanism: true,
  mechanismNote: '独自商品→余裕ある経営→社員を大切にする好循環',
  isHiringOnJobSites: false,
  directContactNote: '採用ページから直接応募済み',
  note: 'GNT100選掲載、優良企業と判断',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('HiddenGemNoteStoragePort contract', () => {
  let storage: HiddenGemNoteStoragePort;

  beforeEach(() => {
    storage = new InMemoryHiddenGemNoteStorage();
  });

  describe('create / get', () => {
    it('create したレコードを get で取得できる', async () => {
      const record = buildRecord('01HG00001');
      await storage.create(record);
      expect(await storage.get('01HG00001')).toEqual(record);
    });

    it('nullable フィールドが null でも保存できる', async () => {
      const record = buildRecord('01HG00001', {
        nicheKeywords: null,
        mechanismNote: null,
        directContactNote: null,
        note: null,
      });
      await storage.create(record);
      const got = await storage.get('01HG00001');
      expect(got?.nicheKeywords).toBeNull();
      expect(got?.mechanismNote).toBeNull();
      expect(got?.directContactNote).toBeNull();
    });

    it('isGntListed が false でも保存できる', async () => {
      const record = buildRecord('01HG00001', { isGntListed: false });
      await storage.create(record);
      expect((await storage.get('01HG00001'))?.isGntListed).toBe(false);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('listByJobTarget', () => {
    it('同一 jobTargetId のレコードのみ返す', async () => {
      await storage.create(buildRecord('01HG00001', { jobTargetId: '01JT00001' }));
      await storage.create(buildRecord('01HG00002', { jobTargetId: '01JT00002' }));
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01HG00001']);
    });

    it('同一 jobTargetId の複数レコードを createdAt 降順で返す', async () => {
      await storage.create(
        buildRecord('01HG00001', { jobTargetId: '01JT00001', createdAt: '2026-05-01T00:00:00Z' }),
      );
      await storage.create(
        buildRecord('01HG00002', { jobTargetId: '01JT00001', createdAt: '2026-05-03T00:00:00Z' }),
      );
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01HG00002', '01HG00001']);
    });

    it('該当レコードがない場合は空配列', async () => {
      expect(await storage.listByJobTarget('non-existent')).toEqual([]);
    });
  });

  describe('update', () => {
    it('isGntListed を更新できる', async () => {
      await storage.create(buildRecord('01HG00001', { isGntListed: true }));
      const updated = await storage.update('01HG00001', { isGntListed: false });
      expect(updated.isGntListed).toBe(false);
    });

    it('nicheKeywords を null に更新できる', async () => {
      await storage.create(buildRecord('01HG00001', { nicheKeywords: 'ニッチトップ' }));
      const updated = await storage.update('01HG00001', { nicheKeywords: null });
      expect(updated.nicheKeywords).toBeNull();
    });

    it('note を更新できる', async () => {
      await storage.create(buildRecord('01HG00001', { note: '旧メモ' }));
      const updated = await storage.update('01HG00001', { note: '追加調査が必要' });
      expect(updated.note).toBe('追加調査が必要');
    });

    it('id / jobTargetId / createdAt は不可変', async () => {
      await storage.create(
        buildRecord('01HG00001', { jobTargetId: '01JT00001', createdAt: '2026-01-01T00:00:00Z' }),
      );
      const updated = await storage.update('01HG00001', { note: '更新後メモ' });
      expect(updated.id).toBe('01HG00001');
      expect(updated.jobTargetId).toBe('01JT00001');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildRecord('01HG00001', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01HG00001', { note: '更新後' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { note: '更新' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildRecord('01HG00001'));
      await storage.delete('01HG00001');
      expect(await storage.get('01HG00001')).toBeNull();
    });

    it('削除後 listByJobTarget から消える', async () => {
      await storage.create(buildRecord('01HG00001', { jobTargetId: '01JT00001' }));
      await storage.create(buildRecord('01HG00002', { jobTargetId: '01JT00001' }));
      await storage.delete('01HG00001');
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01HG00002']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
