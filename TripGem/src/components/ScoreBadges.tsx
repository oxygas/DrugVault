'use client'

import { useUIStore, type ScoreKey } from '@/stores/ui'
import type { Substance } from '@/lib/types'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface ScoreBadgesProps {
  substance: Substance
  className?: string
}

const SCORE_DETAILS: Record<ScoreKey, { label: string; desc: string }> = {
  harmScore: {
    label: 'Harm',
    desc: 'Measures physical, acute, and chronic damage to organs and overall health.'
  },
  addictionScore: {
    label: 'Addict',
    desc: 'Measures psychological reinforcement, cravings, and compulsive redosing.'
  },
  odRisk: {
    label: 'OD Risk',
    desc: 'Measures the danger of life-threatening toxicity or overdose from high doses.'
  },
  withdrawalSeverity: {
    label: 'Withdrawal',
    desc: 'Measures the severity and physical danger of discontinuation symptoms.'
  },
  interactionDanger: {
    label: 'Interaction',
    desc: 'Measures the risk of dangerous synergistic reactions when combined with other categories.'
  },
  dependenceLiability: {
    label: 'Dependence',
    desc: 'Measures how quickly the body develops tolerance and physical dependence.'
  }
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
        const details = SCORE_DETAILS[key]
        return (
          <Tooltip key={key}>
            <TooltipTrigger
              render={
                <button
                  onClick={() => openScoreBreakdown(substance.name, key)}
                  className="group relative flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-semibold transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, color-mix(in srgb, ${color} 15%, transparent), color-mix(in srgb, ${color} 5%, transparent))`,
                    color: color,
                    border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                    boxShadow: `0 0 10px color-mix(in srgb, ${color} 10%, transparent), inset 0 0 8px color-mix(in srgb, ${color} 10%, transparent)`,
                  }}
                />
              }
            >
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
              
              <span className="opacity-80 group-hover:opacity-100 transition-opacity tracking-tight">{label}:</span>
              <span className="font-bold drop-shadow-sm" style={{ color: '#fff' }}>{val}</span>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="pointer-events-none px-3 py-2 text-[11px] sm:text-xs max-w-xs border font-sans"
              style={{
                background: 'rgba(12, 6, 26, 0.95)',
                color: '#fff',
                boxShadow: `0 4px 20px rgba(0, 0, 0, 0.5), 0 0 10px ${color}20`,
                borderColor: `${color}30`
              }}
            >
              <div className="space-y-1">
                <div className="font-semibold" style={{ color }}>{details.label} Rating</div>
                <div className="text-[var(--text3)] leading-normal">{details.desc}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
