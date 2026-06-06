'use client'

import scoresData from '@/data/harm-reduction-scores.json'
import type { Substance } from '@/lib/types'

interface HarmReductionCardProps {
  substance: Substance
}

interface ScoreEntry {
  assessment: string
}

type ScoresMap = Record<string, ScoreEntry>

const scores = scoresData as ScoresMap

export default function HarmReductionCard({ substance }: HarmReductionCardProps) {
  const entry = scores[substance.name]
  if (!entry) return null

  return (
    <div className="info-card" style={{ '--info-c': '#f43f5e' } as React.CSSProperties}>
      <h4 className="text-sm font-semibold font-display text-[var(--text2)] mb-2">
        Harm Reduction Assessment
      </h4>
      <p className="text-xs sm:text-sm text-[var(--text3)] leading-relaxed">
        {entry.assessment}
      </p>
    </div>
  )
}
