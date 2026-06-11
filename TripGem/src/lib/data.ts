import type { Substance, Category, ComboRule, ComboLevel, HarmLevel, CategoryMeta, SubstanceCombo, Roa, RoaDose, RoaDuration, SubjectiveEffects, ScoreFactor, ScoreBreakdown } from '@/lib/types'
import { CATEGORY_REGISTRY } from '@/lib/registry'
import { CATEGORY_COLORS, COMBO_DESCRIPTIONS } from '@/lib/types'
import fuzzysort from 'fuzzysort'
import { slugify } from '@/lib/slugify'

interface RawScoreFactor { l: string; e: string; su?: string }
interface RawScoreBreakdown { factors: RawScoreFactor[]; su?: string }

interface RawSubstance {
  n: string; a: string[]; bn: string[]; st: string[]; c: string; hl: string; hs: number; as: number
  o: string; d: string; od: number; ws: number; id: number; dl: number
  r: string[]; od2: string[]; s: string[]; i: string[]
  w?: string[]; rc?: string[]; sm: string; bm?: string; nm?: string
  pw: string | null; pr: RawRoa[] | null; ld?: string
  sb?: { hs?: RawScoreBreakdown; as?: RawScoreBreakdown; od?: RawScoreBreakdown; ws?: RawScoreBreakdown; id?: RawScoreBreakdown; dl?: RawScoreBreakdown }
}
interface RawRoa { n: string; d: RawDose | null; dur: RawDur | null }
interface RawDose { t: number | string; l: string; c: string; s: string; h: string | number; u: string }
interface RawDur { o: string; p: string; t: string }
interface RawCombo { a: string; b: string; l: string; n: string | null }
interface RawComboRule { a: string; b: string; l: string }

interface RawData { s: RawSubstance[]; c: RawCombo[]; m: RawComboRule[] }

let initPromise: Promise<void> | null = null
let substances: Substance[] = []
let comboRules: ComboRule[] = []
let substanceCombos: SubstanceCombo[] = []
const byName = new Map<string, Substance>()
const bySlugMap = new Map<string, Substance>()
const byCategory = new Map<string, Substance[]>()
const substanceComboMap = new Map<string, SubstanceCombo>()
type StatsResult = {
  total: number;
  categories: number;
  extremeCount: number;
  highHarmCount: number;
  highAddictionCount: number;
  highOdRiskCount: number;
  totalCombos: number;
  dangerousCombos: number;
  safeCombos: number;
}
let statsCache: StatsResult | null = null
let comboMatrixCache: Record<string, ComboLevel> | null = null

function expandSubstance(r: RawSubstance): Substance {
  function mapFactor(f: RawScoreFactor): ScoreFactor {
    return { label: f.l, explanation: f.e, sourceUrl: f.su }
  }
  function mapBreakdown(b?: RawScoreBreakdown): ScoreBreakdown | undefined {
    if (!b) return undefined
    return { factors: (b.factors || []).map(mapFactor), sourceUrl: b.su }
  }
  return {
    name: r.n, aliases: r.a,
    brandNames: r.bn || [],
    streetNames: r.st || [],
    category: r.c as Category,
    harmLevel: r.hl as HarmLevel, harmScore: r.hs, addictionScore: r.as,
    onset: r.o, duration: r.d, odRisk: r.od,
    withdrawalSeverity: r.ws, interactionDanger: Math.max(0, Math.min(r.id, 100)), dependenceLiability: r.dl,
    risks: r.r, overdose: r.od2, safety: r.s, interactions: r.i,
    withdrawal: r.w && r.w.length ? r.w : undefined,
    recovery: r.rc && r.rc.length ? r.rc : undefined,
    smiles: r.sm, chemicalStructure: null, ld50: r.ld || undefined,
    bestMix: r.bm || undefined, neverMix: r.nm || undefined,
    pwSummary: r.pw, pwRoas: r.pr ? r.pr.map((p: RawRoa) => ({
      n: p.n,
      d: p.d ? { t: p.d.t, l: p.d.l, c: p.d.c, s: p.d.s, h: p.d.h, u: p.d.u } as RoaDose : null,
      dur: p.dur ? { o: p.dur.o, p: p.dur.p, t: p.dur.t } as RoaDuration : null
    })) : null,
    scoreBreakdowns: r.sb ? {
      harmScore: mapBreakdown(r.sb.hs) ?? { factors: [] },
      addictionScore: mapBreakdown(r.sb.as) ?? { factors: [] },
      odRisk: mapBreakdown(r.sb.od) ?? { factors: [] },
      withdrawalSeverity: mapBreakdown(r.sb.ws) ?? { factors: [] },
      interactionDanger: mapBreakdown(r.sb.id) ?? { factors: [] },
      dependenceLiability: mapBreakdown(r.sb.dl) ?? { factors: [] },
    } : undefined,
    popularityRank: 999
  }
}

