import { getDashboard } from '@/lib/analytics'
import {
  getAllSubstances,
  getSubstanceStats,
  getCategoryStats,
  getSubstanceCombos,
} from '@/lib/data'
import { COMBO_LEVEL_REGISTRY, HARM_LEVEL_REGISTRY } from '@/lib/registry'
import harmReductionScores from '@/data/harm-reduction-scores.json'

export async function GET() {
  try {
    const [kvData, stats, categories, combos] = await Promise.all([
      getDashboard(),
      Promise.resolve(getSubstanceStats()),
      Promise.resolve(getCategoryStats()),
      Promise.resolve(getSubstanceCombos()),
    ])

    const allSubstances = await getAllSubstances()
    const total = allSubstances.length

    const harmLevels = Object.fromEntries(
      HARM_LEVEL_REGISTRY.map(r => [r.key, 0])
    )
    for (const s of allSubstances) {
      const hl = s.harmLevel?.toLowerCase()
      if (hl && hl in harmLevels) harmLevels[hl]++
    }

    const comboLevels = Object.fromEntries(
      COMBO_LEVEL_REGISTRY.map(r => [r.key, 0])
    )
    for (const c of combos) {
      const lv = c.level?.toLowerCase()
      if (lv && lv in comboLevels) comboLevels[lv]++
    }

    const withSmiles = allSubstances.filter(s => s.smiles?.trim()).length
    const withPwRoas = allSubstances.filter(s => s.pwRoas?.length).length
    const withSubjEffects = allSubstances.filter(s => s.subjectiveEffects?.whyUsersLikeIt?.summary?.trim()).length
    const withSafety = allSubstances.filter(s => s.safety?.length).length
    const withRisks = allSubstances.filter(s => s.risks?.length).length
    const withBestMix = allSubstances.filter(s => s.bestMix?.trim()).length
    const withNeverMix = allSubstances.filter(s => s.neverMix?.trim()).length

    const scores = Array.isArray(harmReductionScores) ? harmReductionScores : (harmReductionScores as any)?.scores || []
    const qualityLevels: Record<string, number> = {}
    for (const e of scores) {
      const label = (e as any).skullLabel || 'Unknown'
      qualityLevels[label] = (qualityLevels[label] || 0) + 1
    }
    const avgQuality = scores.length
      ? Math.round(scores.reduce((s: number, e: any) => s + (e.overall || 0), 0) / scores.length * 10) / 10
      : 0

    return Response.json({
      ...kvData,
      substanceStats: {
        total,
        avgHarm: Math.round(stats.avgHarm),
        avgAddiction: Math.round(stats.avgAddiction),
        avgOdRisk: Math.round(stats.avgOdRisk),
        avgWithdrawal: Math.round(stats.avgWithdrawal),
        avgInteraction: Math.round(stats.avgInteraction),
        avgDependence: Math.round(stats.avgDependence),
        extremeCount: stats.extremeCount,
        categories: stats.categories,
        comboCount: combos.length,
      },
      categories: categories.map((c: { name: string; color: string; count: number }) => ({
        name: c.name,
        count: c.count,
        color: c.color,
      })),
      harmLevels: Object.entries(harmLevels).map(([name, count]) => {
        const cfg = HARM_LEVEL_REGISTRY.find(r => r.key === name)
        return { name: cfg?.label || name, count, color: cfg?.color || '#888' }
      }),
      comboLevels: Object.entries(comboLevels).map(([name, count]) => {
        const cfg = COMBO_LEVEL_REGISTRY.find(r => r.key === name)
        return { name: cfg?.label || name, count, color: cfg?.color || '#888' }
      }),
      quality: {
        avgOverall: avgQuality,
        levels: Object.entries(qualityLevels).map(([name, count]) => ({ name, count })),
      },
      coverage: {
        smiles: withSmiles,
        pwRoas: withPwRoas,
        subjectiveEffects: withSubjEffects,
        safety: withSafety,
        risks: withRisks,
        bestMix: withBestMix,
        neverMix: withNeverMix,
        total,
      },
    })
  } catch (err) {
    return Response.json({
      queries: [], substances: [], pages: [],
      feedbackUp: [], feedbackDown: [], gaps: [],
      substanceStats: null, categories: [], harmLevels: [],
      comboLevels: [], quality: null, coverage: null,
    })
  }
}
