import { z } from 'zod';

export const ResultTypeSchema = z.enum(['revenue', 'cost', 'both']);

export const SkillTypeSchema = z.enum(['outcome', 'cause']);

export const ResultEntrySchema = z.object({
  id: z.string().min(1),
  resultType: ResultTypeSchema,
  situation: z.string(),
  action: z.string(),
  result: z.string(),
  quantification: z.string().min(1).nullable(),
  skillType: SkillTypeSchema,
  note: z.string().min(1).nullable(),
});

export type ResultEntryInput = z.infer<typeof ResultEntrySchema>;

export const ResultByTypeSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  entries: z.array(ResultEntrySchema),
  memo: z.string(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type ResultByTypeInput = z.infer<typeof ResultByTypeSchema>;

export const ResultByTypeCreateSchema = ResultByTypeSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type ResultByTypeCreate = z.infer<typeof ResultByTypeCreateSchema>;

export const ResultByTypeUpdateSchema = ResultByTypeSchema.pick({
  title: true,
  entries: true,
  memo: true,
}).partial();

export type ResultByTypeUpdate = z.infer<typeof ResultByTypeUpdateSchema>;
