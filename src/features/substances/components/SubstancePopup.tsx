'use client'

import { useState, useRef, useEffect, Suspense, lazy } from 'react'
import Image from 'next/image'
import type { Substance, Category, ComboLevel } from '@/lib/types'
import { CATEGORY_COLORS, HARM_LEVEL_COLORS, COMBO_LEVEL_COLORS, COMBO_LEVEL_LABELS, COMBO_DESCRIPTIONS } from '@/lib/types'
import RadarChart from '@/components/RadarChart'
import DurationTimeline from '@/components/DurationTimeline'
import DosageTable from '@/components/DosageTable'
import ToleranceSection from '@/components/ToleranceSection'
import EffectsTabContent from '@/components/EffectsTabContent'
import LegalStatusTabContent from '@/components/LegalStatusTabContent'

const SubjectiveEffectsModal = lazy(() => import('@/components/SubjectiveEffectsModal'))

const FAVORITES_KEY = 'tripgem_favorites'

function getFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
  } catch { return [] }
}

function toggleFavorite(name: string) {
  const favs = getFavorites()
  const idx = favs.indexOf(name)
  if (idx >= 0) favs.splice(idx, 1)
  else favs.push(name)
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs))
  return favs
}

interface SubstancePopupProps {
  substance: Substance
  comboMatrix: Record<string, ComboLevel>
  onClose: () => void
  onNavigate: (substance: Substance) => void
  allSubstances: Substance[]
}

type Tab = 'overview' | 'effects' | 'risks' | 'dosage' | 'tolerance' | 'interactions' | 'legal'

