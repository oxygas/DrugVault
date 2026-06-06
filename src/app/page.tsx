import { getAllSubstances, getSubstanceStats, getCategoryStats, getComboMatrix, getSubstanceCombos } from '@/lib/data'
import type { Substance } from '@/lib/types'
import HomeClient from '@/components/HomeClient'

export default async function Home() {
  const substances = getAllSubstances()
  const stats = getSubstanceStats()
  const categories = getCategoryStats()
  const comboMatrix = getComboMatrix()
  const substanceCombos = getSubstanceCombos()

  // Pre-sort by popularity score on the server to preserve exact order, then map to lightweight objects
  const sortedSubstances = [...substances].sort((a, b) => {
    const aScore = 
      (a.pwSummary?.length || 0) + 
      (a.pwRoas?.length || 0) * 10 + 
      (a.risks?.length || 0) * 5 + 
      (a.safety?.length || 0) * 3 +
      a.harmScore * 2;
    
    const bScore = 
      (b.pwSummary?.length || 0) + 
      (b.pwRoas?.length || 0) * 10 + 
      (b.risks?.length || 0) * 5 + 
      (b.safety?.length || 0) * 3 +
      b.harmScore * 2;
    
    if (bScore !== aScore) return bScore - aScore;
    return a.name.localeCompare(b.name);
  });

  const liteSubstances = sortedSubstances.map((s, index) => ({
    name: s.name,
    category: s.category,
    harmScore: s.harmScore,
    harmLevel: s.harmLevel,
    onset: s.onset,
    duration: s.duration,
    aliases: s.aliases,
    addictionScore: s.addictionScore,
    odRisk: s.odRisk,
    withdrawalSeverity: s.withdrawalSeverity,
    dependenceLiability: s.dependenceLiability,
    interactionDanger: s.interactionDanger,
    smiles: s.smiles,
    subjectiveEffects: s.subjectiveEffects ? {
      allEffects: s.subjectiveEffects.allEffects ? s.subjectiveEffects.allEffects.slice(0, 3) : [],
      mostLoved: s.subjectiveEffects.mostLoved ? s.subjectiveEffects.mostLoved.slice(0, 3) : [],
    } : undefined,
    popularityRank: index,
  }))

  return (
    <HomeClient
      substances={liteSubstances as unknown as Substance[]}
      stats={stats}
      categories={categories}
      comboMatrix={comboMatrix}
      substanceCombos={substanceCombos}
    />
  )
}