const POPULARITY_OVERRIDES: Record<string, number> = {
  'caffeine': 1,
  'alcohol': 2,
  'nicotine': 3,
  'cannabis': 4,
  'cocaine': 5,
  'mdma': 6,
  'amphetamine': 7,
  'methamphetamine': 8,
  'heroin': 9,
  'lsd': 10,
  'psilocybin': 11,
  'ketamine': 12,
  'xanax': 13,
  'valium': 14,
  'dxm': 15,
  'fentanyl': 16,
  'oxycodone': 17,
  'codeine': 18,
  'morphine': 19,
  'nitrous oxide': 20,
  'dmt': 21,
  'kratom': 22,
  'methylphenidate': 23,
  'gabapentin': 24,
  'pregabalin': 25,
  'tramadol': 26,
  'hydrocodone': 27,
  'modafinil': 28,
  'salvia': 29,
  'ghb': 30,
  'mescaline': 31,
  '2c-b': 32,
  'phenibut': 33,
  'kava': 34,
}

function calculatePopularityScore(sub: Substance): number {
  let score = 0

  // 1. Category prevalence weighting
  const cat = sub.category
  if (['Cannabinoids', 'Stimulants', 'Depressants', 'Psychedelics', 'Entactogens', 'Opioids', 'Dissociatives'].includes(cat)) {
    score += 150
  } else if (['Gabapentionoids', 'Nootropics', 'Supplements', 'Antidepressants', 'Cathinones'].includes(cat)) {
    score += 80
  } else {
    score += 20
  }

  // 2. Subjective effects presence (strong indicator of community documentation & usage)
  if (sub.subjectiveEffects && sub.subjectiveEffects.allEffects && sub.subjectiveEffects.allEffects.length > 0) {
    score += 250
  }

  // 3. Safety/addiction score breakdowns (detailed profiles)
  if (sub.scoreBreakdowns) {
    let breakdownCount = 0
    if (sub.scoreBreakdowns.harmScore?.factors?.length) breakdownCount++
    if (sub.scoreBreakdowns.addictionScore?.factors?.length) breakdownCount++
    if (sub.scoreBreakdowns.odRisk?.factors?.length) breakdownCount++
    if (sub.scoreBreakdowns.withdrawalSeverity?.factors?.length) breakdownCount++
    score += breakdownCount * 35 // max 140
  }

  // 4. Aliases, street, and brand names (indicates real-world usage and prescriptions)
  score += Math.min(100, (sub.aliases?.length || 0) * 20)
  score += Math.min(120, (sub.streetNames?.length || 0) * 30)
  score += Math.min(120, (sub.brandNames?.length || 0) * 30)

  // 5. Detailed safety parameters
  score += Math.min(50, (sub.risks?.length || 0) * 10)
  score += Math.min(50, (sub.safety?.length || 0) * 10)
  score += Math.min(50, (sub.interactions?.length || 0) * 5)

  // 6. Presence of smiles string
  if (sub.smiles && sub.smiles.length > 3) {
    score += 20
  }

  return score
}

