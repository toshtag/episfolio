import { beforeEach, describe, expect, it } from 'vitest';
import type { JobTarget } from '../../src/domain/job-target.js';
import type { JobTargetStoragePort } from '../../src/ports/job-target-storage-port.js';
import type { JobTargetUpdate } from '../../src/schemas/job-target.js';

class InMemoryJobTargetStorage implements JobTargetStoragePort {
  private store = new Map<string, JobTarget>();

  async create(target: JobTarget): Promise<JobTarget> {
    this.store.set(target.id, target);
    return target;
  }

  async list(): Promise<JobTarget[]> {
    return Array.from(this.store.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<JobTarget | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: JobTargetUpdate): Promise<JobTarget> {
    const current = this.store.get(id);
    if (!current) throw new Error(`JobTarget not found: ${id}`);
    const updated: JobTarget = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: '2026-05-01T12:00:00Z',
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error(`JobTarget not found: ${id}`);
    this.store.delete(id);
  }
}

const buildTarget = (id: string, overrides: Partial<JobTarget> = {}): JobTarget => ({
  id,
  companyName: '株式会社テスト',
  jobTitle: 'エンジニア',
  jobDescription: '',
  status: 'researching',
  requiredSkills: [],
  preferredSkills: [],
  concerns: '',
  appealPoints: '',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

describe('JobTargetStoragePort contract', () => {
  let storage: JobTargetStoragePort;

  beforeEach(() => {
    storage = new InMemoryJobTargetStorage();
  });

  describe('create / get', () => {
    it('create した JobTarget を get で取得できる', async () => {
      const t = buildTarget('01HJOB1');
      await storage.create(t);
      expect(await storage.get('01HJOB1')).toEqual(t);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('list', () => {
    it('複数件を createdAt 降順で返す', async () => {
      await storage.create(buildTarget('01HJOB1', { createdAt: '2026-05-01T00:00:00Z' }));
      await storage.create(buildTarget('01HJOB2', { createdAt: '2026-05-02T00:00:00Z' }));
      const list = await storage.list();
      expect(list.map((t) => t.id)).toEqual(['01HJOB2', '01HJOB1']);
    });
  });

  describe('update', () => {
    it('指定したフィールドだけ更新される', async () => {
      await storage.create(
        buildTarget('01HJOB1', { status: 'researching', jobTitle: '元タイトル' }),
      );
      const updated = await storage.update('01HJOB1', { status: 'applying' });
      expect(updated.status).toBe('applying');
      expect(updated.jobTitle).toBe('元タイトル');
    });

    it('id と createdAt は保持される', async () => {
      await storage.create(buildTarget('01HJOB1', { createdAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01HJOB1', { jobTitle: '新タイトル' });
      expect(updated.id).toBe('01HJOB1');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildTarget('01HJOB1', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01HJOB1', { jobTitle: '新タイトル' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('requiredSkills を構造化配列で更新できる', async () => {
      await storage.create(buildTarget('01HJOB1'));
      const skills = [{ id: '01HSKL1', text: 'Go 3年以上' }];
      const updated = await storage.update('01HJOB1', { requiredSkills: skills });
      expect(updated.requiredSkills).toEqual(skills);
    });

    it('存在しない id で更新するとエラー', async () => {
      await expect(storage.update('not-found', { status: 'applying' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildTarget('01HJOB1'));
      await storage.delete('01HJOB1');
      expect(await storage.get('01HJOB1')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.create(buildTarget('01HJOB1'));
      await storage.create(buildTarget('01HJOB2'));
      await storage.delete('01HJOB1');
      const list = await storage.list();
      expect(list.map((t) => t.id)).toEqual(['01HJOB2']);
    });

    it('存在しない id で削除するとエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
