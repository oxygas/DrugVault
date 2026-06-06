import type { Substance, ComboLevel, CategoryMeta } from './types'

const BASE = ''
const DEFAULT_TIMEOUT = 10000

async function fetchWithTimeout(url: string, opts?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)
  try {
    return await fetch(url, { ...opts, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

export interface SubstancesResponse {
  substances: Substance[]
  stats: { total: number; avgHarm: number; avgAddiction: number; extremeCount: number; categories: number }
  categories: CategoryMeta[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export async function fetchSubstances(params?: {
  q?: string
  category?: string
  page?: number
  limit?: number
  fields?: string[]
}): Promise<SubstancesResponse> {
  const sp = new URLSearchParams()
  if (params?.q) sp.set('q', params.q)
  if (params?.category) sp.set('category', params.category)
  if (params?.page) sp.set('page', String(params.page))
  if (params?.limit) sp.set('limit', String(params.limit))
  if (params?.fields?.length) sp.set('fields', params.fields.join(','))
  const res = await fetchWithTimeout(`${BASE}/api/substances?${sp.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch substances')
  return res.json()
}

export async function fetchSubstanceBySlug(slug: string): Promise<Substance> {
  const res = await fetchWithTimeout(`${BASE}/api/substances/${encodeURIComponent(slug)}`)
  if (!res.ok) throw new Error('Substance not found')
  return res.json()
}

export async function fetchComboMatrix(): Promise<{
  matrix: Record<string, ComboLevel>
  categories: CategoryMeta[]
}> {
  const res = await fetchWithTimeout(`${BASE}/api/combo-matrix`)
  if (!res.ok) throw new Error('Failed to fetch combo matrix')
  return res.json()
}

export async function checkInteraction(
  substanceA: string,
  substanceB: string
): Promise<{
  substanceA: Substance
  substanceB: Substance
  level: ComboLevel
  description: string
}> {
  const res = await fetchWithTimeout(`${BASE}/api/interaction-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ substanceA, substanceB }),
  })
  if (!res.ok) throw new Error('Interaction check failed')
  return res.json()
}

export async function searchSubstances(query: string): Promise<{
  results: { name: string; category: string; harmLevel: string; harmScore: number }[]
}> {
  const res = await fetchWithTimeout(`${BASE}/api/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Search failed')
  return res.json()
}
