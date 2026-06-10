'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Substance, SubjectiveEffects, EffectEntry, TimelinePhase } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/types'

type EffectTab = 'all' | 'loved' | 'risky' | 'timeline'

interface SubjectiveEffectsModalProps {
  substance: Substance
  isOpen: boolean
  onClose: () => void
}

export default function SubjectiveEffectsModal({ substance, isOpen, onClose }: SubjectiveEffectsModalProps) {
  const [activeTab, setActiveTab] = useState<EffectTab>('all')
  const overlayRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const catColor = CATEGORY_COLORS[substance.category]

  useEffect(() => {
    if (!isOpen) {
      const timeout = setTimeout(() => setVisible(false), 300)
      
      return () => clearTimeout(timeout)
    }
    requestAnimationFrame(() => setVisible(true))
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight

    document.body.style.overflow = 'hidden'
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight
    }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) {
      document.addEventListener('keydown', handler)
      return () => document.removeEventListener('keydown', handler)
    }
  }, [isOpen, onClose])

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }, [onClose])

  const effects = substance.subjectiveEffects
  if (!effects) return null

  const tabs: { key: EffectTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All Effects', count: effects.allEffects.length },
    { key: 'loved', label: 'Most Loved', count: effects.mostLoved.length },
    { key: 'risky', label: 'Risky / Unpleasant', count: effects.riskyEffects.length },
    { key: 'timeline', label: 'Timeline', count: effects.timeline.length },
  ]

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[200] flex items-end sm:items-center justify-center transition-all duration-300 ${
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      style={{ background: visible ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0)' }}
      onClick={handleOverlayClick}
      onTouchStart={e => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`${substance.name} subjective effects`}
    >
      <div
        ref={innerRef}
        className={`glass-strong w-full max-h-[92vh] sm:max-h-[88vh] sm:rounded-2xl rounded-t-3xl overflow-hidden flex flex-col transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
        style={{ maxWidth: 'min(900px, 100vw)' }}
      >
        <ModalHeader substance={substance} catColor={catColor} onClose={onClose} />

        <div className="flex gap-1 px-4 sm:px-6 py-3 border-b border-[var(--border)] overflow-x-auto flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-btn flex-shrink-0 flex items-center gap-1.5 ${activeTab === tab.key ? 'active' : ''}`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.08)] font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {activeTab === 'all' && <AllEffectsTab effects={effects.allEffects} catColor={catColor} />}
            {activeTab === 'loved' && <MostLovedTab effects={effects} catColor={catColor} />}
            {activeTab === 'risky' && <RiskyTab effects={effects} catColor={catColor} />}
            {activeTab === 'timeline' && <TimelineTab effects={effects} catColor={catColor} />}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-[var(--border)] flex-shrink-0">
          <p className="text-[11px] text-[var(--text4)] font-mono text-center">
            Data from {effects.source || 'PsychonautWiki'} · Harm reduction first · Stay safe
          </p>
        </div>
      </div>
    </div>
  )
}

function ModalHeader({ substance, catColor, onClose }: { substance: Substance; catColor: string; onClose: () => void }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-start justify-between gap-3 flex-shrink-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: catColor, boxShadow: `0 0 8px ${catColor}` }} />
          <span className="text-[11px] sm:text-xs text-[var(--text4)] font-display uppercase tracking-widest">{substance.category}</span>
        </div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-white truncate">
          {substance.name} · Effects
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text3)] mt-0.5">
          Subjective experience breakdown
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[var(--text4)] hover:text-white flex-shrink-0"
        aria-label="Close modal"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

const PREVALENCE_LABELS: Record<string, { label: string; color: string }> = {
  almost_always: { label: '~Always', color: '#4ade80' },
  often: { label: 'Often', color: '#60a5fa' },
  sometimes: { label: 'Sometimes', color: '#fbbf24' },
  rarely: { label: 'Rarely', color: '#f87171' },
}

