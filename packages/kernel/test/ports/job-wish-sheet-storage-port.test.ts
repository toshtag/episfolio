import { beforeEach, describe, expect, it } from 'vitest';
import type { JobWishSheet } from '../../src/domain/job-wish-sheet.js';
import type { JobWishSheetStoragePort } from '../../src/ports/job-wish-sheet-storage-port.js';
import type { JobWishSheetUpdate } from '../../src/schemas/job-wish-sheet.js';

class InMemoryJobWishSheetStorage implements JobWishSheetStoragePort {
  private store = new Map<string, JobWishSheet>();

  async save(sheet: JobWishSheet): Promise<JobWishSheet> {
    this.store.set(sheet.id, sheet);
    return sheet;
  }

  async list(): Promise<JobWishSheet[]> {
    return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<JobWishSheet | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: JobWishSheetUpdate): Promise<JobWishSheet> {
    const current = this.store.get(id);
    if (!current) throw new Error(`JobWishSheet not found: ${id}`);
    const updated: JobWishSheet = {
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
    if (!this.store.has(id)) throw new Error(`JobWishSheet not found: ${id}`);
    this.store.delete(id);
  }
}

const buildSheet = (id: string, overrides: Partial<JobWishSheet> = {}): JobWishSheet => ({
  id,
  agentTrackRecordId: '01AGENT1',
  title: '転職希望シート',
  desiredIndustry: 'IT',
  desiredRole: 'PM',
  desiredSalary: '700万円',
  desiredLocation: '東京',
  desiredWorkStyle: 'フレックス',
  otherConditions: '',
  groupACompanies: [],
  groupBCompanies: [],
  groupCCompanies: [],
  memo: '',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

describe('JobWishSheetStoragePort contract', () => {
  let storage: JobWishSheetStoragePort;

  beforeEach(() => {
    storage = new InMemoryJobWishSheetStorage();
  });

  describe('save / get', () => {
    it('save したシートを get で取得できる', async () => {
      const s = buildSheet('01WISH001');
      await storage.save(s);
      expect(await storage.get('01WISH001')).toEqual(s);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('list', () => {
    it('全件を createdAt 昇順で返す', async () => {
      await storage.save(buildSheet('01WISH002', { createdAt: '2026-05-02T00:00:00Z' }));
      await storage.save(buildSheet('01WISH001', { createdAt: '2026-05-01T00:00:00Z' }));
      const list = await storage.list();
      expect(list.map((s) => s.id)).toEqual(['01WISH001', '01WISH002']);
    });

    it('レコードがない場合は空配列', async () => {
      expect(await storage.list()).toEqual([]);
    });

    it('agentTrackRecordId が null のシートも全件に含まれる', async () => {
      await storage.save(buildSheet('01WISH001', { agentTrackRecordId: '01AGENT1' }));
      await storage.save(buildSheet('01WISH002', { agentTrackRecordId: null }));
      expect((await storage.list()).length).toBe(2);
    });
  });

  describe('update', () => {
    it('title を patch で更新できる', async () => {
      await storage.save(buildSheet('01WISH001', { title: '旧タイトル' }));
      const updated = await storage.update('01WISH001', { title: '新タイトル' });
      expect(updated.title).toBe('新タイトル');
    });

    it('groupACompanies を更新できる', async () => {
      await storage.save(buildSheet('01WISH001'));
      const companies = [{ id: '01COMP01', name: '株式会社A', note: 'メモ' }];
      const updated = await storage.update('01WISH001', { groupACompanies: companies });
      expect(updated.groupACompanies).toEqual(companies);
    });

    it('agentTrackRecordId を null に更新できる', async () => {
      await storage.save(buildSheet('01WISH001', { agentTrackRecordId: '01AGENT1' }));
      const updated = await storage.update('01WISH001', { agentTrackRecordId: null });
      expect(updated.agentTrackRecordId).toBeNull();
    });

    it('id / createdAt は不可変', async () => {
      await storage.save(buildSheet('01WISH001', { createdAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01WISH001', { memo: '変更' });
      expect(updated.id).toBe('01WISH001');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.save(buildSheet('01WISH001', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01WISH001', { memo: '変更' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { memo: 'x' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.save(buildSheet('01WISH001'));
      await storage.delete('01WISH001');
      expect(await storage.get('01WISH001')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.save(buildSheet('01WISH001'));
      await storage.save(buildSheet('01WISH002'));
      await storage.delete('01WISH001');
      const list = await storage.list();
      expect(list.map((s) => s.id)).toEqual(['01WISH002']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
