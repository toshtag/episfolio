import { z } from 'zod';

export const MicrochopTaskSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  transferable: z.boolean(),
});

export const MicrochopSkillSchema = z.object({
  id: z.string().min(1),
  jobTitle: z.string(),
  industry: z.string(),
  tasks: z.array(MicrochopTaskSchema),
  transferableSkills: z.string(),
  note: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type MicrochopSkillInput = z.infer<typeof MicrochopSkillSchema>;

export const MicrochopSkillCreateSchema = MicrochopSkillSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type MicrochopSkillCreate = z.infer<typeof MicrochopSkillCreateSchema>;

export const MicrochopSkillUpdateSchema = MicrochopSkillSchema.pick({
  jobTitle: true,
  industry: true,
  tasks: true,
  transferableSkills: true,
  note: true,
}).partial();

export type MicrochopSkillUpdate = z.infer<typeof MicrochopSkillUpdateSchema>;
