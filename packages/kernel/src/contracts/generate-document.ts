import { z } from 'zod';

export const GenerateDocumentInputSchema = z.object({
  systemPrompt: z.string().min(1),
  userPrompt: z.string().min(1),
});

export type GenerateDocumentInput = z.infer<typeof GenerateDocumentInputSchema>;

export const DocumentSectionSchema = z.object({
  heading: z.string().min(1),
  body: z.string().min(1),
  evidenceIds: z.array(z.string()),
});

export const GenerateDocumentOutputSchema = z.object({
  sections: z.array(DocumentSectionSchema),
  summary: z.string(),
});

export type GenerateDocumentOutput = z.infer<typeof GenerateDocumentOutputSchema>;
export type DocumentSection = z.infer<typeof DocumentSectionSchema>;
