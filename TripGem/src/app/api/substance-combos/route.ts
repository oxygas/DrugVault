import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { getSubstanceCombos } from '@/lib/data'

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
}

export async function GET() {
  try {
    const combos = await getSubstanceCombos()
    return NextResponse.json({ combos }, { headers: CACHE_HEADERS })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
