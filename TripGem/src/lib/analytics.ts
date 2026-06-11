import { kv } from '@vercel/kv'

const PREFIX = 'tripgem:'

const KEYS = {
  queries: `${PREFIX}queries`,
  substances: `${PREFIX}substances`,
  pages: `${PREFIX}pages`,
  feedbackUp: `${PREFIX}feedback:up`,
  feedbackDown: `${PREFIX}feedback:down`,
  gaps: `${PREFIX}gaps`,
} as const

const TRENDING_TTL = 3600
const TRENDING_SLUGS_TTL = 60_000

let cachedTrending: { queries: string[]; substances: string[] } | null = null
let cachedTrendingAt = 0
let cachedTrendingSlugs: Set<string> | null = null
let cachedTrendingSlugsAt = 0

export async function trackQuery(query: string) {
  try {
    await kv.zincrby(KEYS.queries, 1, query.toLowerCase().trim())
  } catch { /* fail silently */ }
}

export async function trackSubstance(slug: string) {
  try {
    await kv.zincrby(KEYS.substances, 1, slug)
  } catch { /* fail silently */ }
}

export async function trackPage(path: string) {
  try {
    await kv.zincrby(KEYS.pages, 1, path)
  } catch { /* fail silently */ }
}

export async function trackFeedback(query: string, positive: boolean) {
  try {
    const key = positive ? KEYS.feedbackUp : KEYS.feedbackDown
    await kv.zincrby(key, 1, query.toLowerCase().trim())
  } catch { /* fail silently */ }
}

export async function trackGap(query: string) {
  try {
    await kv.zincrby(KEYS.gaps, 1, query.toLowerCase().trim())
  } catch { /* fail silently */ }
}

async function zrevrange(key: string, start: number, stop: number): Promise<string[]>
async function zrevrange(key: string, start: number, stop: number, opts: { withScores: true }): Promise<{ score: number; member: string }[]>
async function zrevrange(key: string, start: number, stop: number, opts?: { withScores: boolean }): Promise<string[] | { score: number; member: string }[]> {
  const results = await kv.zrange(key, start, stop, { rev: true, withScores: opts?.withScores })
  if (opts?.withScores) {
    const parsed: { score: number; member: string }[] = []
    for (let i = 0; i < results.length; i += 2) {
      parsed.push({ member: String(results[i]), score: Number(results[i + 1]) })
    }
    return parsed
  }
  return results as string[]
}

export async function getTrendingQueries(limit = 10): Promise<string[]> {
  try {
    return await zrevrange(KEYS.queries, 0, limit - 1)
  } catch { return [] }
}

export async function getTrendingSubstances(limit = 10): Promise<string[]> {
  try {
    return await zrevrange(KEYS.substances, 0, limit - 1)
  } catch { return [] }
}

export async function getCachedTrending() {
  const now = Date.now()
  if (cachedTrending) {
    if (now - cachedTrendingAt >= TRENDING_TTL * 1000) {
      Promise.all([
        getTrendingQueries(10),
        getTrendingSubstances(10),
      ]).then(([queries, substances]) => {
        cachedTrending = { queries, substances }
        cachedTrendingAt = Date.now()
      }).catch(() => {})
    }
    return cachedTrending
  }

  const [queries, substances] = await Promise.all([
    getTrendingQueries(10),
    getTrendingSubstances(10),
  ])
  cachedTrending = { queries, substances }
  cachedTrendingAt = now
  return cachedTrending
}

export async function getDashboard() {
  try {
    const [
      queriesRaw, substancesRaw, pagesRaw,
      feedbackUpRaw, feedbackDownRaw, gapsRaw,
    ] = await Promise.all([
      zrevrange(KEYS.queries, 0, 49, { withScores: true }),
      zrevrange(KEYS.substances, 0, 49, { withScores: true }),
      zrevrange(KEYS.pages, 0, 49, { withScores: true }),
      zrevrange(KEYS.feedbackUp, 0, 49, { withScores: true }),
      zrevrange(KEYS.feedbackDown, 0, 49, { withScores: true }),
      zrevrange(KEYS.gaps, 0, 49, { withScores: true }),
    ])

    const format = (arr: { member: string; score: number }[]) =>
      arr.map(a => ({ name: a.member, count: a.score }))

    return {
      queries: format(queriesRaw),
      substances: format(substancesRaw),
      pages: format(pagesRaw),
      feedbackUp: format(feedbackUpRaw),
      feedbackDown: format(feedbackDownRaw),
      gaps: format(gapsRaw),
    }
  } catch {
    return {
      queries: [], substances: [], pages: [],
      feedbackUp: [], feedbackDown: [], gaps: [],
    }
  }
}

export async function getPopularGaps(limit = 5): Promise<string[]> {
  try {
    return await zrevrange(KEYS.gaps, 0, limit - 1)
  } catch { return [] }
}

export async function getTrendingSlugs(): Promise<Set<string>> {
  const now = Date.now()
  if (cachedTrendingSlugs) {
    if (now - cachedTrendingSlugsAt >= TRENDING_SLUGS_TTL) {
      getTrendingSubstances(20).then(substances => {
        cachedTrendingSlugs = new Set(substances)
        cachedTrendingSlugsAt = Date.now()
      }).catch(() => {})
    }
    return cachedTrendingSlugs
  }

  try {
    const substances = await getTrendingSubstances(20)
    cachedTrendingSlugs = new Set(substances)
    cachedTrendingSlugsAt = now
    return cachedTrendingSlugs
  } catch {
    return new Set()
  }
}