export default function SubstancePopup({ substance, comboMatrix, onClose, onNavigate, allSubstances }: SubstancePopupProps) {
  const [tab, setTab] = useState<Tab>('overview')
  const [effectsModalOpen, setEffectsModalOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const onCloseRef = useRef(onClose)
  const [isFav, setIsFav] = useState(() => getFavorites().includes(substance.name))
  const [favPulse, setFavPulse] = useState(0)
  const catColor = CATEGORY_COLORS[substance.category]
  const harmColor = HARM_LEVEL_COLORS[substance.harmLevel]
  const sanityImageUrl = substance.chemicalStructure?.asset?.url || null
  const structureAlt = substance.chemicalStructure?.alt || `${substance.name} chemical structure`
  const hasEffects = substance.subjectiveEffects && (
    substance.subjectiveEffects.allEffects.length > 0 ||
    substance.subjectiveEffects.mostLoved.length > 0 ||
    substance.subjectiveEffects.riskyEffects.length > 0 ||
    substance.subjectiveEffects.timeline.length > 0 ||
    substance.subjectiveEffects.whyUsersLikeIt?.summary
  )
  const tabKeys: Tab[] = hasEffects
    ? ['overview', 'effects', 'risks', 'dosage', 'tolerance', 'interactions', 'legal']
    : ['overview', 'risks', 'dosage', 'tolerance', 'interactions', 'legal']

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const popup = popupRef.current
    if (popup) {
      const first = popup.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      first?.focus()
    }
    return () => {
      if (prev?.focus) prev.focus()
    }
  }, [])

  useEffect(() => {
    const popup = popupRef.current
    if (!popup) return
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = popup.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [])

  const handleTabTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX)
  const handleTabTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const diff = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(diff) < 50) { setTouchStartX(null); return }
    const idx = tabKeys.indexOf(tab)
    if (diff < 0 && idx < tabKeys.length - 1) setTab(tabKeys[idx + 1])
    else if (diff > 0 && idx > 0) setTab(tabKeys[idx - 1])
    setTouchStartX(null)
  }

  const handleFavorite = () => {
    toggleFavorite(substance.name)
    setIsFav(getFavorites().includes(substance.name))
    setFavPulse(v => v + 1)
  }

  const getComboLevel = (cat: Category): ComboLevel => {
    return comboMatrix[`${substance.category}+${cat}`] || comboMatrix[`${cat}+${substance.category}`] || 'caution'
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'risks', label: 'Risks' },
    { key: 'dosage', label: 'Dosage' },
    { key: 'tolerance', label: 'Tolerance' },
    { key: 'interactions', label: 'Interactions' },
  ]

  const relatedSubs = allSubstances
    .filter(s => s.category === substance.category && s.name !== substance.name)
    .slice(0, 4)

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center backdrop-blur-sm"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.08) 0%, rgba(236,72,153,0.04) 30%, rgba(0,0,0,0.65) 70%)' } as React.CSSProperties}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      onPointerDown={e => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`${substance.name} details`}
    >
      <div
        ref={popupRef}
        className="glass-strong neon-popup-glow w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92dvh] sm:max-h-[85dvh] sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)', overscrollBehavior: 'contain' }}
      >
    <div className="popup-header sticky top-0 z-10 p-4 sm:p-5 lg:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-1.5 h-6 lg:h-7 rounded-full" style={{ background: catColor, boxShadow: `0 0 12px ${catColor}40` }} />
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-white truncate">{substance.name}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 ml-4">
            <span className="text-xs lg:text-sm text-[var(--text3)] font-display">{substance.category}</span>
            <span
              className="px-3 py-0.5 lg:px-3.5 lg:py-1 rounded-full text-[11px] lg:text-xs font-semibold uppercase font-mono"
              style={{ background: `${harmColor}15`, color: harmColor, border: `1px solid ${harmColor}20` }}
            >
              {substance.harmLevel}
            </span>
            <span className="text-xs lg:text-sm text-[var(--text4)] font-mono">
              <span className="text-[var(--text3)]">{substance.onset}</span>
              <span className="mx-1 text-[var(--border2)]">/</span>
              <span className="text-[var(--text3)]">{substance.duration}</span>
              {substance.ld50 && (
                <><span className="mx-1 text-[var(--border2)]">·</span><span className="text-amber-400/70">LD50: {substance.ld50}</span></>
              )}
            </span>
          </div>
          {substance.aliases.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 ml-4">
              {substance.aliases.map(a => (
                <span key={a} className="text-[11px] lg:text-xs px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.04)] text-[var(--text4)] font-mono border border-[var(--border)]">
                  {a}
                </span>
              ))}
              {substance.brandNames.map(b => (
                <span key={b} className="text-[11px] lg:text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 font-mono border border-blue-500/20">🏥 {b}</span>
              ))}
              {substance.streetNames.map(s => (
                <span key={s} className="text-[11px] lg:text-xs px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.03)] text-[var(--text4)] font-mono border border-[var(--border)]">⚡ {s}</span>
              ))}
            </div>
          )}
        </div>
          <div className="flex items-center gap-1">
            {hasEffects && (
              <button
                onClick={() => setTab('effects')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-display font-semibold transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15))',
                  color: '#a78bfa',
                  border: '1px solid rgba(139,92,246,0.25)',
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Effects
              </button>
            )}
            <button
              onClick={handleFavorite}
              className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors flex-shrink-0"
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg key={favPulse} className="w-5 h-5 heart-svg" fill={isFav ? 'var(--red)' : 'none'} stroke={isFav ? 'var(--red)' : 'currentColor'} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[var(--text4)] hover:text-white flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

          <div
            role="tablist"
            onTouchStart={handleTabTouchStart}
            onTouchEnd={handleTabTouchEnd}
            className="flex gap-1 mt-3 -mx-1 px-1 overflow-x-auto"
          >
            {tabKeys.map(key => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`tab-btn flex-shrink-0 ${tab === key ? 'active' : ''}`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div key={tab} className="flex-1 overflow-y-auto overscroll-contain min-h-0 substance-popup-scroll p-4 sm:p-6 lg:p-8 space-y-5 lg:space-y-6"
          style={{ animation: 'fadeIn 0.15s ease-out' }}>
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <RadarChart substance={substance} />
                <div className="space-y-4">
                  <DurationTimeline substance={substance} />
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text2)] mb-2 font-display">Chemical Structure</h4>
                    <div className="chemical-structure-container rounded-xl p-3 flex items-center justify-center relative min-h-[120px]">
                      <ChemicalStructureImage
                        substanceName={substance.name}
                        smiles={substance.smiles}
                        sanityUrl={sanityImageUrl}
                        alt={structureAlt}
                        width={substance.chemicalStructure?.asset?.metadata?.dimensions?.width || 300}
                        height={substance.chemicalStructure?.asset?.metadata?.dimensions?.height || 160}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {substance.pwSummary && (
                <div className="info-card" style={{ '--info-c': catColor } as React.CSSProperties}>
      <h4 className="text-sm font-semibold mb-2 font-display text-[var(--text2)]">Summary</h4>
              <p className="text-sm text-[var(--text3)] leading-relaxed">{substance.pwSummary}</p>
                </div>
              )}
              {relatedSubs.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text2)] mb-2 font-display">Related Substances</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {relatedSubs.map(s => (
                      <button
                        key={s.name}
                        onClick={() => onNavigate(s)}
                        className="glass rounded-lg px-3 py-2 text-xs text-[var(--text2)] hover:text-white hover:border-[var(--accent2)]/30 transition-all whitespace-nowrap flex-shrink-0 border border-[var(--border)]"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'risks' && (
            <div className="space-y-4">
              <InfoList title="Risks" items={substance.risks} color="var(--orange)" icon="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              <InfoList title="Overdose Signs" items={substance.overdose} color="var(--red)" icon="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              <InfoList title="Safety Tips" items={substance.safety} color="var(--green)" icon="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              <InfoList title="Withdrawal Symptoms" items={substance.withdrawal || []} color="var(--yellow)" icon="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
              <InfoList title="Recovery Options" items={substance.recovery || []} color="var(--cyan)" icon="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </div>
          )}

          {tab === 'effects' && (
            <EffectsTabContent
              substance={substance}
              catColor={catColor}
              onOpenFullReport={() => setEffectsModalOpen(true)}
            />
          )}

          {tab === 'dosage' && (
            <DosageTable substance={substance} />
          )}

          {tab === 'tolerance' && (
            <ToleranceSection substance={substance} />
          )}

          {tab === 'legal' && (
            <LegalStatusTabContent substance={substance} catColor={catColor} />
          )}

          {tab === 'interactions' && (
            <div className="space-y-4">
      <div>
        <h4 className="text-sm lg:text-base font-semibold text-[var(--text2)] mb-3 font-display">Category Interactions</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => {
            const level = getComboLevel(cat as Category)
            const levelColor = COMBO_LEVEL_COLORS[level]
            return (
              <div key={cat} className="info-card flex items-center gap-2.5" style={{ '--info-c': levelColor } as React.CSSProperties}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-sm lg:text-[15px] text-[var(--text2)] flex-1 font-display">{cat}</span>
                <span
                  className="text-[11px] lg:text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: `${levelColor}12`, color: levelColor, border: `1px solid ${levelColor}20` }}
                >
                  {COMBO_LEVEL_LABELS[level]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
              {substance.interactions?.length > 0 && (
                <InfoList title="Specific Interactions" items={substance.interactions} color="var(--orange)" icon="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="info-card" style={{ '--info-c': 'var(--green)' } as React.CSSProperties}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[substance.bestMix as Category] || 'var(--green)' }} />
                    <span className="text-xs font-semibold text-[var(--text2)] font-display">Best Mix Category</span>
                  </div>
                  <p className="text-sm text-[var(--text3)] font-mono">{substance.bestMix || 'Unknown'}</p>
                </div>
                <div className="info-card" style={{ '--info-c': 'var(--red)' } as React.CSSProperties}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs font-semibold text-red-400 font-display">Never Mix Category</span>
                  </div>
                  <p className="text-sm text-[var(--text3)] font-mono">{substance.neverMix || 'Unknown'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {effectsModalOpen && (
          <Suspense fallback={null}>
            <SubjectiveEffectsModal
              substance={substance}
              isOpen={effectsModalOpen}
              onClose={() => setEffectsModalOpen(false)}
            />
          </Suspense>
        )}
      </div>
    </div>
  )
}

function ChemicalStructureImage({
  substanceName,
  smiles,
  sanityUrl,
  alt,
  width,
  height,
}: {
  substanceName: string
  smiles: string
  sanityUrl: string | null
  alt: string
  width: number
  height: number
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(sanityUrl)
  const [source, setSource] = useState<'sanity' | 'pubchem' | 'cactus' | null>(sanityUrl ? 'sanity' : null)
  const [loading, setLoading] = useState(!sanityUrl)
  const [error, setError] = useState(false)
  const fetchedRef = useRef<string>('')
  const imgLoadRef = useRef(0)

  useEffect(() => {
    if (sanityUrl) {
      fetchedRef.current = substanceName
      return
    }

    if (fetchedRef.current === substanceName) return
    fetchedRef.current = substanceName
    setLoading(true)
    setError(false)

    let cancelled = false

    async function fetchStructure() {
    try {
      const hasTimeout = typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
      const controller = hasTimeout ? new AbortController() : null
      const timeoutId = controller ? setTimeout(() => controller?.abort(), 8000) : null

      const res = await fetch(
        `/api/chemical-structure?name=${encodeURIComponent(substanceName)}${smiles ? `&smiles=${encodeURIComponent(smiles)}` : ''}`,
        controller ? { signal: controller.signal } : undefined
      );
      if (timeoutId) clearTimeout(timeoutId);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();

      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
        setSource(data.source);
      } else {
        setError(true);
      }
    } catch {
      if (!cancelled) setError(true);
    } finally {
      if (!cancelled) setLoading(false);
    }
  }

    fetchStructure()
    return () => { cancelled = true }
  }, [substanceName, smiles, sanityUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2">
        <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[var(--text4)]">Loading structure...</span>
      </div>
    )
  }

  if (error || !imageUrl) {
    return <div className="text-xs text-[var(--text4)] italic py-4">Structure image unavailable</div>
  }

  if (source === 'sanity') {
    return <Image src={imageUrl} alt={alt} width={width} height={height} className="chemical-structure-image max-h-40 sm:max-h-48 w-auto object-contain" onError={() => setError(true)} />
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="chemical-structure-image max-h-40 sm:max-h-48 w-auto"
      loading="lazy"
      onLoad={() => setLoading(false)}
      onError={() => {
        if (source === 'pubchem' && smiles && imgLoadRef.current < 1) {
          imgLoadRef.current += 1
          setImageUrl(`https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(smiles)}/image`)
          setSource('cactus')
          setLoading(true)
        } else {
          setError(true)
        }
      }}
    />
  )
}

function InfoList({ title, items, color, icon }: { title: string; items: string[]; color: string; icon: string }) {
  if (items.length === 0) return null
  return (
    <div className="info-card" style={{ '--info-c': color } as React.CSSProperties}>
      <h4 className="text-sm lg:text-base font-semibold mb-3 flex items-center gap-2 font-display" style={{ color }}>
        <svg className="w-4.5 h-4.5 lg:w-5 lg:h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm lg:text-[15px] text-[var(--text3)] leading-relaxed flex gap-2">
            <span className="text-[var(--text4)] mt-0.5 flex-shrink-0">•</span>
            <span>
              {item.startsWith('DEADLY:') || item.startsWith('DANGEROUS:') || item.startsWith('Risky:') || item.startsWith('Caution:')
                ? <><span className="text-[var(--text2)]">{item.split(':')[0]}:</span>{item.split(':').slice(1).join(':')}</>
                : item
              }
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
