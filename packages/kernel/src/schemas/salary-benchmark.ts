import { z } from 'zod';

export const SalaryBenchmarkSchema = z.object({
  id: z.string().min(1),
  jobTargetId: z.string().min(1),
  averageSalaryAtCompany: z.number().int().nonnegative().nullable(),
  expectedSalaryRangeMin: z.number().int().nonnegative().nullable(),
  expectedSalaryRangeMax: z.number().int().nonnegative().nullable(),
  personalSalaryBenchmark: z.number().int().nonnegative().nullable(),
  isMismatchedCompany: z.boolean(),
  dataSource: z.string().nullable(),
  note: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type SalaryBenchmarkInput = z.infer<typeof SalaryBenchmarkSchema>;

export const SalaryBenchmarkCreateSchema = SalaryBenchmarkSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type SalaryBenchmarkCreate = z.infer<typeof SalaryBenchmarkCreateSchema>;

export const SalaryBenchmarkUpdateSchema = SalaryBenchmarkSchema.pick({
  averageSalaryAtCompany: true,
  expectedSalaryRangeMin: true,
  expectedSalaryRangeMax: true,
  personalSalaryBenchmark: true,
  isMismatchedCompany: true,
  dataSource: true,
  note: true,
}).partial();

export type SalaryBenchmarkUpdate = z.infer<typeof SalaryBenchmarkUpdateSchema>;
