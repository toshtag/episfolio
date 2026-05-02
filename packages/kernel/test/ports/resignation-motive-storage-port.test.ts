import { beforeEach, describe, expect, it } from 'vitest';
import type { ResignationMotive } from '../../src/domain/resignation-motive.js';
import type { ResignationMotiveStoragePort } from '../../src/ports/resignation-motive-storage-port.js';
import type { ResignationMotiveUpdate } from '../../src/schemas/resignation-motive.js';

class InMemoryResignationMotiveStorage implements ResignationMotiveStoragePort {
  private store = new Map<string, ResignationMotive>();

  async save(motive: ResignationMotive): Promise<ResignationMotive> {
    this.store.set(motive.id, motive);
    return motive;
  }

  async list(): Promise<ResignationMotive[]> {
    return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<ResignationMotive | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: ResignationMotiveUpdate): Promise<ResignationMotive> {
    const current = this.store.get(id);
    if (!current) throw new Error(`ResignationMotive not found: ${id}`);
    const updated: ResignationMotive = {
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
    if (!this.store.has(id)) throw new Error(`ResignationMotive not found: ${id}`);
    this.store.delete(id);
  }
}

const build = (id: string, overrides: Partial<ResignationMotive> = {}): ResignationMotive => ({
  id,
  companyDissatisfaction: '成長機会が少ない',
  jobDissatisfaction: '裁量が小さい',
  compensationDissatisfaction: '市場水準より低い',
  relationshipDissatisfaction: '上司との方向性の違い',
  resolutionIntent: '自律的に動ける環境に移る',
  note: null,
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

describe('ResignationMotiveStoragePort contract', () => {
  let storage: ResignationMotiveStoragePort;

  beforeEach(() => {
    storage = new InMemoryResignationMotiveStorage();
  });

  describe('save / get', () => {
    it('save したレコードを get で取得できる', async () => {
      const m = build('01RESIGN1');
      await storage.save(m);
      expect(await storage.get('01RESIGN1')).toEqual(m);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('list', () => {
    it('全件を createdAt 昇順で返す', async () => {
      await storage.save(build('01RESIGN2', { createdAt: '2026-05-02T00:00:00Z' }));
      await storage.save(build('01RESIGN1', { createdAt: '2026-05-01T00:00:00Z' }));
      const list = await storage.list();
      expect(list.map((m) => m.id)).toEqual(['01RESIGN1', '01RESIGN2']);
    });

    it('レコードがない場合は空配列', async () => {
      expect(await storage.list()).toEqual([]);
    });

    it('note が null のレコードも全件に含まれる', async () => {
      await storage.save(build('01RESIGN1', { note: null }));
      await storage.save(build('01RESIGN2', { note: 'メモあり' }));
      expect((await storage.list()).length).toBe(2);
    });
  });

  describe('update', () => {
    it('resolutionIntent を patch で更新できる', async () => {
      await storage.save(build('01RESIGN1', { resolutionIntent: '旧意図' }));
      const updated = await storage.update('01RESIGN1', { resolutionIntent: '新意図' });
      expect(updated.resolutionIntent).toBe('新意図');
    });

    it('note を文字列で更新できる', async () => {
      await storage.save(build('01RESIGN1', { note: null }));
      const updated = await storage.update('01RESIGN1', { note: 'メモ追加' });
      expect(updated.note).toBe('メモ追加');
    });

    it('note を null で更新できる', async () => {
      await storage.save(build('01RESIGN1', { note: 'メモ' }));
      const updated = await storage.update('01RESIGN1', { note: null });
      expect(updated.note).toBeNull();
    });

    it('id / createdAt は不可変', async () => {
      await storage.save(build('01RESIGN1', { createdAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01RESIGN1', { resolutionIntent: '変更' });
      expect(updated.id).toBe('01RESIGN1');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.save(build('01RESIGN1', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01RESIGN1', { resolutionIntent: '変更' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { resolutionIntent: 'x' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.save(build('01RESIGN1'));
      await storage.delete('01RESIGN1');
      expect(await storage.get('01RESIGN1')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.save(build('01RESIGN1'));
      await storage.save(build('01RESIGN2'));
      await storage.delete('01RESIGN1');
      const list = await storage.list();
      expect(list.map((m) => m.id)).toEqual(['01RESIGN2']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
