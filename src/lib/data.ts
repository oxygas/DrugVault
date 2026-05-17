import { substances } from '@/data/substances'
import { comboRules } from '@/data/comboMatrix'
import { substanceCombos } from '@/data/substanceCombos'
import type { Substance, Category, ComboRule, ComboLevel, CategoryMeta, SubstanceCombo } from '@/lib/types'
import { CATEGORY_REGISTRY, COMBO_LEVEL_REGISTRY } from '@/lib/registry'
import { CATEGORIES, CATEGORY_COLORS, COMBO_DESCRIPTIONS } from '@/lib/types'

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

export function searchSubstances(query: string): Substance[] {
  const q = query.toLowerCase().trim()
  if (!q) return substances

  if (q.length < 2) {
    return substances.filter(s =>
      s.name.toLowerCase().startsWith(q) ||
      s.aliases.some(a => a.toLowerCase().startsWith(q))
    )
  }

  buildSearchIndex()
  if (!searchIndex) return substances

  const scores = new Map<Substance, number>()

  const tokens = q.split(/\s+/)
  for (const token of tokens) {
    for (let i = 0; i <= token.length - 2; i++) {
      const bigram = token.slice(i, i + 2)
      const matches = searchIndex.get(bigram)
      if (matches) {
        for (const s of matches) {
          scores.set(s, (scores.get(s) ?? 0) + 1)
        }
      }
    }
  }

  const exactMatch = byName.get(q)
  if (exactMatch) {
    scores.set(exactMatch, (scores.get(exactMatch) ?? 0) + 1000)
  }

  const nameStartsWith = substances.filter(s => s.name.toLowerCase().startsWith(q))
  for (const s of nameStartsWith) {
    scores.set(s, (scores.get(s) ?? 0) + 500)
  }

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
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

let statsCache: { total: number; avgHarm: number; avgAddiction: number; extremeCount: number; categories: number } | null = null

export function getSubstanceStats() {
  if (statsCache) return statsCache
  const total = substances.length
  const avgHarm = Math.round(substances.reduce((s, d) => s + d.harmScore, 0) / total)
  const avgAddiction = Math.round(substances.reduce((s, d) => s + d.addictionScore, 0) / total)
  const extremeCount = substances.filter(s => s.harmLevel === 'extreme').length
  const categories = byCategory.size
  statsCache = { total, avgHarm, avgAddiction, extremeCount, categories }
  return statsCache
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
