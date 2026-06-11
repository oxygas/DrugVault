import { getSubstanceStats, getCategoryStats, getComboMatrix, getAllSubstances } from '@/lib/data'
import HomeClient from '@/components/HomeClient'
import type { Substance } from '@/lib/types'

// Fields to inline into the page — only what the substances grid needs immediately.
// subjectiveEffects (~1 MB) is fetched on-demand when a popup opens.
// substanceCombos (~133 KB) is fetched on-demand when Matrix/Tools tabs are selected.
const GRID_FIELDS = new Set([
  'name','category','harmScore','harmLevel','aliases',
  'addictionScore','odRisk','withdrawalSeverity',
  'dependenceLiability','interactionDanger','smiles',
  'popularityRank',
])

export default async function Home() {
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
    />
  )
}
