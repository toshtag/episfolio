import { beforeEach, describe, expect, it } from 'vitest';
import type { MicrochopSkill } from '../../src/domain/microchop-skill.js';
import type { MicrochopSkillStoragePort } from '../../src/ports/microchop-skill-storage-port.js';
import type { MicrochopSkillUpdate } from '../../src/schemas/microchop-skill.js';

class InMemoryMicrochopSkillStorage implements MicrochopSkillStoragePort {
  private store = new Map<string, MicrochopSkill>();

  async create(record: MicrochopSkill): Promise<MicrochopSkill> {
    this.store.set(record.id, record);
    return record;
  }

  async list(): Promise<MicrochopSkill[]> {
    return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<MicrochopSkill | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: MicrochopSkillUpdate): Promise<MicrochopSkill> {
    const current = this.store.get(id);
    if (!current) throw new Error(`MicrochopSkill not found: ${id}`);
    const updated: MicrochopSkill = {
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
    if (!this.store.has(id)) throw new Error(`MicrochopSkill not found: ${id}`);
    this.store.delete(id);
  }
}

const buildRecord = (id: string, overrides: Partial<MicrochopSkill> = {}): MicrochopSkill => ({
  id,
  jobTitle: '営業担当',
  industry: '製造業',
  tasks: [
    { id: '01MCT0001', label: '企業の調査', transferable: true },
    { id: '01MCT0002', label: '業界固有の契約処理', transferable: false },
  ],
  transferableSkills: 'ヒアリング力、資料作成力',
  note: null,
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('MicrochopSkillStoragePort contract', () => {
  let storage: MicrochopSkillStoragePort;

  beforeEach(() => {
    storage = new InMemoryMicrochopSkillStorage();
  });

  describe('create / get', () => {
    it('create したレコードを get で取得できる', async () => {
      const record = buildRecord('01MCS0001');
      await storage.create(record);
      expect(await storage.get('01MCS0001')).toEqual(record);
    });

    it('tasks が空配列でも保存できる', async () => {
      const record = buildRecord('01MCS0001', { tasks: [] });
      await storage.create(record);
      expect((await storage.get('01MCS0001'))?.tasks).toEqual([]);
    });

    it('note が null でも保存できる', async () => {
      const record = buildRecord('01MCS0001', { note: null });
      await storage.create(record);
      expect((await storage.get('01MCS0001'))?.note).toBeNull();
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('list', () => {
    it('全件を createdAt 昇順で返す', async () => {
      await storage.create(buildRecord('01MCS0002', { createdAt: '2026-05-03T01:00:00Z' }));
      await storage.create(buildRecord('01MCS0001', { createdAt: '2026-05-02T00:00:00Z' }));
      const list = await storage.list();
      expect(list.map((r) => r.id)).toEqual(['01MCS0001', '01MCS0002']);
    });

    it('データがない場合は空配列', async () => {
      expect(await storage.list()).toEqual([]);
    });
  });

  describe('update', () => {
    it('jobTitle を更新できる', async () => {
      await storage.create(buildRecord('01MCS0001', { jobTitle: '旧' }));
      const updated = await storage.update('01MCS0001', { jobTitle: '新' });
      expect(updated.jobTitle).toBe('新');
    });

    it('industry を更新できる', async () => {
      await storage.create(buildRecord('01MCS0001', { industry: '旧業界' }));
      const updated = await storage.update('01MCS0001', { industry: '新業界' });
      expect(updated.industry).toBe('新業界');
    });

    it('tasks を更新できる', async () => {
      await storage.create(buildRecord('01MCS0001'));
      const newTasks = [{ id: '01MCT0099', label: '新タスク', transferable: true }];
      const updated = await storage.update('01MCS0001', { tasks: newTasks });
      expect(updated.tasks).toEqual(newTasks);
    });

    it('transferableSkills を更新できる', async () => {
      await storage.create(buildRecord('01MCS0001', { transferableSkills: '旧スキル' }));
      const updated = await storage.update('01MCS0001', { transferableSkills: '新スキル' });
      expect(updated.transferableSkills).toBe('新スキル');
    });

    it('note を null に更新できる', async () => {
      await storage.create(buildRecord('01MCS0001', { note: '何か' }));
      const updated = await storage.update('01MCS0001', { note: null });
      expect(updated.note).toBeNull();
    });

    it('id / createdAt は不可変', async () => {
      await storage.create(buildRecord('01MCS0001', { createdAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01MCS0001', { jobTitle: '新' });
      expect(updated.id).toBe('01MCS0001');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildRecord('01MCS0001', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01MCS0001', { jobTitle: '新' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { jobTitle: '新' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildRecord('01MCS0001'));
      await storage.delete('01MCS0001');
      expect(await storage.get('01MCS0001')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.create(buildRecord('01MCS0001'));
      await storage.create(buildRecord('01MCS0002'));
      await storage.delete('01MCS0001');
      expect((await storage.list()).map((r) => r.id)).toEqual(['01MCS0002']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
