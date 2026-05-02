import type { ISO8601, ULID } from './episode.js';

export type JobWishCompany = {
  id: ULID;
  name: string;
  note: string;
};

export type JobWishSheet = {
  id: ULID;
  agentTrackRecordId: ULID | null;
  title: string;
  desiredIndustry: string;
  desiredRole: string;
  desiredSalary: string;
  desiredLocation: string;
  desiredWorkStyle: string;
  otherConditions: string;
  groupACompanies: JobWishCompany[];
  groupBCompanies: JobWishCompany[];
  groupCCompanies: JobWishCompany[];
  memo: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
