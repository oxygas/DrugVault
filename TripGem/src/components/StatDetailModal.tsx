'use client'

import { useEffect, useRef, useState } from 'react'
import { Skull } from 'lucide-react'
import type { Substance, ComboLevel, Category } from '@/lib/types'
import { CATEGORY_COLORS, HARM_LEVEL_COLORS, COMBO_LEVEL_COLORS, COMBO_LEVEL_LABELS, COMBO_DESCRIPTIONS } from '@/lib/types'
import { playClose, playClick } from '@/lib/ui-sounds'
import { useDevice } from '@/lib/device'

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Psychedelics: 'Substances that alter perception, cognition, and mood by primarily agonizing serotonin 5-HT2A receptors (e.g., LSD, Psilocybin, DMT).',
  Depressants: 'Central nervous system depressants that slow down brain activity, causing muscle relaxation, sedation, and anxiety relief (e.g., Alcohol, Benzodiazepines).',
  Stimulants: 'Substances that speed up mental and physical processes, increasing alertness, energy, focus, and heart rate (e.g., Cocaine, Amphetamine).',
  Opioids: 'Compounds that bind to opioid receptors in the brain, producing powerful pain relief, sedation, warmth, and euphoria (e.g., Fentanyl, Morphine, Heroin).',
  Entactogens: 'Psychoactive substances that produce distinctive social and emotional effects, increasing feelings of empathy, connection, and openness (e.g., MDMA).',
  Dissociatives: 'Anesthetics that distort sensory perceptions and produce feelings of detachment (dissociation) from the physical body and environment (e.g., Ketamine, PCP).',
  Cannabinoids: 'Compounds that interact with the cannabinoid receptors (CB1 and CB2) of the endocannabinoid system, causing relaxation and altered sensory perception (e.g., Cannabis).',
  Deliriants: 'A subclass of hallucinogens that produce delirium, characterized by extreme confusion, disorientation, and vivid, indistinguishable hallucinations (e.g., Datura, DPH).',
  Gabapentionoids: 'Structural analogues of GABA that act on voltage-gated calcium channels, used to treat neuropathic pain, anxiety, and epilepsy (e.g., Pregabalin, Gabapentin).',
  Nootropics: 'Cognitive enhancers that improve executive functions, memory, creativity, or motivation in healthy individuals (e.g., Modafinil, L-Theanine).',
  Antidepressants: 'Medications used to treat depressive disorders and anxiety by modulating neurotransmitters like serotonin, norepinephrine, and dopamine (e.g., SSRIs).',
  Antipsychotics: 'Medications primarily used to manage psychosis, including schizophrenia and manic episodes, by blocking dopamine D2 receptors (e.g., Quetiapine, Haloperidol).',
  Dopaminergics: 'Substances that directly or indirectly increase dopamine neurotransmission, boosting reward, motivation, and motor control (e.g., L-DOPA).',
  Supplements: 'Health-promoting dietary compounds, vitamins, minerals, or herbal extracts supporting overall physiological well-being (e.g., Magnesium, Ashwagandha).',
  Inhalants: 'Volatile substances that produce chemical vapors that can be inhaled to induce rapid, short-lived psychoactive effects (e.g., Nitrous Oxide).',
  Cathinones: 'Beta-keto amphetamine derivatives that act as potent psychostimulants, releasing dopamine and norepinephrine (e.g., Mephedrone, MDPV).'
}

interface StatDetailModalProps {
  label: string
  substances: Substance[]
  comboMatrix: Record<string, ComboLevel>
  onClose: () => void
  onNavigate: (substance: Substance) => void
}

