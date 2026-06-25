import { Metadata } from 'next'
import { getSubstanceStats, getCategoryStats, getComboMatrix, getAllSubstances } from '@/lib/data'
import HomeClient from '@/components/HomeClient'
import type { Substance } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export const metadata: Metadata = {
  title: 'Drug Interaction Checker & Combination Matrix — TripGem',
  description: 'Check pairwise drug interactions and category combination risk guidelines. Select any two substances to see detailed safety levels and educational guides.',
  alternates: {
    canonical: '/interactions',
  },
  openGraph: {
    title: 'Drug Interaction Checker & Combination Matrix — TripGem',
    description: 'Check pairwise drug interactions and category combination risk guidelines. Select any two substances to see detailed safety levels and educational guides.',
    url: 'https://tripgem.space/interactions',
  },
}

const GRID_FIELDS = new Set([
  'name','category','harmScore','harmLevel','aliases',
  'addictionScore','odRisk','withdrawalSeverity',
  'dependenceLiability','interactionDanger','smiles',
  'popularityRank',
])

export default async function InteractionsPage({ searchParams }: PageProps) {
  const { tab } = await searchParams
  const defaultSection = tab === 'matrix' ? 'matrix' : 'tools'

  const [stats, categories, comboMatrix, allSubstances] = await Promise.all([
    getSubstanceStats(),
    getCategoryStats(),
    getComboMatrix(),
    getAllSubstances(),
  ])

  // Trim each substance to only the grid fields — reduces inline JSON by ~85%
  const initialSubstances = allSubstances.map(s => {
    const out: Record<string, unknown> = {}
    for (const k of GRID_FIELDS) {
      if (k in s) out[k] = (s as unknown as Record<string, unknown>)[k]
    }
    return out as unknown as Substance
  }).sort((a, b) => ((a as unknown as Record<string, number>).popularityRank ?? 999) - ((b as unknown as Record<string, number>).popularityRank ?? 999))

  return (
    <HomeClient
      stats={stats}
      categories={categories}
      comboMatrix={comboMatrix}
      initialSubstances={initialSubstances}
      showHero={false}
      defaultSection={defaultSection}
    />
  )
}
