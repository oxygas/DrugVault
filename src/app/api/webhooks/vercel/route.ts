import { NextRequest } from 'next/server'
import { kv } from '@vercel/kv'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const deployId = body.id || body.deployment?.id || body.payload?.deployment?.id || 'unknown'
    const state = body.state || body.type || body.payload?.type || 'unknown'
    const project = body.project?.name || body.name || body.payload?.project?.name || 'tripgem'
    const url = body.url || body.deployment?.url || body.payload?.deployment?.url || ''
    const region = body.region || body.payload?.region || 'iad1'
    const ts = body.createdAt || body.created || body.timestamp || Date.now()

    const entry = JSON.stringify({
      id: deployId,
      state,
      project,
      url: `https://${url}`,
      region,
      ts,
      time: new Date(ts).toISOString(),
    })

    await kv.hset('tripgem:deployments', { [deployId]: entry })
    await kv.lpush('tripgem:deployments:recent', entry)
    await kv.ltrim('tripgem:deployments:recent', 0, 49)

    await kv.zincrby('tripgem:deployments:count', 1, state)

    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  try {
    let recent: string[] = []
    let stateCounts: string[] = []
    try { recent = await kv.lrange('tripgem:deployments:recent', 0, 19) } catch { recent = [] }
    try { stateCounts = await kv.zrange('tripgem:deployments:count', 0, 49, { rev: true }) as string[] } catch { stateCounts = [] }

    const parsed = recent.map((s: string) => {
      try { return JSON.parse(s) } catch { return null }
    }).filter(Boolean)

    const states: { name: string; count: number }[] = []
    for (let i = 0; i < stateCounts.length; i += 2) {
      states.push({ name: String(stateCounts[i]), count: Number(stateCounts[i + 1]) })
    }

    return Response.json({ recent: parsed, states })
  } catch (err) {
    return Response.json({ ok: false }, { status: 500 })
  }
}