export default function StatDetailModal({ label, substances, comboMatrix, onClose, onNavigate }: StatDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const { isMobile } = useDevice()

  // Pull-to-dismiss gesture state
  const pullStartYRef = useRef<number | null>(null)
  const [pullOffset, setPullOffset] = useState(0)
  const pullOffsetRef = useRef(0)
  const isPullingRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const [expandedCombo, setExpandedCombo] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playClose()
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const popup = popupRef.current
      if (popup && popup.contains(e.target as Node)) return
      e.preventDefault()
    }
    window.addEventListener('wheel', handleScroll, { passive: false })
    window.addEventListener('touchmove', handleScroll, { passive: false })
    return () => {
      window.removeEventListener('wheel', handleScroll)
      window.removeEventListener('touchmove', handleScroll)
    }
  }, [])

  const handlePullStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    const scrollable = target.closest('.popup-scroll-area') as HTMLElement | null
    if (scrollable && scrollable.scrollTop > 0) return
    pullStartYRef.current = e.touches[0].clientY
    isPullingRef.current = false
    setIsDragging(true)
  }

  const handlePullMove = (e: React.TouchEvent) => {
    if (pullStartYRef.current === null) return
    const diff = e.touches[0].clientY - pullStartYRef.current
    if (diff > 10) {
      const target = e.target as HTMLElement
      const scrollable = target.closest('.popup-scroll-area') as HTMLElement | null
      if (!scrollable || scrollable.scrollTop <= 0) {
        isPullingRef.current = true
        if (e.cancelable) e.preventDefault()
      }
      if (isPullingRef.current) {
        pullOffsetRef.current = diff
        setPullOffset(diff)
      }
    }
  }

  const handlePullEnd = () => {
    if (pullStartYRef.current === null) return
    const offset = pullOffsetRef.current
    pullStartYRef.current = null
    isPullingRef.current = false
    pullOffsetRef.current = 0
    setIsDragging(false)
    if (offset > 100) {
      playClose()
      onClose()
    } else {
      setPullOffset(0)
    }
  }

  let items: React.ReactNode[] = []
  let accentColor = 'var(--accent)'
  const title = label
  let description = ''

  if (label === 'High Harm') {
    accentColor = 'var(--pink)'
    description = 'Substances with a physical harm score of 75 or higher.'
    const highHarm = substances.filter(s => s.harmScore >= 75).sort((a, b) => b.harmScore - a.harmScore)
    items = highHarm.map(s => (
      <button key={s.name} onClick={() => onNavigate(s)} className="w-full text-left p-4 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] transition-all flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="w-2 h-10 rounded-full" style={{ background: CATEGORY_COLORS[s.category] }} />
          <div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-[var(--pink)] transition-colors">{s.name}</h3>
            <p className="text-xs text-[var(--text4)] font-mono">{s.category}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-[var(--pink)]">{s.harmScore}</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text4)]">Harm Score</div>
        </div>
      </button>
    ))
  } else if (label === 'High Addiction') {
    accentColor = 'var(--orange)'
    description = 'Substances with an addiction score of 75 or higher.'
    const highAdd = substances.filter(s => s.addictionScore >= 75).sort((a, b) => b.addictionScore - a.addictionScore)
    items = highAdd.map(s => (
      <button key={s.name} onClick={() => onNavigate(s)} className="w-full text-left p-4 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] transition-all flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="w-2 h-10 rounded-full" style={{ background: CATEGORY_COLORS[s.category] }} />
          <div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-[var(--orange)] transition-colors">{s.name}</h3>
            <p className="text-xs text-[var(--text4)] font-mono">{s.category}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-[var(--orange)]">{s.addictionScore}</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text4)]">Addiction</div>
        </div>
      </button>
    ))
  } else if (label === 'High OD Risk') {
    accentColor = 'var(--accent3)'
    description = 'Substances with extremely high toxicity and overdose risk profiles.'
    const highOd = substances.filter(s => s.odRisk >= 75).sort((a, b) => b.odRisk - a.odRisk)
    items = highOd.map(s => (
      <button key={s.name} onClick={() => onNavigate(s)} className="w-full text-left p-4 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] transition-all flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="w-2 h-10 rounded-full" style={{ background: CATEGORY_COLORS[s.category] }} />
          <div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-[var(--accent3)] transition-colors">{s.name}</h3>
            <p className="text-xs text-[var(--text4)] font-mono">{s.category}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-[var(--accent3)]">{s.odRisk}</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text4)]">OD Risk</div>
        </div>
      </button>
    ))
  } else if (label === 'Extreme Danger') {
    accentColor = 'var(--orange)'
    description = 'Substances explicitly flagged as extreme harm risks.'
    const extreme = substances.filter(s => s.harmLevel === 'extreme').sort((a, b) => b.harmScore - a.harmScore)
    items = extreme.map(s => (
      <button key={s.name} onClick={() => onNavigate(s)} className="w-full text-left p-4 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] transition-all flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="w-2 h-10 rounded-full" style={{ background: CATEGORY_COLORS[s.category] }} />
          <div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-[var(--orange)] transition-colors">{s.name}</h3>
            <p className="text-xs text-[var(--text4)] font-mono">{s.category}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-[var(--orange)]">{s.harmScore}</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text4)]">Harm Score</div>
        </div>
      </button>
    ))
  } else if (label === 'Categories') {
    accentColor = 'var(--cyan)'
    description = 'Distribution of substances across distinct pharmacological classes.'
    const categories: Record<string, number> = {}
    substances.forEach(s => {
      categories[s.category] = (categories[s.category] || 0) + 1
    })
    items = Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
      const catColor = CATEGORY_COLORS[cat as Category] || 'var(--cyan)'
      const isExpanded = expandedCategory === cat
      const desc = CATEGORY_DESCRIPTIONS[cat] || 'No description available.'
      
      const catSubstances = substances
        .filter(s => s.category === cat)
        .sort((a, b) => a.popularityRank - b.popularityRank)

      return (
        <button
          key={cat}
          onClick={() => { playClick(); setExpandedCategory(isExpanded ? null : cat); }}
          className="w-full text-left p-4 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] transition-all flex flex-col gap-3 group animate-in fade-in-50 duration-200"
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ background: catColor, boxShadow: `0 0 8px ${catColor}40` }} />
              <h3 className="font-display font-bold text-lg text-white group-hover:text-[var(--cyan)] transition-colors">{cat}</h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-[var(--cyan)]">{count}</div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--text4)]">Substances</div>
            </div>
          </div>
          
          {isExpanded && (
            <div className="mt-2 pt-3 border-t border-[var(--border2)] w-full animate-in fade-in slide-in-from-top-1 flex flex-col gap-4 text-left" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm text-[var(--text3)] leading-relaxed">{desc}</p>
              
              <div className="bg-black/20 rounded-lg p-3 border border-[rgba(255,255,255,0.03)] flex flex-col gap-2">
                <div className="text-[10px] uppercase tracking-wider font-mono opacity-80" style={{ color: catColor }}>
                  Substances in {cat}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {catSubstances.map(s => (
                    <button
                      key={s.name}
                      onClick={(e) => {
                        e.stopPropagation()
                        onNavigate(s)
                        playClose()
                        onClose()
                      }}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] hover:border-white/20 transition-all text-white flex items-center gap-1.5"
                    >
                      {s.name}
                      {s.harmLevel === 'extreme' && (
                        <Skull className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </button>
      )
    })
  } else if (label === 'Deadly Combos' || label === 'Safe Synergies') {
    accentColor = label === 'Deadly Combos' ? 'var(--red)' : 'var(--green)'
    description = label === 'Deadly Combos' ? 'Interactions specifically flagged as potentially deadly.' : 'Interactions explicitly flagged as safe or low risk.'
    const targetLevels = label === 'Deadly Combos' ? ['deadly', 'dangerous'] : ['safe', 'low_risk']
    
    // We only have Category-to-Category combos in comboMatrix. 
    // To list exact combos, we'll list the category pairings that hit this criteria.
    const combos = Object.entries(comboMatrix).filter(([_, level]) => targetLevels.includes(level))
    
    items = combos.map(([key, level], i) => {
      const [catA, catB] = key.split('+') as [Category, Category]
      const colorA = CATEGORY_COLORS[catA] || 'var(--cyan)'
      const colorB = CATEGORY_COLORS[catB] || 'var(--cyan)'
      const levelColor = COMBO_LEVEL_COLORS[level]
      
      return (
        <button 
          key={i} 
          onClick={() => setExpandedCombo(expandedCombo === key ? null : key)}
          className="w-full text-left p-4 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] transition-all flex flex-col gap-3 group"
        >
          <div className="flex w-full items-center gap-4">
            <div className="flex-1 text-right font-display font-bold text-white text-sm sm:text-base">{catA}</div>
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-3 h-3 rounded-full" style={{ background: colorA }} />
              <div className="w-3 h-px bg-[var(--text5)]" />
              <div className="w-3 h-3 rounded-full" style={{ background: colorB }} />
            </div>
            <div className="flex-1 text-left font-display font-bold text-white text-sm sm:text-base">{catB}</div>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-wider font-mono px-3 py-1 rounded-full border" style={{ color: levelColor, borderColor: `${levelColor}40`, background: `${levelColor}15` }}>
              {COMBO_LEVEL_LABELS[level]}
            </span>
          </div>
          {expandedCombo === key && (() => {
            const topA = substances.filter(s => s.category === catA).sort((a,b) => a.popularityRank - b.popularityRank).slice(0, 8)
            const topB = catA === catB ? [] : substances.filter(s => s.category === catB).sort((a,b) => a.popularityRank - b.popularityRank).slice(0, 8)
            
            return (
              <div className="mt-2 pt-3 border-t border-[var(--border2)] animate-in fade-in slide-in-from-top-1 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
                <div className="text-sm text-[var(--text3)] text-center leading-relaxed">
                  {COMBO_DESCRIPTIONS[level] || 'No specific details available for this interaction level.'}
                </div>
                
                <div className="bg-black/20 rounded-lg p-3 border border-[rgba(255,255,255,0.03)] flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="text-[10px] uppercase tracking-wider font-mono text-left opacity-80" style={{ color: colorA }}>{catA} Examples</div>
                    <div className="flex flex-wrap gap-1.5">
                      {topA.map(s => (
                        <button 
                          key={s.name} 
                          onClick={(e) => { e.stopPropagation(); onNavigate(s); playClose(); onClose(); }}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] hover:border-white/20 transition-all text-white"
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {topB.length > 0 && (
                    <div className="flex flex-col gap-2 pt-3 border-t border-[rgba(255,255,255,0.03)]">
                      <div className="text-[10px] uppercase tracking-wider font-mono text-left opacity-80" style={{ color: colorB }}>{catB} Examples</div>
                      <div className="flex flex-wrap gap-1.5">
                        {topB.map(s => (
                          <button 
                            key={s.name} 
                            onClick={(e) => { e.stopPropagation(); onNavigate(s); playClose(); onClose(); }}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] hover:border-white/20 transition-all text-white"
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </button>
      )
    })
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center backdrop-blur-sm"
      style={{ background: `radial-gradient(ellipse at 50% 0%, ${accentColor}15 0%, rgba(0,0,0,0.85) 70%)` }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={popupRef}
        className={`border border-[var(--border)] w-full flex flex-col${isMobile ? ' h-[100dvh]' : ' neon-popup-glow h-[85dvh] sm:rounded-lg rounded-t-lg'}`}
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 15%, var(--bg)) 0%, var(--bg) 100%)`,
          overflow: 'clip',
          ...(!isMobile ? {
            maxWidth: 'min(600px, 96vw)',
            animation: pullOffset === 0 && !isDragging ? 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' : 'none',
            overscrollBehavior: 'contain',
            transform: `translateY(${pullOffset}px)`,
            transition: !isDragging ? 'transform 0.3s cubic-bezier(0.16,1,0.3,1)' : 'none',
          } : {}),
        } as React.CSSProperties}
        {...(isMobile ? {} : {
          onTouchStart: handlePullStart,
          onTouchMove: handlePullMove,
          onTouchEnd: handlePullEnd,
        })}
      >
        <div className="popup-header sticky top-0 z-10 p-4 sm:p-6 border-b border-[var(--border)] bg-black/20 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-1" style={{ color: accentColor }}>
                {title}
              </h2>
              {description && <p className="text-xs sm:text-sm text-[var(--text3)] leading-relaxed">{description}</p>}
            </div>
            <button
              onClick={() => { playClose(); onClose(); }}
              className="p-3 -m-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[var(--text4)] hover:text-white flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="popup-scroll-area flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3">
          {items.length > 0 ? items : (
            <div className="text-center py-12 text-[var(--text4)] italic">No data available for this metric.</div>
          )}
        </div>
      </div>
    </div>
  )
}
