import { beforeEach, describe, expect, it } from 'vitest';
import type { ApplicationMotive } from '../../src/domain/application-motive.js';
import type { ApplicationMotiveStoragePort } from '../../src/ports/application-motive-storage-port.js';
import type { ApplicationMotiveUpdate } from '../../src/schemas/application-motive.js';

class InMemoryApplicationMotiveStorage implements ApplicationMotiveStoragePort {
  private store = new Map<string, ApplicationMotive>();

  async save(motive: ApplicationMotive): Promise<ApplicationMotive> {
    this.store.set(motive.id, motive);
    return motive;
  }

  async list(): Promise<ApplicationMotive[]> {
    return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listByJobTarget(jobTargetId: string): Promise<ApplicationMotive[]> {
    return (await this.list()).filter((m) => m.jobTargetId === jobTargetId);
  }

  async get(id: string): Promise<ApplicationMotive | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: ApplicationMotiveUpdate): Promise<ApplicationMotive> {
    const current = this.store.get(id);
    if (!current) throw new Error(`ApplicationMotive not found: ${id}`);
    const updated: ApplicationMotive = {
      ...current,
      ...patch,
      id: current.id,
      jobTargetId: current.jobTargetId,
      createdAt: current.createdAt,
      updatedAt: '2026-05-02T12:00:00Z',
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error(`ApplicationMotive not found: ${id}`);
    this.store.delete(id);
  }
}

const build = (
  id: string,
  jobTargetId: string,
  overrides: Partial<ApplicationMotive> = {},
): ApplicationMotive => ({
  id,
  jobTargetId,
  companyFuture: 'DX 推進',
  contributionAction: 'プロダクト開発の高速化',
  leveragedExperience: 'スタートアップ経験',
  formattedText: '私はDX 推進を達成するために、貴社を志望しています。',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

describe('ApplicationMotiveStoragePort contract', () => {
  let storage: ApplicationMotiveStoragePort;

  beforeEach(() => {
    storage = new InMemoryApplicationMotiveStorage();
  });

  describe('save / get', () => {
    it('save したレコードを get で取得できる', async () => {
      const m = build('01APPMO01', '01JOBTG1');
      await storage.save(m);
      expect(await storage.get('01APPMO01')).toEqual(m);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('list', () => {
    it('全件を createdAt 昇順で返す', async () => {
      await storage.save(build('01APPMO02', '01JOBTG1', { createdAt: '2026-05-02T00:00:00Z' }));
      await storage.save(build('01APPMO01', '01JOBTG1', { createdAt: '2026-05-01T00:00:00Z' }));
      const list = await storage.list();
      expect(list.map((m) => m.id)).toEqual(['01APPMO01', '01APPMO02']);
    });

    it('レコードがない場合は空配列', async () => {
      expect(await storage.list()).toEqual([]);
    });
  });

  describe('listByJobTarget', () => {
    it('指定した jobTargetId のレコードのみ返す', async () => {
      await storage.save(build('01APPMO01', '01JOBTG1'));
      await storage.save(build('01APPMO02', '01JOBTG2'));
      await storage.save(build('01APPMO03', '01JOBTG1'));
      const list = await storage.listByJobTarget('01JOBTG1');
      expect(list.map((m) => m.id).sort()).toEqual(['01APPMO01', '01APPMO03']);
    });

    it('該当なしの場合は空配列', async () => {
      await storage.save(build('01APPMO01', '01JOBTG1'));
      expect(await storage.listByJobTarget('no-such-target')).toEqual([]);
    });
  });

  describe('update', () => {
    it('companyFuture を patch で更新できる', async () => {
      await storage.save(build('01APPMO01', '01JOBTG1', { companyFuture: '旧ビジョン' }));
      const updated = await storage.update('01APPMO01', { companyFuture: '新ビジョン' });
      expect(updated.companyFuture).toBe('新ビジョン');
    });

    it('formattedText を更新できる', async () => {
      await storage.save(build('01APPMO01', '01JOBTG1'));
      const updated = await storage.update('01APPMO01', { formattedText: '新しい文章' });
      expect(updated.formattedText).toBe('新しい文章');
    });

    it('jobTargetId は不可変', async () => {
      await storage.save(build('01APPMO01', '01JOBTG1'));
      const updated = await storage.update('01APPMO01', { companyFuture: '変更' });
      expect(updated.jobTargetId).toBe('01JOBTG1');
    });

    it('id / createdAt は不可変', async () => {
      await storage.save(build('01APPMO01', '01JOBTG1', { createdAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01APPMO01', { companyFuture: '変更' });
      expect(updated.id).toBe('01APPMO01');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.save(build('01APPMO01', '01JOBTG1', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01APPMO01', { companyFuture: '変更' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { companyFuture: 'x' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.save(build('01APPMO01', '01JOBTG1'));
      await storage.delete('01APPMO01');
      expect(await storage.get('01APPMO01')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.save(build('01APPMO01', '01JOBTG1'));
      await storage.save(build('01APPMO02', '01JOBTG1'));
      await storage.delete('01APPMO01');
      const list = await storage.list();
      expect(list.map((m) => m.id)).toEqual(['01APPMO02']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
