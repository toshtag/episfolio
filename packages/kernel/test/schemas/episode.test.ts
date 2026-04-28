import { describe, expect, it } from 'vitest';
import { EpisodeDraftSchema, EpisodeSchema } from '../../src/schemas/episode.js';

const validEpisode = {
  id: '01JQZB3K2MXNV8P4RY5T6W7F9D',
  title: 'チームの障害対応を主導した',
  background: '本番サービスが深夜に停止した',
  problem: 'DBコネクションプールが枯渇',
  action: '接続数の上限を特定し緊急でパラメータを変更',
  ingenuity: 'ログから根本原因を 15 分で特定',
  result: '30 分以内に復旧',
  metrics: 'ダウンタイム 30 分、影響ユーザー 500 人',
  beforeAfter: '障害対応プロセスが整備されていなかった → 後にランブックを作成',
  reproducibility: '同様の障害を 2 度防いだ',
  relatedSkills: ['障害対応', 'SRE', 'PostgreSQL'],
  personalFeeling: '冷静に対処できた',
  externalFeedback: 'マネージャーから対応を称賛された',
  remoteLLMAllowed: false,
  tags: ['backend', 'incident'],
  createdAt: '2026-04-28T00:00:00Z',
  updatedAt: '2026-04-28T00:00:00Z',
};

describe('EpisodeSchema', () => {
  it('有効なエピソードを受け入れる', () => {
    const result = EpisodeSchema.safeParse(validEpisode);
    expect(result.success).toBe(true);
  });

  it('title が空文字のとき失敗する', () => {
    const result = EpisodeSchema.safeParse({ ...validEpisode, title: '' });
    expect(result.success).toBe(false);
  });

  it('id が空文字のとき失敗する', () => {
    const result = EpisodeSchema.safeParse({ ...validEpisode, id: '' });
    expect(result.success).toBe(false);
  });

  it('remoteLLMAllowed が boolean 以外のとき失敗する', () => {
    const result = EpisodeSchema.safeParse({ ...validEpisode, remoteLLMAllowed: 'false' });
    expect(result.success).toBe(false);
  });

  it('relatedSkills が配列でないとき失敗する', () => {
    const result = EpisodeSchema.safeParse({ ...validEpisode, relatedSkills: 'backend' });
    expect(result.success).toBe(false);
  });

  it('tags が文字列配列でないとき失敗する', () => {
    const result = EpisodeSchema.safeParse({ ...validEpisode, tags: [1, 2] });
    expect(result.success).toBe(false);
  });

  it('必須フィールドが欠けているとき失敗する', () => {
    const { title: _, ...withoutTitle } = validEpisode;
    const result = EpisodeSchema.safeParse(withoutTitle);
    expect(result.success).toBe(false);
  });
});

describe('EpisodeDraftSchema', () => {
  it('title だけで通過する', () => {
    const result = EpisodeDraftSchema.safeParse({ title: '新しいエピソード' });
    expect(result.success).toBe(true);
  });

  it('title が空文字のとき失敗する', () => {
    const result = EpisodeDraftSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('title がないとき失敗する', () => {
    const result = EpisodeDraftSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('他フィールドは省略可能', () => {
    const result = EpisodeDraftSchema.safeParse({
      title: 'テスト',
      background: '背景説明',
      tags: ['backend'],
    });
    expect(result.success).toBe(true);
  });
});
