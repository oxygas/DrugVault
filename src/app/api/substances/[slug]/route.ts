import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { getSubstanceBySlug, getSubstanceByName } from '@/lib/data'

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const name = decodeURIComponent(slug).replace(/-/g, ' ')

    const substance = getSubstanceBySlug(slug) || getSubstanceByName(name)
    if (!substance) {
      return NextResponse.json({ error: 'Substance not found' }, { status: 404 })
    }

    return NextResponse.json(substance, { headers: CACHE_HEADERS })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
