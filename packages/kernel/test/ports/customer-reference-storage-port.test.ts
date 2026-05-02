import { beforeEach, describe, expect, it } from 'vitest';
import type { CustomerReference } from '../../src/domain/customer-reference.js';
import type { CustomerReferenceStoragePort } from '../../src/ports/customer-reference-storage-port.js';
import type { CustomerReferenceUpdate } from '../../src/schemas/customer-reference.js';

class InMemoryCustomerReferenceStorage implements CustomerReferenceStoragePort {
  private store = new Map<string, CustomerReference>();

  async create(ref: CustomerReference): Promise<CustomerReference> {
    this.store.set(ref.id, ref);
    return ref;
  }

  async list(): Promise<CustomerReference[]> {
    return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<CustomerReference | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: CustomerReferenceUpdate): Promise<CustomerReference> {
    const current = this.store.get(id);
    if (!current) throw new Error(`CustomerReference not found: ${id}`);
    const updated: CustomerReference = {
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
    if (!this.store.has(id)) throw new Error(`CustomerReference not found: ${id}`);
    this.store.delete(id);
  }
}

const buildRef = (id: string, overrides: Partial<CustomerReference> = {}): CustomerReference => ({
  id,
  customerType: 'b2b',
  customerLabel: '金融業界 IT 部門',
  companyName: '株式会社サンプル',
  period: '2020年4月〜2023年3月',
  industry: null,
  companyScale: null,
  counterpartRole: null,
  typicalRequests: null,
  ageRange: null,
  familyStatus: null,
  residence: null,
  incomeRange: null,
  hardestExperience: null,
  claimContent: null,
  responseTime: null,
  strengthEpisode: null,
  indirectRoleIdea: null,
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
  ...overrides,
});

describe('CustomerReferenceStoragePort contract', () => {
  let storage: CustomerReferenceStoragePort;

  beforeEach(() => {
    storage = new InMemoryCustomerReferenceStorage();
  });

  describe('create / get', () => {
    it('create した CustomerReference を get で取得できる', async () => {
      const ref = buildRef('01HCUST1');
      await storage.create(ref);
      expect(await storage.get('01HCUST1')).toEqual(ref);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('list', () => {
    it('作成済みの全件を createdAt 昇順で返す', async () => {
      await storage.create(buildRef('01HCUST2', { createdAt: '2026-05-02T01:00:00Z' }));
      await storage.create(buildRef('01HCUST1', { createdAt: '2026-05-01T00:00:00Z' }));
      const list = await storage.list();
      expect(list.map((r) => r.id)).toEqual(['01HCUST1', '01HCUST2']);
    });

    it('データがない場合は空配列', async () => {
      expect(await storage.list()).toEqual([]);
    });

    it('b2b と b2c が混在しても両方返す', async () => {
      await storage.create(buildRef('01HCUST1', { customerType: 'b2b' }));
      await storage.create(
        buildRef('01HCUST2', { customerType: 'b2c', createdAt: '2026-05-02T01:00:00Z' }),
      );
      const list = await storage.list();
      expect(list.map((r) => r.customerType).sort()).toEqual(['b2b', 'b2c']);
    });
  });

  describe('update', () => {
    it('companyName を patch で更新できる', async () => {
      await storage.create(buildRef('01HCUST1', { companyName: '旧会社' }));
      const updated = await storage.update('01HCUST1', { companyName: '新会社' });
      expect(updated.companyName).toBe('新会社');
    });

    it('customerType を b2b から b2c に切り替えできる', async () => {
      await storage.create(buildRef('01HCUST1', { customerType: 'b2b' }));
      const updated = await storage.update('01HCUST1', { customerType: 'b2c' });
      expect(updated.customerType).toBe('b2c');
    });

    it('industry を null から文字列に更新できる', async () => {
      await storage.create(buildRef('01HCUST1', { industry: null }));
      const updated = await storage.update('01HCUST1', { industry: '金融' });
      expect(updated.industry).toBe('金融');
    });

    it('hardestExperience を文字列から null に更新できる', async () => {
      await storage.create(buildRef('01HCUST1', { hardestExperience: '深夜対応' }));
      const updated = await storage.update('01HCUST1', { hardestExperience: null });
      expect(updated.hardestExperience).toBeNull();
    });

    it('strengthEpisode と indirectRoleIdea を同時に更新できる', async () => {
      await storage.create(buildRef('01HCUST1'));
      const updated = await storage.update('01HCUST1', {
        strengthEpisode: '傾聴力',
        indirectRoleIdea: '営業支援職',
      });
      expect(updated.strengthEpisode).toBe('傾聴力');
      expect(updated.indirectRoleIdea).toBe('営業支援職');
    });

    it('id / createdAt は不可変', async () => {
      await storage.create(buildRef('01HCUST1', { createdAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01HCUST1', { companyName: '新会社' });
      expect(updated.id).toBe('01HCUST1');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildRef('01HCUST1', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01HCUST1', { companyName: '新会社' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { companyName: '新会社' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildRef('01HCUST1'));
      await storage.delete('01HCUST1');
      expect(await storage.get('01HCUST1')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.create(buildRef('01HCUST1'));
      await storage.create(buildRef('01HCUST2'));
      await storage.delete('01HCUST1');
      const list = await storage.list();
      expect(list.map((r) => r.id)).toEqual(['01HCUST2']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
