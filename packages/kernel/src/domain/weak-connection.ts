import type { ISO8601, ULID } from './episode.js';

export type WeakConnectionCategory =
  | 'student_days'
  | 'family_network'
  | 'business_card'
  | 'hobby'
  | 'sns';

export type ContactStatus = 'not_contacted' | 'contacted' | 'replied';

export type WeakConnection = {
  id: ULID;
  name: string;
  category: WeakConnectionCategory;
  relation: string;
  contactStatus: ContactStatus;
  prospectNote: string;
  note: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
