import { z } from 'zod'

export const ScoreFactorSchema = z.object({
  label: z.string(),
  explanation: z.string(),
  sourceUrl: z.string().url().optional(),
})

export const ScoreBreakdownSchema = z.object({
  factors: z.array(ScoreFactorSchema),
  sourceUrl: z.string().url().optional(),
})

export const ScoreBreakdownsSchema = z.object({
  harmScore: ScoreBreakdownSchema,
  addictionScore: ScoreBreakdownSchema,
  odRisk: ScoreBreakdownSchema,
  withdrawalSeverity: ScoreBreakdownSchema,
  interactionDanger: ScoreBreakdownSchema,
  dependenceLiability: ScoreBreakdownSchema,
})

export const ROASchema = z.object({
  name: z.string(),
  bioavail: z.number().min(0).max(100).optional(),
  onset: z.string().optional(),
  duration: z.string().optional(),
  doseMin: z.number().min(0).optional(),
  doseMax: z.number().min(0).optional(),
  doseUnit: z.string().optional(),
  doseNote: z.string().optional(),
})

export const SubstanceSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  category: z.string(),
  summary: z.string().default(''),
  smile: z.string().optional(),
  cas: z.string().optional(),
  pubchemCid: z.number().optional(),
  harmLevel: z.number().min(1).max(10).default(5),
  harmScore: z.number().min(0).max(100).default(50),
  addictionPotential: z.number().min(0).max(100).default(50),
  tolerance: z.string().optional(),
  crossTolerance: z.array(z.string()).default([]),
  halfLife: z.string().optional(),
  duration: z.string().optional(),
  onset: z.string().optional(),
  offset: z.string().optional(),
  roas: z.array(ROASchema).default([]),
  effects: z.object({
    positive: z.array(z.string()).default([]),
    neutral: z.array(z.string()).default([]),
    negative: z.array(z.string()).default([]),
  }).default({ positive: [], neutral: [], negative: [] }),
  risks: z.array(z.string()).default([]),
  safety: z.array(z.string()).default([]),
  interactions: z.object({
    dangerous: z.array(z.string()).default([]),
    caution: z.array(z.string()).default([]),
    safe: z.array(z.string()).default([]),
  }).default({ dangerous: [], caution: [], safe: [] }),
  bestMix: z.array(z.string()).default([]),
  neverMix: z.array(z.string()).default([]),
  legalStatus: z.record(z.string(), z.string()).default({}),
  citations: z.array(z.object({
    text: z.string(),
    url: z.string().url().optional(),
  })).default([]),
  lastUpdated: z.string().optional(),
})

export type Substance = z.infer<typeof SubstanceSchema>
export type ROA = z.infer<typeof ROASchema>

export const ComboLevelEnum = z.enum([
  'safe', 'low_risk', 'caution', 'unsafe', 'dangerous', 'deadly',
])
export type ComboLevel = z.infer<typeof ComboLevelEnum>

export const ComboCheckSchema = z.object({
  substanceA: z.string().min(1),
  substanceB: z.string().min(1),
  level: ComboLevelEnum,
  note: z.string().default(''),
})

export const JournalEntrySchema = z.object({
  substance: z.string().min(1),
  date: z.string(),
  dose: z.string().optional(),
  roa: z.string().optional(),
  setting: z.string().optional(),
  mood: z.number().min(1).max(5).optional(),
  notes: z.string().default(''),
})
