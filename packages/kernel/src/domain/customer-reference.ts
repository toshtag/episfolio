import type { ISO8601, ULID } from './episode.js';

export type CustomerType = 'b2b' | 'b2c';

export type CustomerReference = {
  id: ULID;
  customerType: CustomerType;
  customerLabel: string | null;
  companyName: string;
  period: string;
  industry: string | null;
  companyScale: string | null;
  counterpartRole: string | null;
  typicalRequests: string | null;
  ageRange: string | null;
  familyStatus: string | null;
  residence: string | null;
  incomeRange: string | null;
  hardestExperience: string | null;
  claimContent: string | null;
  responseTime: string | null;
  strengthEpisode: string | null;
  indirectRoleIdea: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
