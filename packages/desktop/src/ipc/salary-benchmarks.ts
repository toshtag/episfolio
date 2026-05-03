import type { SalaryBenchmark, SalaryBenchmarkUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type RawRow = {
  id: string;
  jobTargetId: string;
  averageSalaryAtCompany: number | null;
  expectedSalaryRangeMin: number | null;
  expectedSalaryRangeMax: number | null;
  personalSalaryBenchmark: number | null;
  isMismatchedCompany: boolean;
  dataSource: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

function rowToRecord(row: RawRow): SalaryBenchmark {
  return { ...row };
}

type CreateArgs = {
  jobTargetId: string;
  averageSalaryAtCompany?: number | null;
  expectedSalaryRangeMin?: number | null;
  expectedSalaryRangeMax?: number | null;
  personalSalaryBenchmark?: number | null;
  isMismatchedCompany?: boolean;
  dataSource?: string | null;
  note?: string | null;
};

export async function createSalaryBenchmark(args: CreateArgs): Promise<SalaryBenchmark> {
  const row = await invoke<RawRow>('create_salary_benchmark', { args });
  return rowToRecord(row);
}

export async function listSalaryBenchmarksByJobTarget(
  jobTargetId: string,
): Promise<SalaryBenchmark[]> {
  const rows = await invoke<RawRow[]>('list_salary_benchmarks_by_job_target', { jobTargetId });
  return rows.map(rowToRecord);
}

export async function getSalaryBenchmark(id: string): Promise<SalaryBenchmark | null> {
  const row = await invoke<RawRow | null>('get_salary_benchmark', { id });
  return row ? rowToRecord(row) : null;
}

export async function updateSalaryBenchmark(
  id: string,
  patch: SalaryBenchmarkUpdate,
): Promise<SalaryBenchmark> {
  const row = await invoke<RawRow>('update_salary_benchmark', { id, patch });
  return rowToRecord(row);
}

export async function deleteSalaryBenchmark(id: string): Promise<void> {
  return invoke<void>('delete_salary_benchmark', { id });
}
