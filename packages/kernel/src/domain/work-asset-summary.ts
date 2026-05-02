import type { ISO8601, ULID } from './episode.js';

export type AssetType =
  | 'proposal'
  | 'source-code'
  | 'slide'
  | 'minutes'
  | 'weekly-report'
  | 'comparison-table'
  | 'document'
  | 'other';

export type WorkAssetSummary = {
  id: ULID;
  title: string;
  assetType: AssetType;
  jobContext: string | null;
  period: string | null;
  role: string | null;
  summary: string | null;
  strengthEpisode: string | null;
  talkingPoints: string | null;
  maskingNote: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
