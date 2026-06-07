import { getSubstanceStats, getCategoryStats, getComboMatrix, getSubstanceCombos } from '@/lib/data'
import HomeClient from '@/components/HomeClient'

export default async function Home() {
  const [stats, categories, comboMatrix, substanceCombos] = await Promise.all([
    getSubstanceStats(),
    getCategoryStats(),
    getComboMatrix(),
    getSubstanceCombos(),
  ])

  return (
    <HomeClient
      stats={stats}
      categories={categories}
      comboMatrix={comboMatrix}
      substanceCombos={substanceCombos}
    />
  )
}
