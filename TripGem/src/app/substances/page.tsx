import { Metadata } from 'next'
import { getSubstanceStats, getCategoryStats, getComboMatrix, getAllSubstances } from '@/lib/data'
import HomeClient from '@/components/HomeClient'
import type { Substance } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Substances Directory — TripGem Harm Reduction',
  description: 'Browse and search over 540 substances. Access detailed harm levels, addiction risks, overdose risks, dosage tables, and chemical structures.',
  alternates: {
    canonical: '/substances',
  },
  openGraph: {
    title: 'Substances Directory — TripGem Harm Reduction',
    description: 'Browse and search over 540 substances. Access detailed harm levels, addiction risks, overdose risks, dosage tables, and chemical structures.',
    url: 'https://tripgem.space/substances',
  },
}

const GRID_FIELDS = new Set([
  'name','category','harmScore','harmLevel','aliases',
  'addictionScore','odRisk','withdrawalSeverity',
  'dependenceLiability','interactionDanger','smiles',
  'popularityRank',
])

export default async function SubstancesPage() {
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
      defaultSection="substances"
    />
  )
}
