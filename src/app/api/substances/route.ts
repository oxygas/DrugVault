import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { getAllSubstances, searchSubstances, getSubstanceStats, getCategoryStats } from '@/lib/data'

const CACHE_MAX_AGE = 300
const CACHE_HEADERS = {
  'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=600`,
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '200', 10)))
    const fields = searchParams.get('fields')?.split(',').filter(Boolean) || null

    let results = q ? searchSubstances(q) : getAllSubstances()

    if (category) {
      results = results.filter(s => s.category === category)
    }

    const total = results.length
    const offset = (page - 1) * limit
    const paged = results.slice(offset, offset + limit)

    const substances = fields
      ? paged.map(s => {
          const picked: Record<string, unknown> = {}
          for (const f of fields) {
            if (f in s) picked[f] = (s as unknown as Record<string, unknown>)[f]
          }
          return picked
        })
      : paged

    return NextResponse.json(
      {
        substances,
        stats: getSubstanceStats(),
        categories: getCategoryStats(),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      { headers: CACHE_HEADERS }
    )
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
