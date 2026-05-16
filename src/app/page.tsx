import { getAllSubstances, getSubstanceStats, getCategoryStats, getComboMatrix, getSubstanceCombos } from '@/lib/data'
import HomeClient from '@/components/HomeClient'

export default function Home() {
  const substances = getAllSubstances()
  const stats = getSubstanceStats()
  const categories = getCategoryStats()
  const comboMatrix = getComboMatrix()
  const substanceCombos = getSubstanceCombos()

  return (
    <HomeClient
      substances={substances}
      stats={stats}
      categories={categories}
      comboMatrix={comboMatrix}
      substanceCombos={substanceCombos}
    />
  )
}
