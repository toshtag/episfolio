import { z } from 'zod';

export const StrengthArrowTypeSchema = z.enum(['interest', 'evaluation', 'request']);

export const StrengthArrowSchema = z.object({
  id: z.string().min(1),
  type: StrengthArrowTypeSchema,
  description: z.string(),
  source: z.string(),
  occurredAt: z.string().min(1).nullable(),
  relatedEpisodeIds: z.array(z.string().min(1)),
  note: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type StrengthArrowInput = z.infer<typeof StrengthArrowSchema>;

export const StrengthArrowCreateSchema = StrengthArrowSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type StrengthArrowCreate = z.infer<typeof StrengthArrowCreateSchema>;

export const StrengthArrowUpdateSchema = StrengthArrowSchema.pick({
  type: true,
  description: true,
  source: true,
  occurredAt: true,
  relatedEpisodeIds: true,
  note: true,
}).partial();

export type StrengthArrowUpdate = z.infer<typeof StrengthArrowUpdateSchema>;
