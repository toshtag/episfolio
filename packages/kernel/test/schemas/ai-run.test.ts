import { describe, expect, it } from 'vitest';
import { AIRunInputSnapshotModeSchema, AIRunSchema } from '../../src/schemas/ai-run.js';

const baseRun = {
  id: '01HRUN',
  provider: 'openai',
  model: 'gpt-4o-mini',
  purpose: 'extract_evidence',
  promptId: 'extract-evidence-v1',
  promptVersion: '1.0.0',
  promptHash: 'abc123',
  modelParams: null,
  inputSnapshotMode: 'references_only' as const,
  inputSnapshot: null,
  inputReferences: { episodeIds: ['ep1'] },
  outputRaw: '{"candidates":[]}',
  outputParsed: { candidates: [] },
  parseError: null,
  tokenUsage: { input: 100, output: 50, total: 150 },
  costEstimateUSD: 0.001,
  createdAt: '2026-04-30T00:00:00Z',
};

describe('AIRunInputSnapshotModeSchema', () => {
  it('full / redacted / references_only を受理', () => {
    for (const v of ['full', 'redacted', 'references_only']) {
      expect(AIRunInputSnapshotModeSchema.safeParse(v).success).toBe(true);
    }
  });

  it('未知値を拒否', () => {
    expect(AIRunInputSnapshotModeSchema.safeParse('mock').success).toBe(false);
  });
});

describe('AIRunSchema', () => {
  it('正常系（フル指定）', () => {
    expect(AIRunSchema.safeParse(baseRun).success).toBe(true);
  });

  it('provider 空文字拒否', () => {
    expect(AIRunSchema.safeParse({ ...baseRun, provider: '' }).success).toBe(false);
  });

  it('promptHash 空文字拒否', () => {
    expect(AIRunSchema.safeParse({ ...baseRun, promptHash: '' }).success).toBe(false);
  });

  it('modelParams は null 許可、object も許可', () => {
    expect(AIRunSchema.safeParse({ ...baseRun, modelParams: null }).success).toBe(true);
    expect(AIRunSchema.safeParse({ ...baseRun, modelParams: { temperature: 0.7 } }).success).toBe(
      true,
    );
  });

  it('inputReferences は null 許可', () => {
    expect(AIRunSchema.safeParse({ ...baseRun, inputReferences: null }).success).toBe(true);
  });

  it('parseError は null 許可、文字列も許可', () => {
    expect(AIRunSchema.safeParse({ ...baseRun, parseError: 'JSON parse error' }).success).toBe(
      true,
    );
  });

  it('tokenUsage の input/output/total は非負整数のみ', () => {
    expect(
      AIRunSchema.safeParse({
        ...baseRun,
        tokenUsage: { input: -1, output: 50, total: 49 },
      }).success,
    ).toBe(false);
    expect(
      AIRunSchema.safeParse({
        ...baseRun,
        tokenUsage: { input: 1.5, output: 50, total: 51 },
      }).success,
    ).toBe(false);
  });

  it('costEstimateUSD は非負のみ、null も許可', () => {
    expect(AIRunSchema.safeParse({ ...baseRun, costEstimateUSD: -0.001 }).success).toBe(false);
    expect(AIRunSchema.safeParse({ ...baseRun, costEstimateUSD: null }).success).toBe(true);
    expect(AIRunSchema.safeParse({ ...baseRun, costEstimateUSD: 0 }).success).toBe(true);
  });

  it('inputSnapshotMode 不明値を拒否', () => {
    expect(
      AIRunSchema.safeParse({
        ...baseRun,
        inputSnapshotMode: 'mock' as 'full',
      }).success,
    ).toBe(false);
  });
});
