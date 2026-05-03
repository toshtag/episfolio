import { z } from 'zod';

export const BlankTypeSchema = z.enum(['leave', 'unemployed', 'early_resign', 'other']);

export const StrengthFromWeaknessSchema = z.object({
  id: z.string().min(1),
  weaknessLabel: z.string(),
  blankType: BlankTypeSchema.nullable(),
  background: z.string(),
  reframe: z.string(),
  targetCompanyProfile: z.string(),
  note: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type StrengthFromWeaknessInput = z.infer<typeof StrengthFromWeaknessSchema>;

export const StrengthFromWeaknessCreateSchema = StrengthFromWeaknessSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type StrengthFromWeaknessCreate = z.infer<typeof StrengthFromWeaknessCreateSchema>;

export const StrengthFromWeaknessUpdateSchema = StrengthFromWeaknessSchema.pick({
  weaknessLabel: true,
  blankType: true,
  background: true,
  reframe: true,
  targetCompanyProfile: true,
  note: true,
}).partial();

export type StrengthFromWeaknessUpdate = z.infer<typeof StrengthFromWeaknessUpdateSchema>;
