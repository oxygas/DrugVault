import { getAllSubstances, getSubstanceStats, getCategoryStats, getComboMatrix, getSubstanceCombos } from '@/lib/data'
import HomeClient from '@/components/HomeClient'

export const revalidate = 60

export default async function ComboPage() {
  const [
    substances,
    stats,
    categories,
    comboMatrix,
    substanceCombos,
  ] = await Promise.all([
    getAllSubstances(),
    getSubstanceStats(),
    getCategoryStats(),
    getComboMatrix(),
    getSubstanceCombos(),
  ])

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