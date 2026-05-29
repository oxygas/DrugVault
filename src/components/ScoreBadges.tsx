'use client'

import { useUIStore, type ScoreKey } from '@/stores/ui'
import type { Substance } from '@/lib/types'

interface ScoreBadgesProps {
  substance: Substance
  className?: string
}

const SCORES: { key: ScoreKey; label: string }[] = [
  { key: 'harmScore', label: 'Harm' },
  { key: 'addictionScore', label: 'Addict' },
  { key: 'odRisk', label: 'OD Risk' },
  { key: 'withdrawalSeverity', label: 'Withdrawal' },
  { key: 'interactionDanger', label: 'Interaction' },
  { key: 'dependenceLiability', label: 'Dependence' },
]

function getSeverityColor(score: number): string {
  if (score <= 30) return 'var(--green)'
  if (score <= 60) return 'var(--yellow)'
  return 'var(--red)'
}

export default function ScoreBadges({ substance, className = '' }: ScoreBadgesProps) {
  const openScoreBreakdown = useUIStore(s => s.openScoreBreakdown)

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {SCORES.map(({ key, label }) => {
        const val = substance[key] as number
        if (typeof val !== 'number') return null
        const color = getSeverityColor(val)
        return (
          <button
            key={key}
            onClick={() => openScoreBreakdown(substance.name, key)}
            className="group relative flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-semibold transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, color-mix(in srgb, ${color} 15%, transparent), color-mix(in srgb, ${color} 5%, transparent))`,
              color: color,
              border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
              boxShadow: `0 0 10px color-mix(in srgb, ${color} 10%, transparent), inset 0 0 8px color-mix(in srgb, ${color} 10%, transparent)`,
            }}
            title={`View ${label} breakdown`}
          >
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
            
            <span className="opacity-80 group-hover:opacity-100 transition-opacity tracking-tight">{label}:</span>
            <span className="font-bold drop-shadow-sm" style={{ color: '#fff' }}>{val}</span>
          </button>
        )
      })}
    </div>
  )
}
