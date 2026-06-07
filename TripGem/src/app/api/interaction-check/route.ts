import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { checkInteraction } from '@/lib/data'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { substanceA, substanceB } = body
    if (!substanceA || typeof substanceA !== 'string') {
      return NextResponse.json({ error: 'substanceA must be a non-empty string' }, { status: 400 })
    }
    if (!substanceB || typeof substanceB !== 'string') {
      return NextResponse.json({ error: 'substanceB must be a non-empty string' }, { status: 400 })
    }
    const result = await checkInteraction(substanceA, substanceB)
    if (!result) {
      return NextResponse.json({ error: 'One or both substances not found' }, { status: 404 })
    }
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
