'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Substance, Category, ComboLevel } from '@/lib/types'
import { CATEGORY_COLORS, HARM_LEVEL_COLORS, COMBO_LEVEL_COLORS, COMBO_LEVEL_LABELS, COMBO_DESCRIPTIONS } from '@/lib/types'
import { slugify } from '@/lib/data'
import RadarChart from '@/components/RadarChart'
import DurationTimeline from '@/components/DurationTimeline'
import DosageTable from '@/components/DosageTable'
import dynamic from 'next/dynamic'

const SubjectiveEffectsModal = dynamic(
  () => import('@/components/SubjectiveEffectsModal'),
  { ssr: false, loading: () => null }
)

interface SubstanceDetailProps {
  substance: Substance
  comboMatrix: Record<string, ComboLevel>
  relatedSubstances: Substance[]
  allSubstances: Substance[]
}

type Tab = 'overview' | 'risks' | 'dosage' | 'interactions'

export default function SubstanceDetail({ substance, comboMatrix, relatedSubstances, allSubstances }: SubstanceDetailProps) {
  const [tab, setTab] = useState<Tab>('overview')
  const [effectsModalOpen, setEffectsModalOpen] = useState(false)
  const router = useRouter()
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

  const getComboLevel = (cat: Category): ComboLevel => {
    return comboMatrix[`${substance.category}+${cat}`] || comboMatrix[`${cat}+${substance.category}`] || 'caution'
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { key: 'risks', label: 'Risks', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
    { key: 'dosage', label: 'Dosage', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625g1.125 1.125 0 011.125 1.125v1.5a3.375 3.375 0 01-3.375 3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.5c.621 0 1.125-.504 1.125-1.125V3.375c0-.621-.504-1.125-1.125-1.125z' },
    { key: 'interactions', label: 'Interactions', icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
  ]

  return (
    <div className="flex-1 min-h-0 w-full mx-auto max-w-[1800px]">
      <nav className="sticky top-0 z-50 border-b border-[var(--border)]" style={{ background: 'rgba(4, 4, 12, 0.95)', backdropFilter: 'blur(24px) saturate(1.6)' }}>
        <div className="w-full px-5 sm:px-8 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)] to-[var(--pink)]" />
              <div className="absolute inset-[1px] rounded-[7px] bg-[var(--bg)] flex items-center justify-center">
                <span className="text-sm font-bold font-display bg-gradient-to-br from-[var(--accent2)] to-[var(--pink)] bg-clip-text text-transparent">T</span>
              </div>
            </div>
            <span className="font-display font-bold text-lg tracking-tight hidden sm:inline">
              <span className="text-[var(--accent2)]">Trip</span><span className="text-white">Dex</span>
            </span>
          </Link>
          <div className="h-6 w-px bg-[var(--border)] flex-shrink-0" />
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[var(--text3)] hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {(substance.brandNames.length > 0 || substance.streetNames.length > 0) && (
            <div className="flex flex-wrap gap-1 ml-auto flex-shrink-0">
              {substance.brandNames.slice(0, 2).map(b => (
                <span key={b} className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">🏥 {b}</span>
              ))}
              {substance.streetNames.slice(0, 3).map(s => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-[rgba(255,255,255,0.04)] text-[var(--text4)] border border-[var(--border)] font-mono">⚡ {s}</span>
              ))}
            </div>
          )}
          {hasEffects && (
            <button
              onClick={() => setEffectsModalOpen(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all flex-shrink-0"
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
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-display font-bold text-white truncate">{substance.name}</h1>
            <div className="flex items-center gap-2 text-xs text-[var(--text4)] font-mono">
              <span>{substance.category}</span>
              <span>·</span>
              <span>{substance.harmLevel} risk</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full px-5 sm:px-8 py-6 sm:py-10 space-y-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1.5 h-8 rounded-full" style={{ background: catColor, boxShadow: `0 0 12px ${catColor}40` }} />
          <div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-sm text-[var(--text3)] font-display">{substance.category}</span>
              <span
                className="px-3 py-0.5 rounded-full text-xs font-semibold uppercase font-mono"
                style={{ background: `${harmColor}15`, color: harmColor, border: `1px solid ${harmColor}20` }}
              >
                {substance.harmLevel}
              </span>
              <span className="text-sm text-[var(--text4)] font-mono">Harm: {substance.harmScore}/100 · Addiction: {substance.addictionScore}/100</span>
            </div>
          </div>
        </div>

        {substance.aliases.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {substance.aliases.map(a => (
              <span key={a} className="text-xs px-2.5 py-1 rounded-md bg-[rgba(255,255,255,0.04)] text-[var(--text4)] font-mono border border-[var(--border)]">
                {a}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`tab-btn flex items-center gap-2 flex-shrink-0 ${tab === t.key ? 'active' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {hasEffects && (
                <div className="info-card" style={{ '--info-c': catColor } as React.CSSProperties}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold mb-2 font-display text-[var(--text2)]">Subjective Effects</h4>
                      <p className="text-xs text-[var(--text4)] leading-relaxed">
                        {substance.subjectiveEffects?.allEffects.length ?? 0} effects documented · Includes &quot;Why Users Like It&quot; · Duration timeline
                      </p>
                    </div>
                    <button
                      onClick={() => setEffectsModalOpen(true)}
                      className="px-3 py-2 rounded-lg text-xs font-display font-semibold transition-all flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2))',
                        color: '#a78bfa',
                        border: '1px solid rgba(139,92,246,0.3)',
                      }}
                    >
                      Open Effects
                    </button>
                  </div>
                </div>
              )}
        {substance.pwSummary && (
                <div className="info-card" style={{ '--info-c': catColor } as React.CSSProperties}>
                  <h4 className="text-sm font-semibold mb-2 font-display text-[var(--text2)]">Summary</h4>
                  <p className="text-sm text-[var(--text3)] leading-relaxed">{substance.pwSummary}</p>
                </div>
              )}
              {relatedSubstances.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text2)] mb-3 font-display">Related Substances ({substance.category})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {relatedSubstances.map(s => (
                      <Link
                        key={s.name}
                        href={`/substances/${slugify(s.name)}`}
                        className="glass rounded-lg px-3 py-2.5 text-xs text-[var(--text2)] hover:text-white hover:border-[var(--accent2)]/30 transition-all border border-[var(--border)] text-center truncate"
                      >
                        {s.name}
                      </Link>
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

          {tab === 'dosage' && <DosageTable substance={substance} />}

          {tab === 'interactions' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm lg:text-base font-semibold text-[var(--text2)] mb-3 font-display">Category Interactions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {Object.entries(CATEGORY_COLORS).map(([cat, color]) => {
                    const level = getComboLevel(cat as Category)
                    const levelColor = COMBO_LEVEL_COLORS[level]
                    return (
                      <div key={cat} className="info-card flex items-center gap-2.5" style={{ '--info-c': levelColor } as React.CSSProperties}>
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="text-sm text-[var(--text2)] flex-1 font-display">{cat}</span>
                        <span
                          className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ background: `${levelColor}12`, color: levelColor, border: `1px solid ${levelColor}20` }}
                        >
                          {COMBO_LEVEL_LABELS[level]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
              {substance.interactions.length > 0 && (
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
      </main>

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
        )
        if (timeoutId) clearTimeout(timeoutId)
        if (!res.ok) throw new Error('not found')
        const data = await res.json()

        if (data.imageUrl) {
          setImageUrl(data.imageUrl)
          setSource(data.source)
        } else {
          setError(true)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
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
      onError={() => {
        if (source === 'pubchem' && smiles) {
          setImageUrl(`https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(smiles)}/image`)
          setSource('cactus')
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
                ? <><span className="text-[var(--text2)] font-semibold">{item.split(':')[0]}:</span>{item.split(':').slice(1).join(':')}</>
                : item
              }
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
