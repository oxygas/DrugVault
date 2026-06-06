import { getTrendingQueries, getTrendingSubstances } from '@/lib/analytics'

export async function GET() {
  try {
    const [queries, substances] = await Promise.all([
      getTrendingQueries(10),
      getTrendingSubstances(10),
    ])
    return Response.json({ queries, substances })
  } catch {
    return Response.json({ queries: [], substances: [] })
  }
}
