import { z } from 'zod';

export const CareerDocumentStatusSchema = z.enum(['draft', 'finalized']);

export const CareerDocumentTypeSchema = z.enum(['free_form', 'jibun_taizen', 'career_digest']);

export const CareerDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  jobTarget: z.string(),
  documentType: CareerDocumentTypeSchema.default('free_form'),
  jobTargetId: z.string().nullable().default(null),
  status: CareerDocumentStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type CareerDocumentInput = z.infer<typeof CareerDocumentSchema>;

export const CareerDocumentUpdateSchema = CareerDocumentSchema.pick({
  title: true,
  jobTarget: true,
  documentType: true,
  jobTargetId: true,
  status: true,
}).partial();

export type CareerDocumentUpdate = z.infer<typeof CareerDocumentUpdateSchema>;

export const DocumentRevisionSchema = z.object({
  id: z.string().min(1),
  documentId: z.string().min(1),
  content: z.string(),
  createdBy: z.literal('human'),
  revisionReason: z.string().min(1),
  targetMemo: z.string(),
  jobTargetId: z.string().nullable().default(null),
  previousRevisionId: z.string().nullable(),
  createdAt: z.string().min(1),
});

export type DocumentRevisionInput = z.infer<typeof DocumentRevisionSchema>;
