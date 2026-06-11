import { getVisitorStats } from '@/lib/geoip'
import { getDashboard } from '@/lib/analytics'

export async function GET() {
  const [visitors, kvData] = await Promise.all([
    getVisitorStats(),
    getDashboard().catch(() => null),
  ])
  return Response.json({ visitors, analytics: kvData })
}
