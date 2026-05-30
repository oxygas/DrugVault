import rawData from '@/data/all-data.json'
import rawEffects from '@/data/subjective-effects.json'
import mdmaEffectsJson from '@/data/mdma-effects.json'
import type { Substance, Category, ComboRule, ComboLevel, HarmLevel, CategoryMeta, SubstanceCombo, Roa, RoaDose, RoaDuration, SubjectiveEffects, ScoreFactor, ScoreBreakdown } from '@/lib/types'
import { CATEGORY_REGISTRY, COMBO_LEVEL_REGISTRY } from '@/lib/registry'
import { CATEGORY_COLORS, COMBO_DESCRIPTIONS } from '@/lib/types'

interface RawScoreFactor { l: string; e: string; su?: string }
interface RawScoreBreakdown { factors: RawScoreFactor[]; su?: string }

// Compact key types matching all-data.json
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

const data = rawData as RawData

// Expand compact JSON to full types
function expandSubstance(r: RawSubstance): Substance {
  function mapFactor(f: RawScoreFactor): ScoreFactor {
    return { label: f.l, explanation: f.e, sourceUrl: f.su }
  }
  function mapBreakdown(b?: RawScoreBreakdown): ScoreBreakdown | undefined {
    if (!b) return undefined
    return { factors: b.factors.map(mapFactor), sourceUrl: b.su }
  }
  return {
    name: r.n, aliases: r.a,
    brandNames: r.bn || [],
    streetNames: r.st || [],
    category: r.c as Category,
    harmLevel: r.hl as HarmLevel, harmScore: r.hs, addictionScore: r.as,
    onset: r.o, duration: r.d, odRisk: r.od,
    withdrawalSeverity: r.ws, interactionDanger: Math.min(r.id, 100), dependenceLiability: r.dl,
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
    } : undefined
  }
}

