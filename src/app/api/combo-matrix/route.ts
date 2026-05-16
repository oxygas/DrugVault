import { NextResponse } from 'next/server'
import { getComboMatrix, getCategoryStats } from '@/lib/data'

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
}

export async function GET() {
  return NextResponse.json(
    { matrix: getComboMatrix(), categories: getCategoryStats() },
    { headers: CACHE_HEADERS }
  )
}
