import { NextRequest } from 'next/server'
import { kv } from '@vercel/kv'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const events = Array.isArray(body) ? body : [body]

    for (const event of events) {
      const type = event.type || 'pageview'
      const path = event.path || event.url || '/'
      const ts = event.timestamp || Date.now()
      const ip = event.clientIp || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''

      const pipeline = kv.pipeline()

      if (type === 'pageview') {
        pipeline.zincrby('tripgem:paths', 1, path)
        pipeline.zincrby('tripgem:drain:pageviews', 1, new Date(ts).toISOString().slice(0, 13))
      }

      if (event.referrer) {
        try {
          const domain = new URL(event.referrer).hostname.replace(/^www\./, '')
          pipeline.zincrby('tripgem:referrers', 1, domain)
        } catch { /* skip bad url */ }
      }

      if (event.device?.type) pipeline.zincrby('tripgem:device_types', 1, event.device.type)
      if (event.browser?.name) pipeline.zincrby('tripgem:drain:browsers', 1, `${event.browser.name} ${event.browser.version || ''}`)
      if (event.os?.name) pipeline.zincrby('tripgem:drain:os', 1, `${event.os.name} ${event.os.version || ''}`)
      if (event.session?.id) pipeline.zincrby('tripgem:drain:sessions', 1, event.session.id)
      if (event.country) pipeline.zincrby('tripgem:countries', 1, event.country)

      if (event.deployment?.id) {
        await kv.hset('tripgem:drain:deployments', {
          [event.deployment.id]: JSON.stringify({
            id: event.deployment.id,
            url: event.deployment.url,
            ts: event.deployment.createdAt || ts,
            type: event.deployment.type || 'unknown',
          }),
        })
      }

      if (ip) {
        pipeline.lpush('tripgem:drain:recent', JSON.stringify({ ip, path, ts, type, ...event }))
        pipeline.ltrim('tripgem:drain:recent', 0, 499)
      }

      await pipeline.exec().catch(() => {})
    }

    return Response.json({ ok: true, count: events.length })
  } catch {
    return Response.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  let pageviews: string[] = []
  let browsers: string[] = []
  let os: string[] = []
  let recent: string[] = []
  try { pageviews = await kv.zrange('tripgem:drain:pageviews', 0, 49, { rev: true }) as string[] } catch {}
  try { browsers = await kv.zrange('tripgem:drain:browsers', 0, 19, { rev: true }) as string[] } catch {}
  try { os = await kv.zrange('tripgem:drain:os', 0, 19, { rev: true }) as string[] } catch {}
  try { recent = await kv.lrange('tripgem:drain:recent', 0, 19) as string[] } catch {}

  return Response.json({ pageviews, browsers, os, recent })
}
