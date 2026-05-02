import { z } from 'zod';

const axisValue = z.number().int().min(1).max(5);

export const BossReferenceAxisValuesSchema = z.object({
  logicVsEmotion: axisValue,
  resultVsProcess: axisValue,
  soloVsTeam: axisValue,
  futureVsTradition: axisValue,
  sharesPrivate: axisValue,
  teachingSkill: axisValue,
  listening: axisValue,
  busyness: axisValue,
});

export const BossReferenceSchema = z.object({
  id: z.string().min(1),
  bossName: z.string().nullable(),
  companyName: z.string().min(1),
  period: z.string().min(1),
  axisValues: BossReferenceAxisValuesSchema,
  q1: z.string().nullable(),
  q2: z.string().nullable(),
  q3: z.string().nullable(),
  q4: z.string().nullable(),
  q5: z.string().nullable(),
  q6: z.string().nullable(),
  q7: z.string().nullable(),
  q8: z.string().nullable(),
  q9: z.string().nullable(),
  q10: z.string().nullable(),
  q11: z.string().nullable(),
  strengthEpisode: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type BossReferenceInput = z.infer<typeof BossReferenceSchema>;

export const BossReferenceUpdateSchema = BossReferenceSchema.pick({
  bossName: true,
  companyName: true,
  period: true,
  axisValues: true,
  q1: true,
  q2: true,
  q3: true,
  q4: true,
  q5: true,
  q6: true,
  q7: true,
  q8: true,
  q9: true,
  q10: true,
  q11: true,
  strengthEpisode: true,
}).partial();

export type BossReferenceUpdate = z.infer<typeof BossReferenceUpdateSchema>;