function AllEffectsTab({ effects, catColor }: { effects: EffectEntry[]; catColor: string }) {
  const [filter, setFilter] = useState<string>('all')

  const categories = ['all', 'positive', 'neutral', 'negative']
  const filtered = filter === 'all' ? effects : effects.filter(e => e.category === filter)

  const categoryColors: Record<string, string> = {
    positive: '#4ade80',
    neutral: '#60a5fa',
    negative: '#f87171',
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-display capitalize transition-all ${
              filter === cat
                ? 'bg-[var(--accent2)] text-white'
                : 'bg-[rgba(255,255,255,0.04)] text-[var(--text3)] hover:text-white border border-[var(--border)]'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[var(--text4)] text-sm">No effects data available for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map((effect, i) => (
            <div
              key={`${effect.name}-${i}`}
              className="info-card flex items-start gap-2.5"
              style={{ '--info-c': categoryColors[effect.category] || catColor } as React.CSSProperties}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-[var(--text2)] font-display leading-tight">{effect.name}</span>
                  {effect.prevalence && PREVALENCE_LABELS[effect.prevalence] && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-mono flex-shrink-0"
                      style={{
                        background: `${PREVALENCE_LABELS[effect.prevalence].color}15`,
                        color: PREVALENCE_LABELS[effect.prevalence].color,
                      }}
                    >
                      {PREVALENCE_LABELS[effect.prevalence].label}
                    </span>
                  )}
                </div>
                {effect.notes && (
                  <p className="text-xs text-[var(--text4)] mt-1 leading-relaxed">{effect.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MostLovedTab({ effects, catColor }: { effects: SubjectiveEffects; catColor: string }) {
  return (
    <div className="space-y-6">
      {effects.whyUsersLikeIt?.summary && (
        <div
          className="info-card"
          style={{ '--info-c': catColor } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--pink)]" />
            <h3 className="text-sm font-semibold font-display text-[var(--text2)]">Why Users Like It</h3>
          </div>
          <p className="text-sm sm:text-[15px] text-[var(--text3)] leading-relaxed">
            {`${effects.whyUsersLikeIt.summary}`}
          </p>
        </div>
      )}

      {effects.mostLoved.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 font-display text-[var(--text2)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Top Effects People Chase
          </h4>
          <div className="flex flex-wrap gap-2">
            {effects.mostLoved.map((effect, i) => (
              <span
                key={i}
                className="text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono hover:bg-emerald-500/20 transition-colors"
              >
                {effect}
              </span>
            ))}
          </div>
        </div>
      )}

      {effects.whyUsersLikeIt?.reasons?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 font-display text-[var(--text2)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            What Makes It Special
          </h4>
          <div className="space-y-2.5">
            {effects.whyUsersLikeIt.reasons.map((reason, i) => (
              <div key={i} className="info-card" style={{ '--info-c': catColor } as React.CSSProperties}>
                <div className="flex items-start gap-3">
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold font-mono uppercase tracking-wider flex-shrink-0 mt-0.5"
                    style={{
                      background: `${catColor}15`,
                      color: catColor,
                      border: `1px solid ${catColor}25`,
                    }}
                  >
                    {reason.category}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text3)] leading-relaxed">{reason.description}</p>
                    {reason.sourcePattern && (
                      <p className="text-[11px] text-[var(--text4)] mt-1.5 font-mono italic">
                        → {reason.sourcePattern}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {effects.whyUsersLikeIt?.useCases?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 font-display text-[var(--text2)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Real-World Use Cases
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {effects.whyUsersLikeIt.useCases.map((uc, i) => (
              <div key={i} className="info-card" style={{ '--info-c': '#8b5cf6' } as React.CSSProperties}>
                <h5 className="text-sm font-semibold text-[var(--text2)] mb-1.5 font-display">{uc.context}</h5>
                <p className="text-xs text-[var(--text3)] leading-relaxed">{uc.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {effects.whyUsersLikeIt?.streetQuotes?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 font-display text-[var(--text2)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Sourced User Patterns
          </h4>
          <div className="space-y-2">
            {effects.whyUsersLikeIt.streetQuotes.map((quote, i) => (
              <div key={i} className="rounded-lg border border-[var(--border)] p-3 sm:p-4 bg-[rgba(255,255,255,0.02)]">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text3)' }}
                  >
                    {quote.source}
                  </span>
                </div>
                <p className="text-sm text-[var(--text3)] italic leading-relaxed">&#8220;{quote.text}&#8221;</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {effects.mostLoved.length === 0 && !effects.whyUsersLikeIt?.summary && (
        <div className="text-center py-12">
          <p className="text-[var(--text4)] text-sm">Detailed user experience data coming soon.</p>
        </div>
      )}
    </div>
  )
}

function RiskyTab({ effects, catColor }: { effects: SubjectiveEffects; catColor: string }) {
  return (
    <div className="space-y-4">
      {effects.riskyEffects.length > 0 ? (
        <>
          <div
            className="info-card"
            style={{ '--info-c': '#f87171' } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h3 className="text-sm font-semibold font-display text-red-400">Risky / Unpleasant Effects</h3>
            </div>
            <p className="text-xs text-[var(--text4)] leading-relaxed mb-4">
              These effects range from uncomfortable to genuinely dangerous. Know what you&apos;re walking into.
            </p>
            <div className="flex flex-wrap gap-2">
              {effects.riskyEffects.map((effect, i) => (
                <span
                  key={i}
                  className="text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 font-mono"
                >
                  {effect}
                </span>
              ))}
            </div>
          </div>

          <div
            className="info-card"
            style={{ '--info-c': 'var(--green)' } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <h4 className="text-sm font-semibold font-display text-green-400">Staying Safe</h4>
            </div>
            <ul className="space-y-1.5">
              {[
                'Start low, go slow — especially with unknown purity',
                'Stay hydrated but don\'t overhydrate',
                'Know the signs of overdose vs. a challenging experience',
                'Never use alone if you can help it',
                'Have a sober person around who knows what you took',
              ].map((tip, i) => (
                <li key={i} className="text-sm text-[var(--text3)] flex gap-2">
                  <span className="text-[var(--text4)] mt-0.5 flex-shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-[var(--text4)] text-sm">No risky effects data available.</p>
        </div>
      )}
    </div>
  )
}

function TimelineTab({ effects, catColor }: { effects: SubjectiveEffects; catColor: string }) {
  if (effects.timeline.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text4)] text-sm">No timeline data available for this substance.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="info-card" style={{ '--info-c': catColor } as React.CSSProperties}>
        <h3 className="text-sm font-semibold mb-4 font-display text-[var(--text2)]">Effects Timeline</h3>
        <div className="relative">
          <div
            className="absolute left-3 top-0 bottom-0 w-px rounded-full"
            style={{ background: `linear-gradient(to bottom, ${catColor}30, ${catColor}60, ${catColor}30)` }}
          />
          <div className="space-y-4 pl-8">
            {effects.timeline.map((phase, i) => (
              <TimelinePhaseItem key={i} phase={phase} catColor={catColor} isLast={i === effects.timeline.length - 1} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total', value: '4–6h' },
          { label: 'Onset', value: '30–60min' },
          { label: 'Peak', value: '1.5–3h' },
          { label: 'After', value: '1–3 days' },
        ].map((item, i) => (
          <div key={i} className="info-card text-center" style={{ '--info-c': catColor } as React.CSSProperties}>
            <p className="text-[10px] text-[var(--text4)] font-mono uppercase tracking-wider mb-1">{item.label}</p>
            <p className="text-sm sm:text-base font-semibold text-[var(--text2)] font-mono">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelinePhaseItem({ phase, catColor, isLast }: { phase: TimelinePhase; catColor: string; isLast: boolean }) {
  return (
    <div className="relative">
      <div
        className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-[var(--bg)]"
        style={{ background: catColor, boxShadow: `0 0 8px ${catColor}` }}
      />
      {!isLast && (
        <div
          className="absolute -left-[11px] top-4 w-px"
          style={{ height: 'calc(100% + 16px)', background: 'var(--border)' }}
        />
      )}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-[var(--text2)] font-display">{phase.phase}</h4>
            {phase.timeRange && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] text-[var(--text4)]">
                {phase.timeRange}min
              </span>
            )}
          </div>
          {phase.description && (
            <p className="text-xs text-[var(--text3)] mt-1 leading-relaxed">{phase.description}</p>
          )}
          {phase.effects.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {phase.effects.map((e, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.04)] text-[var(--text4)] font-mono border border-[var(--border)]">
                  {e}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}