function assignPopularityRanks(subs: Substance[]) {
  // Sort substances by calculated score descending
  const scored = subs.map(s => ({
    substance: s,
    score: calculatePopularityScore(s)
  })).sort((a, b) => b.score - a.score)

  const totalOverrides = Object.keys(POPULARITY_OVERRIDES).length
  let dynamicRank = totalOverrides + 1

  for (const entry of scored) {
    const nameKey = entry.substance.name.toLowerCase()
    if (POPULARITY_OVERRIDES[nameKey] !== undefined) {
      entry.substance.popularityRank = POPULARITY_OVERRIDES[nameKey]
    } else {
      entry.substance.popularityRank = dynamicRank
      dynamicRank++
    }
  }
}

async function ensureData() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    const [
      { default: rawData },
      { default: rawEffects },
      { default: mdmaEffectsJson },
    ] = await Promise.all([
      import('@/data/all-data.json') as Promise<{ default: RawData }>,
      import('@/data/subjective-effects.json') as Promise<{ default: Record<string, unknown> }>,
      import('@/data/mdma-effects.json') as Promise<{ default: SubjectiveEffects }>,
    ])

    const data = rawData as RawData
    const mdmaEffectsData = mdmaEffectsJson as SubjectiveEffects
    const effectsData = rawEffects as Record<string, unknown>

    substances = data.s.map(s => {
      const sub = expandSubstance(s)
      const nameKey = s.n.toLowerCase()

      if (nameKey === 'mdma' && mdmaEffectsData) {
        sub.subjectiveEffects = mdmaEffectsData
      } else if (effectsData[nameKey]) {
        const raw = effectsData[nameKey] as { positives?: string[]; negatives?: string[]; why?: string }
        if (raw.positives || raw.negatives || raw.why) {
          sub.subjectiveEffects = {
            allEffects: [
              ...(raw.positives || []).map((name: string) => ({ name, category: 'positive' })),
              ...(raw.negatives || []).map((name: string) => ({ name, category: 'negative' })),
            ],
            mostLoved: raw.positives || [],
            riskyEffects: raw.negatives || [],
            timeline: [],
            whyUsersLikeIt: { summary: raw.why || '', reasons: [], useCases: [], streetQuotes: [] },
            source: 'PsychonautWiki',
          }
        }
      }
      return sub
    })

    assignPopularityRanks(substances)

    comboRules = data.m.map(r => ({ categoryA: r.a as Category, categoryB: r.b as Category, level: r.l as ComboLevel }))
    substanceCombos = data.c.map(c => ({ substanceA: c.a, substanceB: c.b, level: c.l as ComboLevel, note: c.n }))

    for (const s of substances) {
      byName.set(s.name.toLowerCase(), s)
      bySlugMap.set(slugify(s.name), s)
      let catList = byCategory.get(s.category)
      if (!catList) { catList = []; byCategory.set(s.category, catList) }
      catList.push(s)
    }

    const aliasMap = new Map<string, string>()
    for (const s of substances) {
      const key = s.name.toLowerCase()
      aliasMap.set(key, key)
      for (const a of s.aliases) {
        aliasMap.set(a.toLowerCase(), key)
      }
    }
    for (const c of substanceCombos) {
      const aResolved = aliasMap.get(c.substanceA.toLowerCase()) ?? c.substanceA.toLowerCase()
      const bResolved = aliasMap.get(c.substanceB.toLowerCase()) ?? c.substanceB.toLowerCase()
      substanceComboMap.set(`${aResolved}+${bResolved}`, c)
      substanceComboMap.set(`${bResolved}+${aResolved}`, c)
    }

    statsCache = null
    comboMatrixCache = null
  })()
  return initPromise
}

export async function getAllSubstances(): Promise<Substance[]> {
  await ensureData()
  return substances
}

export async function getSubstanceByName(name: string): Promise<Substance | undefined> {
  await ensureData()
  return byName.get(name.toLowerCase())
}

export async function getSubstanceBySlug(slug: string): Promise<Substance | undefined> {
  await ensureData()
  return bySlugMap.get(slug)
}

export async function getSubstancesByCategory(category: Category): Promise<Substance[]> {
  await ensureData()
  return byCategory.get(category) ?? []
}

export async function getCategoryStats(): Promise<CategoryMeta[]> {
  await ensureData()
  return CATEGORY_REGISTRY.map(cat => ({
    name: cat.name as Category,
    color: cat.color,
    count: byCategory.get(cat.name)?.length ?? 0,
  }))
}

