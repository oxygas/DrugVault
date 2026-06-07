'use client'

import type { Substance } from '@/lib/types'

const PREVALENCE_STYLES: Record<string, { bg: string; text: string }> = {
  almost_always: { bg: 'rgba(74,222,128,0.1)', text: '#4ade80' },
  often: { bg: 'rgba(96,165,250,0.1)', text: '#60a5fa' },
  sometimes: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24' },
  rarely: { bg: 'rgba(248,113,113,0.1)', text: '#f87171' },
}

export default function EffectsTabContent({
  substance,
  catColor,
  onOpenFullReport,
}: {
  substance: Substance
  catColor: string
  onOpenFullReport: () => void
}) {
  const effects = substance.subjectiveEffects
  if (!effects) return null

  const positiveEffects = effects.allEffects.filter(e => e.category === 'positive')
  const negativeEffects = effects.allEffects.filter(e => e.category === 'negative')

  return (
    <div className="space-y-5">
      {effects.whyUsersLikeIt?.summary && (
        <div className="info-card" style={{ '--info-c': catColor } as React.CSSProperties}>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2 h-2 rounded-full" style={{ background: catColor, boxShadow: `0 0 6px ${catColor}` }} />
            <h4 className="text-sm font-semibold font-display text-[var(--text2)]">Why Users Like It</h4>
          </div>
          <p className="text-sm text-[var(--text3)] leading-relaxed">{effects.whyUsersLikeIt.summary}</p>
        </div>
      )}

      {positiveEffects.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2.5 font-display text-[var(--text2)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Positive Effects
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {positiveEffects.map((effect, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--border)]"
              >
                <span className="text-xs text-[var(--text2)] font-display leading-tight">{effect.name}</span>
                {effect.prevalence && PREVALENCE_STYLES[effect.prevalence] && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-mono ml-auto flex-shrink-0"
                    style={{
                      background: PREVALENCE_STYLES[effect.prevalence].bg,
                      color: PREVALENCE_STYLES[effect.prevalence].text,
                    }}
                  >
                    {effect.prevalence === 'almost_always' ? '~Always' : effect.prevalence.charAt(0).toUpperCase() + effect.prevalence.slice(1)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {negativeEffects.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2.5 font-display text-[var(--text2)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Negative Effects
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {negativeEffects.map((effect, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/[0.03] border border-red-500/10"
              >
                <span className="text-xs text-[var(--text2)] font-display leading-tight">{effect.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {effects.timeline.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2.5 font-display text-[var(--text2)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Effects Timeline
          </h4>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {effects.timeline.map((phase, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-44 p-3 rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,0.02)]"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: catColor }} />
                  <span className="text-xs font-semibold text-[var(--text2)] font-display">{phase.phase}</span>
                  {phase.timeRange && (
                    <span className="text-[10px] font-mono text-[var(--text4)] ml-auto">{phase.timeRange}min</span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text4)] leading-relaxed line-clamp-2">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--border)]">
        <span className="text-xs text-[var(--text4)] font-mono">
          {effects.allEffects.length} effects documented · {effects.mostLoved.length} most loved · {effects.riskyEffects.length} risky
        </span>
        {(effects.mostLoved.length > 0 || effects.riskyEffects.length > 0) && (
          <button
            onClick={onOpenFullReport}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-125"
            style={{
              background: `${catColor}15`,
              color: catColor,
              border: `1px solid ${catColor}25`,
            }}
          >
            Full Report →
          </button>
        )}
      </div>
    </div>
  )
}
