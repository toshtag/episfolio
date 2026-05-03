import { z } from 'zod';

export const WeakConnectionCategorySchema = z.enum([
  'student_days',
  'family_network',
  'business_card',
  'hobby',
  'sns',
]);

export const ContactStatusSchema = z.enum([
  'not_contacted',
  'contacted',
  'replied',
]);

export const WeakConnectionSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  category: WeakConnectionCategorySchema,
  relation: z.string(),
  contactStatus: ContactStatusSchema,
  prospectNote: z.string(),
  note: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type WeakConnectionInput = z.infer<typeof WeakConnectionSchema>;

export const WeakConnectionCreateSchema = WeakConnectionSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type WeakConnectionCreate = z.infer<typeof WeakConnectionCreateSchema>;

export const WeakConnectionUpdateSchema = WeakConnectionSchema.pick({
  name: true,
  category: true,
  relation: true,
  contactStatus: true,
  prospectNote: true,
  note: true,
}).partial();

export type WeakConnectionUpdate = z.infer<typeof WeakConnectionUpdateSchema>;