export async function getComboMatrix(): Promise<Record<string, ComboLevel>> {
  await ensureData()
  if (comboMatrixCache) return comboMatrixCache
  const matrix: Record<string, ComboLevel> = {}
  for (const rule of comboRules) {
    matrix[`${rule.categoryA}+${rule.categoryB}`] = rule.level
  }
  comboMatrixCache = matrix
  return matrix
}

export async function getSubstanceCombos(): Promise<SubstanceCombo[]> {
  await ensureData()
  return substanceCombos
}

export async function getComboLevel(catA: Category, catB: Category): Promise<ComboLevel> {
  await ensureData()
  const key1 = `${catA}+${catB}`
  const key2 = `${catB}+${catA}`
  for (const rule of comboRules) {
    const k = `${rule.categoryA}+${rule.categoryB}`
    if (k === key1 || k === key2) return rule.level
  }
  return 'caution'
}

export async function checkInteraction(
  nameA: string,
  nameB: string
): Promise<{ substanceA: Substance; substanceB: Substance; level: ComboLevel; description: string; note?: string | null } | null> {
  const [a, b] = await Promise.all([getSubstanceByName(nameA), getSubstanceByName(nameB)])
  if (!a || !b) return null

  const aLow = a.name.toLowerCase()
  const bLow = b.name.toLowerCase()

  const subCombo = substanceComboMap.get(`${aLow}+${bLow}`) ?? substanceComboMap.get(`${bLow}+${aLow}`)

  let level: ComboLevel
  let description: string
  let note: string | null | undefined

  if (subCombo) {
    level = subCombo.level
    description = subCombo.note ?? COMBO_DESCRIPTIONS[level] ?? 'Unknown interaction level.'
    note = subCombo.note
  } else {
    level = await getComboLevel(a.category, b.category)
    description = COMBO_DESCRIPTIONS[level] ?? 'Unknown interaction level.'
  }

  return { substanceA: a, substanceB: b, level, description, note }
}

export async function getSubstanceStats(): Promise<StatsResult> {
  await ensureData()
  if (statsCache) return statsCache
  const total = substances.length
  let extreme = 0, highHarm = 0, highAddiction = 0, highOdRisk = 0
  for (const s of substances) {
    if (s.harmLevel === 'extreme') extreme++
    if (s.harmScore >= 75) highHarm++
    if (s.addictionScore >= 75) highAddiction++
    if (s.odRisk >= 75) highOdRisk++
  }
  
  const totalCombos = substanceCombos.length
  const dangerousCombos = substanceCombos.filter(c => c.level === 'dangerous' || c.level === 'deadly').length
  const safeCombos = substanceCombos.filter(c => c.level === 'safe' || c.level === 'low_risk').length

  statsCache = {
    total,
    categories: byCategory.size,
    extremeCount: extreme,
    highHarmCount: highHarm,
    highAddictionCount: highAddiction,
    highOdRiskCount: highOdRisk,
    totalCombos,
    dangerousCombos,
    safeCombos
  }
  return statsCache
}

let preparedSubstances: (Substance & { aliasesStr: string; categoryStr: string })[] | null = null

export async function searchSubstances(query: string, limit = 20): Promise<Substance[]> {
  await ensureData()
  if (!preparedSubstances) {
    preparedSubstances = substances.map(s => ({
      ...s,
      aliasesStr: [...(s.aliases || []), ...(s.streetNames || []), ...(s.brandNames || [])].join(' '),
      categoryStr: s.category.toLowerCase()
    }))
  }

  const q = query.toLowerCase().trim()
  if (!q) return substances.slice(0, limit)

  const results = fuzzysort.go(q, preparedSubstances, {
    keys: ['name', 'aliasesStr', 'categoryStr'],
    limit,
    scoreFn: (a) => Math.max(
      a[0] ? a[0].score : 0,
      a[1] ? a[1].score * 0.9 : 0,
      a[2] ? a[2].score * 0.5 : 0
    )
  })

  return results.map(r => r.obj)
}
