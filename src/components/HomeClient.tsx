'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { Substance, Category, ComboLevel, CategoryMeta, SubstanceCombo } from '@/lib/types'
import { FEATURES, type FeatureConfig } from '@/features/registry'
import StatsBar from '@/components/StatsBar'

const SubstancePopup = dynamic(() => import('@/features/substances/components/SubstancePopup'), {
  loading: () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

type Section = 'substances' | 'matrix' | 'tools'

interface HomeClientProps {
  substances: Substance[]
  stats: { total: number; avgHarm: number; avgAddiction: number; extremeCount: number; categories: number }
  categories: CategoryMeta[]
  comboMatrix: Record<string, ComboLevel>
  substanceCombos?: SubstanceCombo[]
}

export default function HomeClient({ substances, stats, categories, comboMatrix, substanceCombos }: HomeClientProps) {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [popupSubstance, setPopupSubstance] = useState<Substance | null>(null)
  const [activeSection, setActiveSection] = useState<Section>('substances')
  const [mounted, setMounted] = useState(false)
  const [navOpacity, setNavOpacity] = useState(0)
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setNavOpacity(Math.min(window.scrollY / 200, 1))
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  const toggleCategory = useCallback((cat: Category) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }, [])

  const findSubstance = useCallback((name: string) => {
    return substances.find(s => s.name.toLowerCase() === name.toLowerCase())
  }, [substances])

  // Sort substances by "popularity" (most used/most data) instead of alphabetical
  const sortedSubstances = useMemo(() => {
    return [...substances].sort((a, b) => {
      // Calculate a "popularity score" based on data richness and harm potential
      const aScore = 
        (a.pwSummary?.length || 0) + 
        (a.pwRoas?.length || 0) * 10 + 
        (a.risks?.length || 0) * 5 + 
        (a.safety?.length || 0) * 3 +
        a.harmScore * 2; // Higher harm = more commonly searched/used
      
      const bScore = 
        (b.pwSummary?.length || 0) + 
        (b.pwRoas?.length || 0) * 10 + 
        (b.risks?.length || 0) * 5 + 
        (b.safety?.length || 0) * 3 +
        b.harmScore * 2;
      
      // Sort by score descending (most popular/harmful first)
      if (bScore !== aScore) return bScore - aScore;
      
      // Fallback to name for consistency
      return a.name.localeCompare(b.name);
    });
  }, [substances]);

  const sectionProps: Record<Section, Record<string, unknown>> = {
    substances: {
      substances: sortedSubstances, // Use sorted list
      selectedCategories,
      onCategoryToggle: toggleCategory,
      onCategoryClear: () => setSelectedCategories([]),
      onSubstanceClick: setPopupSubstance,
    },
    matrix: {
      substances,
      comboRules: comboMatrix,
      onSelectSubstance: setPopupSubstance,
    },
    tools: {
      substances,
      comboRules: comboMatrix,
      substanceCombos,
      onFindSubstance: findSubstance,
    },
  }

  return (
    <div className={`transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'} flex flex-col flex-1 min-h-0 w-full mx-auto max-w-[1800px]`}>
      <nav
        className="sticky top-0 z-50 border-b border-[var(--border)]"
        style={{
          background: `rgba(4, 4, 12, ${0.75 + navOpacity * 0.2})`,
          backdropFilter: isTouch ? 'blur(12px)' : 'blur(24px) saturate(1.6)',
          WebkitBackdropFilter: isTouch ? 'blur(12px)' : 'blur(24px) saturate(1.6)',
        }}
      >
        <div className="w-full px-5 sm:px-8 h-16 sm:h-18 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)] to-[var(--pink)]" />
              <div className="absolute inset-[1px] rounded-[7px] bg-[var(--bg)] flex items-center justify-center">
                <span className="text-sm font-bold font-display bg-gradient-to-br from-[var(--accent2)] to-[var(--pink)] bg-clip-text text-transparent">T</span>
              </div>
            </div>
            <span className="font-display font-bold text-base sm:text-lg tracking-tight">
              <span className="text-[var(--accent2)]">Trip</span><span className="text-white">Dex</span>
            </span>
          </a>
          <div className="flex gap-1 p-1 rounded-full bg-[rgba(255,255,255,0.03)] border border-[var(--border)]">
            {FEATURES.map(feature => (
              <button
                key={feature.key}
                onClick={() => setActiveSection(feature.key as Section)}
                className={`nav-tab flex items-center gap-1.5 ${activeSection === feature.key ? 'active' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                </svg>
                <span className="hidden sm:inline">{feature.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="w-full px-5 sm:px-8 py-10 sm:py-14 space-y-12 sm:space-y-16 flex-1">
        <header className="text-center py-16 sm:py-24 lg:py-32 space-y-7 sm:space-y-8 relative">
          <div className="hero-glow" />
          <div className="hero-badge mx-auto">
            <span className="dot" />
            {stats.total} substances indexed
          </div>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-extrabold leading-[1.05] tracking-tight gradient-text">
            Evidence-Based<br />Harm Reduction
          </h1>
          <p className="text-base sm:text-xl text-[var(--text3)] max-w-xl mx-auto leading-relaxed">
            Comprehensive database with interaction checking, combination risk matrix, and dosage guides.
          </p>
          <div className="disclaimer-box max-w-lg mx-auto mt-3">
            Educational resource only. Not medical advice. Always consult healthcare professionals.
          </div>
        </header>

        <section className="section-card" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' }}>
          <StatsBar stats={stats} categories={categories} />
        </section>

        <section className="section-card" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both' }}>
          {FEATURES.map(feature => {
            if (feature.key !== activeSection) return null
            const FeatureComponent = feature.component
            return (
              <FeatureComponent
                key={feature.key}
                {...(sectionProps[feature.key as Section] ?? {})}
              />
            )
          })}
        </section>
      </main>

      <footer className="w-full text-center py-16 sm:py-24 border-t border-[var(--border)] relative mt-8">
        <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-[rgba(168,85,247,0.2)] to-transparent" />
        <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-[rgba(168,85,247,0.15)] to-transparent" />
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <div className="relative w-6 h-6 rounded-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)] to-[var(--pink)]" />
            <div className="absolute inset-[1px] rounded-[3px] bg-[var(--bg)] flex items-center justify-center">
              <span className="text-[9px] font-bold font-display bg-gradient-to-br from-[var(--accent2)] to-[var(--pink)] bg-clip-text text-transparent">T</span>
            </div>
          </div>
          <span className="font-display font-semibold text-sm text-[var(--text2)]">
            Trip<span className="text-[var(--accent2)]">Dex</span>
          </span>
        </div>
        <p className="text-xs text-[var(--text3)] max-w-md mx-auto leading-relaxed">
          Open-source harm reduction resource for educational purposes.
        </p>
        <p className="text-[10px] text-[var(--text4)] mt-3 font-mono">
          Data: PsychonautWiki · TripSit · Erowid · WHO
        </p>
      </footer>

      {popupSubstance && (
        <SubstancePopup
          substance={popupSubstance}
          comboMatrix={comboMatrix}
          onClose={() => setPopupSubstance(null)}
          onNavigate={sub => setPopupSubstance(sub)}
          allSubstances={substances}
        />
      )}
    </div>
  )
}