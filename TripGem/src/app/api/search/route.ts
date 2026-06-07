import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { searchSubstances } from '@/lib/data'

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    if (q.length < 2) {
      return NextResponse.json({ results: [] }, { headers: CACHE_HEADERS })
    }
    const results = (await searchSubstances(q)).slice(0, 20).map(s => ({
      name: s.name,
      category: s.category,
      harmLevel: s.harmLevel,
      harmScore: s.harmScore,
    }))
    return NextResponse.json({ results }, { headers: CACHE_HEADERS })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
