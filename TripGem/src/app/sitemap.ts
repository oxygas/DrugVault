import { getAllSubstances } from '@/lib/data'
import { slugify } from '@/lib/slugify'

export const dynamic = 'force-static'

export default async function sitemap() {
  const substances = await getAllSubstances()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tripgem.vercel.app'

  const substanceUrls = substances.map(s => ({
    url: `${baseUrl}/substances/${slugify(s.name)}`,
    lastModified: new Date().toISOString().split('T')[0],
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString().split('T')[0],
      priority: 1.0,
    },
    ...substanceUrls,
  ]
}
