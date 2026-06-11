import { getVisitorStats } from '@/lib/geoip'
import { getDashboard } from '@/lib/analytics'
import * as Sentry from '@sentry/nextjs'

export async function GET() {
  try {
    const [visitors, kvData] = await Promise.all([
      getVisitorStats(),
      getDashboard().catch(() => null),
    ])
    return Response.json({ visitors, analytics: kvData })
  } catch (err) {
    Sentry.captureException(err)
    return Response.json({ visitors: null, analytics: null }, { status: 500 })
  }
}
