import { NextRequest } from 'next/server'
import { trackGap, getTrendingQueries, getTrendingSubstances } from '@/lib/analytics'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { gap } = body as { gap?: string }

    if (gap && typeof gap === 'string' && gap.trim()) {
      await trackGap(gap.trim())
    }

    const [trendingQueries, trendingSubstances] = await Promise.all([
      getTrendingQueries(10),
      getTrendingSubstances(10),
    ])

    return Response.json({
      trending: { queries: trendingQueries, substances: trendingSubstances },
    })
  } catch {
    return Response.json({ trending: { queries: [], substances: [] } })
  }
}
