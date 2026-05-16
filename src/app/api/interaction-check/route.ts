import { NextResponse } from 'next/server'
import { checkInteraction } from '@/lib/data'

export async function POST(request: Request) {
  const { substanceA, substanceB } = await request.json()
  if (!substanceA || !substanceB) {
    return NextResponse.json({ error: 'Both substance names required' }, { status: 400 })
  }
  const result = checkInteraction(substanceA, substanceB)
  if (!result) {
    return NextResponse.json({ error: 'One or both substances not found' }, { status: 404 })
  }
  return NextResponse.json(result)
}
