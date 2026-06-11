import { checkKvHealth } from '@/lib/geoip'

export async function GET() {
  const health = await checkKvHealth()
  return Response.json(health, { status: health.ok ? 200 : 503 })
}
