import type { SalaryBenchmark } from '../domain/salary-benchmark.js';
import type { SalaryBenchmarkUpdate } from '../schemas/salary-benchmark.js';

export interface SalaryBenchmarkStoragePort {
  create(record: SalaryBenchmark): Promise<SalaryBenchmark>;
  listByJobTarget(jobTargetId: string): Promise<SalaryBenchmark[]>;
  get(id: string): Promise<SalaryBenchmark | null>;
  update(id: string, patch: SalaryBenchmarkUpdate): Promise<SalaryBenchmark>;
  delete(id: string): Promise<void>;
}
