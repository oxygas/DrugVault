import { CATEGORY_REGISTRY, COMBO_LEVEL_REGISTRY, HARM_LEVEL_REGISTRY } from './registry'

export type Category = 'Depressants' | 'Stimulants' | 'Opioids' | 'Psychedelics' | 'Dissociatives' | 'Entactogens' | 'Cannabinoids' | 'Inhalants' | 'Deliriants' | 'Gabapentionoids' | 'Nootropics' | 'Antidepressants' | 'Antipsychotics' | 'Dopaminergics' | 'Supplements' | 'Cathinones'

export type HarmLevel = 'low' | 'moderate' | 'high' | 'extreme'

export type ComboLevel = 'safe' | 'low_risk' | 'caution' | 'unsafe' | 'dangerous' | 'deadly'

export interface RoaDose {
  t: number | string
  l: string
  c: string
  s: string
  h: string | number
  u: string
}

export interface RoaDuration {
  o: string
  p: string
  t: string
}

export interface Roa {
  n: string
  d: RoaDose | null
  dur: RoaDuration | null
}

export interface SanityImageAsset {
  url: string
  metadata: {
    dimensions?: {
      width: number
      height: number
    }
  }
}

export interface EffectEntry {
  name: string
  prevalence?: string
  category: string
  notes?: string
}

export interface TimelinePhase {
  phase: string
  timeRange: string
  description: string
  effects: string[]
}

export interface WhyReason {
  category: string
  description: string
  sourcePattern: string
}

export interface UseCase {
  context: string
  description: string
}

export interface StreetQuote {
  source: string
  text: string
}

export interface WhyUsersLikeIt {
  summary: string
  reasons: WhyReason[]
  useCases: UseCase[]
  streetQuotes: StreetQuote[]
}

export interface SubjectiveEffects {
  allEffects: EffectEntry[]
  mostLoved: string[]
  riskyEffects: string[]
  timeline: TimelinePhase[]
  whyUsersLikeIt: WhyUsersLikeIt
  source: string
}

export type UserLevel = 'new' | 'common' | 'heavy'

export interface ScoreFactor {
  label: string
  explanation: string
  sourceUrl?: string
}

export interface ScoreBreakdown {
  factors: ScoreFactor[]
  sourceUrl?: string
}

export interface ScoreBreakdowns {
  harmScore: ScoreBreakdown
  addictionScore: ScoreBreakdown
  odRisk: ScoreBreakdown
  withdrawalSeverity: ScoreBreakdown
  interactionDanger: ScoreBreakdown
  dependenceLiability: ScoreBreakdown
}

export interface Substance {
  name: string
  aliases: string[]
  brandNames: string[]
  streetNames: string[]
  category: Category
  harmLevel: HarmLevel
  harmScore: number
  addictionScore: number
  ld50?: string
  onset: string
  duration: string
  odRisk: number
  withdrawalSeverity: number
  interactionDanger: number
  dependenceLiability: number
  risks: string[]
  overdose: string[]
  safety: string[]
  interactions: string[]
  withdrawal?: string[]
  recovery?: string[]
  smiles: string
  chemicalStructure?: {
    asset?: SanityImageAsset
    alt?: string
  } | null
  bestMix?: string
  neverMix?: string
  pwSummary: string | null
  pwRoas: Roa[] | null
  subjectiveEffects?: SubjectiveEffects
  scoreBreakdowns?: ScoreBreakdowns
  popularityRank: number
}

export interface ComboRule {
  categoryA: Category
  categoryB: Category
  level: ComboLevel
  description?: string
}

export interface SubstanceCombo {
  substanceA: string
  substanceB: string
  level: ComboLevel
  note?: string | null
}

export interface CategoryMeta {
  name: Category
  color: string
  count: number
}

export const CATEGORIES: Category[] = CATEGORY_REGISTRY.map(c => c.name as Category)

export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORY_REGISTRY.map(c => [c.name, c.color])
)

export const LOFI_CATEGORY_COLORS: Record<string, string> = {
  'Depressants': '#6a8aaa',
  'Stimulants': '#c89050',
  'Psychedelics': '#b088b0',
  'Dissociatives': '#58a0a8',
  'Opioids': '#a88050',
  'Entactogens': '#b88090',
  'Cannabinoids': '#60a070',
  'Deliriants': '#805050',
  'Gabapentionoids': '#8090b8',
  'Nootropics': '#60a0b8',
  'Antidepressants': '#7078b0',
  'Antipsychotics': '#6a7a8a',
  'Dopaminergics': '#b8a858',
  'Supplements': '#58a090',
  'Inhalants': '#80a060',
  'Cathinones': '#b86860',
}

export const HARM_LEVEL_COLORS: Record<string, string> = Object.fromEntries(
  HARM_LEVEL_REGISTRY.map(h => [h.key, h.color])
)

export const COMBO_LEVEL_COLORS: Record<string, string> = Object.fromEntries(
  COMBO_LEVEL_REGISTRY.map(c => [c.key, c.color])
)

export const COMBO_LEVEL_ORDER: string[] = COMBO_LEVEL_REGISTRY.map(c => c.key)

export const COMBO_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  COMBO_LEVEL_REGISTRY.map(c => [c.key, c.description])
)

export const COMBO_LEVEL_LABELS: Record<string, string> = Object.fromEntries(
  COMBO_LEVEL_REGISTRY.map(c => [c.key, c.label])
)
