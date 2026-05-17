import { getAllSubstances, getSubstanceStats, getCategoryStats, getComboMatrix, getSubstanceCombos } from '@/lib/data'
import HomeClient from '@/components/HomeClient'
import { headers } from 'next/headers'

export default async function Home() {
  const substances = getAllSubstances()
  const stats = getSubstanceStats()
  const categories = getCategoryStats()
  const comboMatrix = getComboMatrix()
  const substanceCombos = getSubstanceCombos()

  // Detect mobile subdomain
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const isMobileSubdomain = host.startsWith('m.')

  return (
    <HomeClient
      substances={substances}
      stats={stats}
      categories={categories}
      comboMatrix={comboMatrix}
      substanceCombos={substanceCombos}
      isMobileSubdomain={isMobileSubdomain}
    />
  )
}
