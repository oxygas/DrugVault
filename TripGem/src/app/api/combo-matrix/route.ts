import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { getComboMatrix, getCategoryStats } from '@/lib/data'

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
}

export async function GET() {
  try {
    return NextResponse.json(
      { matrix: await getComboMatrix(), categories: await getCategoryStats() },
      { headers: CACHE_HEADERS }
    )
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