const mdmaEffectsData = mdmaEffectsJson as SubjectiveEffects
const effectsData = rawEffects as Record<string, unknown>
const substances: Substance[] = data.s.map(s => {
  const sub = expandSubstance(s)
  const nameKey = s.n.toLowerCase()

  if (nameKey === 'mdma') {
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
const comboRules: ComboRule[] = data.m.map(r => ({ categoryA: r.a as Category, categoryB: r.b as Category, level: r.l as ComboLevel }))
const substanceCombos: SubstanceCombo[] = data.c.map(c => ({ substanceA: c.a, substanceB: c.b, level: c.l as ComboLevel, note: c.n }))

const byName = new Map<string, Substance>()
const bySlug = new Map<string, Substance>()
const byCategory = new Map<string, Substance[]>()
const substanceComboMap = new Map<string, SubstanceCombo>()

let searchIndex: Map<string, Set<Substance>> | null = null

function buildIndices() {
  if (byName.size > 0) return

  for (const s of substances) {
    byName.set(s.name.toLowerCase(), s)
    bySlug.set(slugify(s.name), s)

    let catList = byCategory.get(s.category)
    if (!catList) {
      catList = []
      byCategory.set(s.category, catList)
    }
    catList.push(s)
  }
}

function buildSearchIndex() {
  if (searchIndex) return
  searchIndex = new Map()

  const trigrams = new Map<string, Set<Substance>>()

  for (const s of substances) {
    const tokens = [
      s.name,
      ...s.aliases,
      ...s.brandNames,
      ...s.streetNames,
      s.category,
    ].map(t => t.toLowerCase())

    for (const token of tokens) {
      for (let i = 0; i <= token.length - 2; i++) {
        const bigram = token.slice(i, i + 2)
        let set = trigrams.get(bigram)
        if (!set) {
          set = new Set()
          trigrams.set(bigram, set)
        }
        set.add(s)
      }
    }
  }

  searchIndex = trigrams
}

buildIndices()

;(function buildSubstanceComboIndex() {
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
})()

export function getAllSubstances(): Substance[] {
  return substances
}

export function getSubstanceByName(name: string): Substance | undefined {
  return byName.get(name.toLowerCase())
}

export function getSubstanceBySlug(slug: string): Substance | undefined {
  return bySlug.get(slug)
}

export function getSubstancesByCategory(category: Category): Substance[] {
  return byCategory.get(category) ?? []
}

export function searchSubstances(query: string, limit = 20): Substance[] {
  const q = query.toLowerCase().trim()
  if (!q) return substances.slice(0, limit)

  if (q.length < 2) {
    const results: Substance[] = []
    for (const s of substances) {
      if (s.name.toLowerCase().startsWith(q) || s.aliases.some(a => a.toLowerCase().startsWith(q))) {
        results.push(s)
        if (results.length >= limit) break
      }
    }
    return results
  }

  buildSearchIndex()
  if (!searchIndex) return substances.slice(0, limit)

  const scores = new Map<Substance, number>()

  const tokens = q.split(/\s+/)
  for (const token of tokens) {
    const visited = new Set<Substance>()
    for (let i = 0; i <= token.length - 2; i++) {
      const bigram = token.slice(i, i + 2)
      const matches = searchIndex.get(bigram)
      if (matches) {
        for (const s of matches) {
          if (!visited.has(s)) {
            visited.add(s)
            scores.set(s, (scores.get(s) ?? 0) + 1)
          }
        }
      }
    }
  }

  const exactMatch = byName.get(q)
  if (exactMatch) {
    scores.set(exactMatch, (scores.get(exactMatch) ?? 0) + 1000)
  }

  for (const s of substances) {
    if (s.name.toLowerCase().startsWith(q)) {
      scores.set(s, (scores.get(s) ?? 0) + 500)
    }
  }

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([s]) => s)
}

export function getCategoryStats(): CategoryMeta[] {
  return CATEGORY_REGISTRY.map(cat => ({
    name: cat.name as Category,
    color: cat.color,
    count: byCategory.get(cat.name)?.length ?? 0,
  }))
}

let comboMatrixCache: Record<string, ComboLevel> | null = null

export function getComboMatrix(): Record<string, ComboLevel> {
  if (comboMatrixCache) return comboMatrixCache
  const matrix: Record<string, ComboLevel> = {}
  for (const rule of comboRules) {
    matrix[`${rule.categoryA}+${rule.categoryB}`] = rule.level
  }
  comboMatrixCache = matrix
  return matrix
}

export function getSubstanceCombos() {
  return substanceCombos
}

export function getComboLevel(catA: Category, catB: Category): ComboLevel {
  const key1 = `${catA}+${catB}`
  const key2 = `${catB}+${catA}`
  for (const rule of comboRules) {
    const k = `${rule.categoryA}+${rule.categoryB}`
    if (k === key1 || k === key2) return rule.level
  }
  return 'caution'
}

export function checkInteraction(
  nameA: string,
  nameB: string
): { substanceA: Substance; substanceB: Substance; level: ComboLevel; description: string; note?: string | null } | null {
  const a = getSubstanceByName(nameA)
  const b = getSubstanceByName(nameB)
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
    level = getComboLevel(a.category, b.category)
    description = COMBO_DESCRIPTIONS[level] ?? 'Unknown interaction level.'
  }

  return { substanceA: a, substanceB: b, level, description, note }
}

let statsCache: {
  total: number;
  avgHarm: number;
  avgAddiction: number;
  avgOdRisk: number;
  avgWithdrawal: number;
  avgInteraction: number;
  avgDependence: number;
  extremeCount: number;
  categories: number;
} | null = null

export function getSubstanceStats() {
  if (statsCache) return statsCache
  const total = substances.length
  let harm = 0, addiction = 0, odRisk = 0, withdrawal = 0, interaction = 0, dependence = 0, extreme = 0
  for (const s of substances) {
    harm += s.harmScore
    addiction += s.addictionScore
    odRisk += s.odRisk
    withdrawal += s.withdrawalSeverity
    interaction += s.interactionDanger
    dependence += s.dependenceLiability
    if (s.harmLevel === 'extreme') extreme++
  }
  statsCache = {
    total,
    avgHarm: Math.round(harm / total),
    avgAddiction: Math.round(addiction / total),
    avgOdRisk: Math.round(odRisk / total),
    avgWithdrawal: Math.round(withdrawal / total),
    avgInteraction: Math.round(interaction / total),
    avgDependence: Math.round(dependence / total),
    extremeCount: extreme,
    categories: byCategory.size,
  }
  return statsCache
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
