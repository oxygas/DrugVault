import { checkKvHealth } from '@/lib/geoip'
import * as Sentry from '@sentry/nextjs'

export async function GET() {
  try {
    const health = await checkKvHealth()
    return Response.json(health, { status: health.ok ? 200 : 503 })
  } catch (err) {
    Sentry.captureException(err)
    return Response.json({ ok: false, error: 'KV health check failed' }, { status: 503 })
  }
}
