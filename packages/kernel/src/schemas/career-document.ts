import { z } from 'zod';

export const CareerDocumentStatusSchema = z.enum(['draft', 'finalized']);

export const CareerDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  jobTarget: z.string(),
  status: CareerDocumentStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type CareerDocumentInput = z.infer<typeof CareerDocumentSchema>;

export const CareerDocumentUpdateSchema = CareerDocumentSchema.pick({
  title: true,
  jobTarget: true,
  status: true,
}).partial();

export type CareerDocumentUpdate = z.infer<typeof CareerDocumentUpdateSchema>;

export const DocumentRevisionSchema = z.object({
  id: z.string().min(1),
  documentId: z.string().min(1),
  content: z.string(),
  sourceEvidenceIds: z.array(z.string()),
  sourceAIRunId: z.string().nullable(),
  createdBy: z.enum(['human', 'ai']),
  revisionReason: z.string().min(1),
  targetMemo: z.string(),
  previousRevisionId: z.string().nullable(),
  createdAt: z.string().min(1),
});

export type DocumentRevisionInput = z.infer<typeof DocumentRevisionSchema>;
