import { getAllSubstances } from '@/lib/data'
import { slugify } from '@/lib/slugify'

export const dynamic = 'force-static'

export default async function sitemap() {
  const substances = await getAllSubstances()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tripgem.space'

  const substanceUrls = substances.map(s => ({
    url: `${baseUrl}/substances/${slugify(s.name)}`,
    lastModified: new Date().toISOString().split('T')[0],
    priority: 0.8,
  }))

  const staticPages = [
    { url: `${baseUrl}/substances`, priority: 0.9 },
    { url: `${baseUrl}/interactions`, priority: 0.9 },
    { url: `${baseUrl}/about`, priority: 0.5 },
    { url: `${baseUrl}/privacy`, priority: 0.3 },
    { url: `${baseUrl}/disclaimer`, priority: 0.3 },
  ].map(p => ({
    url: p.url,
    lastModified: new Date().toISOString().split('T')[0],
    priority: p.priority,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString().split('T')[0],
      priority: 1.0,
    },
    ...staticPages,
    ...substanceUrls,
  ]
}
