import { beforeEach, describe, expect, it } from 'vitest';
import type { InterviewQA } from '../../src/domain/interview-qa.js';
import type { InterviewQAStoragePort } from '../../src/ports/interview-qa-storage-port.js';
import type { InterviewQAUpdate } from '../../src/schemas/interview-qa.js';

class InMemoryInterviewQAStorage implements InterviewQAStoragePort {
  private store = new Map<string, InterviewQA>();

  async create(qa: InterviewQA): Promise<InterviewQA> {
    this.store.set(qa.id, qa);
    return qa;
  }

  async listByJobTarget(
    jobTargetId: string,
    sortBy: 'order' | 'createdAt' = 'order',
  ): Promise<InterviewQA[]> {
    const items = Array.from(this.store.values()).filter((qa) => qa.jobTargetId === jobTargetId);
    if (sortBy === 'createdAt') {
      return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    return items.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async get(id: string): Promise<InterviewQA | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: InterviewQAUpdate): Promise<InterviewQA> {
    const current = this.store.get(id);
    if (!current) throw new Error(`InterviewQA not found: ${id}`);
    const updated: InterviewQA = {
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
    if (!this.store.has(id)) throw new Error(`InterviewQA not found: ${id}`);
    this.store.delete(id);
  }

  async reorder(jobTargetId: string, idsInOrder: string[]): Promise<void> {
    idsInOrder.forEach((id, index) => {
      const qa = this.store.get(id);
      if (!qa || qa.jobTargetId !== jobTargetId) return;
      this.store.set(id, { ...qa, orderIndex: index });
    });
  }
}

const buildQA = (id: string, overrides: Partial<InterviewQA> = {}): InterviewQA => ({
  id,
  jobTargetId: '01HJOB1',
  category: 'motivation',
  questionAsked: '志望動機を教えてください',
  recommendedAnswer: null,
  answerToAvoid: null,
  questionIntent: null,
  orderIndex: 0,
  source: 'manual',
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
  ...overrides,
});

describe('InterviewQAStoragePort contract', () => {
  let storage: InterviewQAStoragePort;

  beforeEach(() => {
    storage = new InMemoryInterviewQAStorage();
  });

  describe('create / get', () => {
    it('create した QA を get で取得できる', async () => {
      const qa = buildQA('01HIQA1');
      await storage.create(qa);
      expect(await storage.get('01HIQA1')).toEqual(qa);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('listByJobTarget', () => {
    it('指定した jobTargetId の QA のみ返す', async () => {
      await storage.create(buildQA('01HIQA1', { jobTargetId: '01HJOB_A' }));
      await storage.create(buildQA('01HIQA2', { jobTargetId: '01HJOB_B' }));
      await storage.create(buildQA('01HIQA3', { jobTargetId: '01HJOB_A' }));
      const list = await storage.listByJobTarget('01HJOB_A');
      expect(list.map((qa) => qa.id).sort()).toEqual(['01HIQA1', '01HIQA3']);
    });

    it('sortBy order でorderIndex 昇順に返す', async () => {
      await storage.create(buildQA('01HIQA1', { jobTargetId: '01HJOB_A', orderIndex: 2 }));
      await storage.create(buildQA('01HIQA2', { jobTargetId: '01HJOB_A', orderIndex: 0 }));
      await storage.create(buildQA('01HIQA3', { jobTargetId: '01HJOB_A', orderIndex: 1 }));
      const list = await storage.listByJobTarget('01HJOB_A', 'order');
      expect(list.map((qa) => qa.id)).toEqual(['01HIQA2', '01HIQA3', '01HIQA1']);
    });

    it('sortBy createdAt で createdAt 昇順に返す', async () => {
      await storage.create(
        buildQA('01HIQA1', { jobTargetId: '01HJOB_A', createdAt: '2026-05-02T00:00:00Z' }),
      );
      await storage.create(
        buildQA('01HIQA2', { jobTargetId: '01HJOB_A', createdAt: '2026-05-01T00:00:00Z' }),
      );
      const list = await storage.listByJobTarget('01HJOB_A', 'createdAt');
      expect(list.map((qa) => qa.id)).toEqual(['01HIQA2', '01HIQA1']);
    });

    it('sortBy 省略時は order ソート', async () => {
      await storage.create(buildQA('01HIQA1', { jobTargetId: '01HJOB_A', orderIndex: 1 }));
      await storage.create(buildQA('01HIQA2', { jobTargetId: '01HJOB_A', orderIndex: 0 }));
      const list = await storage.listByJobTarget('01HJOB_A');
      expect(list.map((qa) => qa.id)).toEqual(['01HIQA2', '01HIQA1']);
    });

    it('該当 QA がない jobTargetId は空配列', async () => {
      await storage.create(buildQA('01HIQA1', { jobTargetId: '01HJOB_A' }));
      expect(await storage.listByJobTarget('01HJOB_X')).toEqual([]);
    });
  });

  describe('update', () => {
    it('questionAsked を patch で更新できる', async () => {
      await storage.create(buildQA('01HIQA1', { questionAsked: '旧質問' }));
      const updated = await storage.update('01HIQA1', { questionAsked: '新質問' });
      expect(updated.questionAsked).toBe('新質問');
    });

    it('recommendedAnswer を null から文字列に更新できる', async () => {
      await storage.create(buildQA('01HIQA1', { recommendedAnswer: null }));
      const updated = await storage.update('01HIQA1', { recommendedAnswer: '推奨回答' });
      expect(updated.recommendedAnswer).toBe('推奨回答');
    });

    it('recommendedAnswer を文字列から null に更新できる', async () => {
      await storage.create(buildQA('01HIQA1', { recommendedAnswer: '推奨回答' }));
      const updated = await storage.update('01HIQA1', { recommendedAnswer: null });
      expect(updated.recommendedAnswer).toBeNull();
    });

    it('id / jobTargetId / createdAt は不可変', async () => {
      await storage.create(
        buildQA('01HIQA1', { jobTargetId: '01HJOB1', createdAt: '2026-01-01T00:00:00Z' }),
      );
      const updated = await storage.update('01HIQA1', { questionAsked: '新質問' });
      expect(updated.id).toBe('01HIQA1');
      expect(updated.jobTargetId).toBe('01HJOB1');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildQA('01HIQA1', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01HIQA1', { questionAsked: '新質問' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { questionAsked: 'Q' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildQA('01HIQA1'));
      await storage.delete('01HIQA1');
      expect(await storage.get('01HIQA1')).toBeNull();
    });

    it('削除後 listByJobTarget から消える', async () => {
      await storage.create(buildQA('01HIQA1', { jobTargetId: '01HJOB_A', orderIndex: 0 }));
      await storage.create(buildQA('01HIQA2', { jobTargetId: '01HJOB_A', orderIndex: 1 }));
      await storage.delete('01HIQA1');
      const list = await storage.listByJobTarget('01HJOB_A');
      expect(list.map((qa) => qa.id)).toEqual(['01HIQA2']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });

  describe('reorder', () => {
    it('指定した順番で orderIndex が更新される', async () => {
      await storage.create(buildQA('01HIQA1', { jobTargetId: '01HJOB_A', orderIndex: 0 }));
      await storage.create(buildQA('01HIQA2', { jobTargetId: '01HJOB_A', orderIndex: 1 }));
      await storage.create(buildQA('01HIQA3', { jobTargetId: '01HJOB_A', orderIndex: 2 }));
      await storage.reorder('01HJOB_A', ['01HIQA3', '01HIQA1', '01HIQA2']);
      const list = await storage.listByJobTarget('01HJOB_A', 'order');
      expect(list.map((qa) => qa.id)).toEqual(['01HIQA3', '01HIQA1', '01HIQA2']);
    });

    it('別 jobTargetId の QA は reorder の影響を受けない', async () => {
      await storage.create(buildQA('01HIQA1', { jobTargetId: '01HJOB_A', orderIndex: 0 }));
      await storage.create(buildQA('01HIQA2', { jobTargetId: '01HJOB_B', orderIndex: 0 }));
      await storage.reorder('01HJOB_A', ['01HIQA1']);
      const qa2 = await storage.get('01HIQA2');
      expect(qa2?.orderIndex).toBe(0);
    });
  });
});
