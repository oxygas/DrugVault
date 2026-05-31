import { getVisitorStats } from '@/lib/geoip'
import { getDashboard } from '@/lib/analytics'

export async function GET() {
  try {
    const [visitors, kvData] = await Promise.all([
      getVisitorStats(),
      getDashboard().catch(() => null),
    ])
    return Response.json({ visitors, analytics: kvData })
  } catch {
    return Response.json({ visitors: {
      totalVisitors: 0, ips: [], countries: [], cities: [],
      devices: [], deviceTypes: [], vpnIps: [], paths: [], recent: [],
    }, analytics: null })
  }
}
