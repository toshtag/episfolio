import type { ISO8601, ULID } from './episode.js';

export type SalaryBenchmark = {
  id: ULID;
  jobTargetId: ULID;
  averageSalaryAtCompany: number | null;
  expectedSalaryRangeMin: number | null;
  expectedSalaryRangeMax: number | null;
  personalSalaryBenchmark: number | null;
  isMismatchedCompany: boolean;
  dataSource: string | null;
  note: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
