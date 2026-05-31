'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { Substance, Category, ComboLevel, CategoryMeta, SubstanceCombo } from '@/lib/types'
import { FEATURES, type FeatureConfig } from '@/features/registry'
import StatsBar from '@/components/StatsBar'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'
import { playClick, playHover, playOpen, playClose, playToggle, playSectionChange, playSearch, hydrateUIsounds, setUIsoundsEnabled } from '@/lib/ui-sounds'

const KeyboardShortcutsModal = dynamic(() => import('@/components/KeyboardShortcutsModal'))
const UserSettings = dynamic(() => import('@/components/UserSettings'))
const ThemeSelector = dynamic(() => import('@/components/ThemeSelector'))
const OnboardingModal = dynamic(() => import('@/components/OnboardingModal'))
const ScoreBreakdownPopup = dynamic(() => import('@/components/ScoreBreakdownPopup'))

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
  stats: { total: number; avgHarm: number; avgAddiction: number; avgOdRisk: number; avgWithdrawal: number; avgInteraction: number; avgDependence: number; extremeCount: number; categories: number }
  categories: CategoryMeta[]
  comboMatrix: Record<string, ComboLevel>
  substanceCombos?: SubstanceCombo[]
}

export default function HomeClient({ substances, stats, categories, comboMatrix, substanceCombos }: HomeClientProps) {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [popupSubstance, setPopupSubstance] = useState<Substance | null>(null)
  const [activeSection, setActiveSection] = useState<Section>('substances')
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const isTouchRef = useRef(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const popupRef = useRef(popupSubstance)
  const bodyWeight = useSettingsStore(s => s.bodyWeight)
  const weightUnit = useSettingsStore(s => s.weightUnit)
  const userLevel = useSettingsStore(s => s.userLevel)
  const uiSounds = useSettingsStore(s => s.uiSounds)
  const toggleSettings = useSettingsStore(s => s.toggleSettings)
  const hydrateSettings = useSettingsStore(s => s.hydrate)
  const toggleTheme = useThemeStore(s => s.toggleTheme)
  const hydrateTheme = useThemeStore(s => s.hydrate)


  const userLevelLabel = userLevel === 'new' ? 'New' : userLevel === 'common' ? 'Common' : 'Heavy'

  const openPopup = useCallback((s: Substance | null) => {
    if (s) playOpen()
    setPopupSubstance(s)
  }, [])

  const closePopup = useCallback(() => {
    playClose()
    setPopupSubstance(null)
  }, [])

  useEffect(() => {
    popupRef.current = popupSubstance
  }, [popupSubstance])

  useEffect(() => {
    const touch = 'ontouchstart' in window
    isTouchRef.current = touch
    hydrateTheme()
    hydrateSettings()
    hydrateUIsounds()
    requestAnimationFrame(() => setMounted(true))
    if (touch) queueMicrotask(() => setIsTouch(true))
  }, [hydrateTheme, hydrateSettings])

  useEffect(() => {
    setUIsoundsEnabled(uiSounds)
  }, [uiSounds])

  useEffect(() => {
    let ticking = false
    let lastScrolled = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const nowScrolled = window.scrollY > 50
          if (nowScrolled !== lastScrolled) {
            lastScrolled = nowScrolled
            setScrolled(nowScrolled)
          }
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const activeSectionRef = useRef(activeSection)
  useEffect(() => { activeSectionRef.current = activeSection }, [activeSection])

  const handleSectionChange = useCallback((section: Section) => {
    if (section === activeSectionRef.current) return
    playSectionChange()
    setActiveSection(section)
  }, [])

  // Keyboard shortcuts for desktop
  useEffect(() => {
    if (isTouch) return

    const onKeyDown = (e: KeyboardEvent) => {
      const ps = popupRef.current
      // Alt+1/2/3 for section switching
      if (e.altKey && e.key === '1') {
        e.preventDefault()
        handleSectionChange('substances')
      }
      if (e.altKey && e.key === '2') {
        e.preventDefault()
        handleSectionChange('matrix')
      }
      if (e.altKey && e.key === '3') {
        e.preventDefault()
        handleSectionChange('tools')
      }
      // Escape to close popup or shortcuts modal
  if (e.key === 'Escape' && ps) {
    closePopup()
  }
      if (e.key === 'Escape' && !ps && showShortcuts) {
        setShowShortcuts(false)
      }
      // Ctrl+K or Cmd+K for search focus (if search exists)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (searchInputRef.current) {
          searchInputRef.current.focus()
          searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
      // Alt+S to toggle settings
      if (e.altKey && e.key === 's') {
        e.preventDefault()
        toggleSettings()
      }
      // ? to toggle shortcuts modal
      if (e.key === '?' && !ps && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setShowShortcuts(prev => !prev)
      }
      // / to focus search
      if (e.key === '/' && !ps && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        if (searchInputRef.current) {
          searchInputRef.current.focus()
          searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isTouch, showShortcuts, toggleSettings, handleSectionChange, closePopup])

  const toggleCategory = useCallback((cat: Category) => {
    setSelectedCategories(prev =>
      prev.length === 1 && prev[0] === cat ? [] : [cat]
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

  const onCategoryClear = useCallback(() => setSelectedCategories([]), [])

  const sectionProps = useMemo((): Record<Section, Record<string, unknown>> => ({
    substances: {
      substances: sortedSubstances,
      selectedCategories,
      onCategoryToggle: toggleCategory,
      onCategoryClear,
      onSubstanceClick: openPopup,
      searchInputRef,
    },
    matrix: {
      substances,
      comboRules: comboMatrix,
      onSelectSubstance: openPopup,
    },
    tools: {
      substances,
      comboRules: comboMatrix,
      substanceCombos,
      onFindSubstance: findSubstance,
    },
  }), [sortedSubstances, selectedCategories, toggleCategory, onCategoryClear, openPopup, substances, comboMatrix, substanceCombos, findSubstance])

  return (
    <div className={`flex flex-col flex-1 min-h-0 w-full mx-auto max-w-[1800px] ${isTouch ? 'pb-16' : ''}`}>
      {/* Desktop/Tablet Top Nav */}
      <nav
        className={`sticky top-0 z-50 border-b border-[var(--border)] hidden sm:flex nav-bar-desktop ${scrolled ? 'scrolled' : ''}`}
        style={{
          backdropFilter: isTouch ? 'blur(12px)' : 'blur(24px) saturate(1.6)',
          WebkitBackdropFilter: isTouch ? 'blur(12px)' : 'blur(24px) saturate(1.6)',
        }}
      >
      <div className="w-full px-5 sm:px-8 h-16 sm:h-18 flex items-center justify-between gap-3 sm:gap-4">
        <div className="shrink-0" />
          <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-full bg-[rgba(255,255,255,0.03)] border border-[var(--border)]">
            {FEATURES.map(feature => (
        <button
          key={feature.key}
          onClick={() => handleSectionChange(feature.key as Section)}
          onMouseEnter={playHover}
          className={`nav-tab flex items-center gap-1.5 ${activeSection === feature.key ? 'active' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                </svg>
                <span className="hidden sm:inline">{feature.label}</span>
              </button>
            ))}
            <button
              onClick={() => { playToggle(); toggleTheme() }}
              className="nav-tab flex items-center justify-center"
              aria-label="Theme"
              title="Theme Select"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
            </button>
          </div>
      <button
        onClick={() => { playClick(); toggleSettings() }}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-[rgba(255,255,255,0.06)] transition-all text-[var(--text4)] hover:text-[var(--accent2)] group"
            aria-label="User settings"
            title="User settings (Alt+S)"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium border-r border-[var(--border)] pr-2.5 mr-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
              {mounted ? <>
                <span>{bodyWeight}{weightUnit}</span>
                <span style={{ color: userLevel === 'new' ? '#10b981' : userLevel === 'common' ? '#f59e0b' : '#ef4444' }}>·</span>
                <span className="hidden xs:inline">{userLevelLabel}</span>
              </> : <span className="h-3 w-16" />}
            </div>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          </div>
      </nav>

      {/* Mobile Top Bar (simplified) */}
      <nav className={`sticky top-0 z-50 border-b border-[var(--border)] sm:hidden nav-bar-mobile ${scrolled ? 'scrolled' : ''}`}
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
      <div className="w-full px-4 h-14 flex items-center justify-center">
        <div />
      </div>
      </nav>

      <main className="w-full px-4 sm:px-8 py-0 sm:py-0 space-y-6 sm:space-y-10 flex-1">
        <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 bg-[rgba(10,6,22,0.65)] border-b border-[var(--border)]">
  <header className="text-center py-8 sm:py-14 lg:py-18 relative">
    <div className="hero-glow" />
    <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6">
          <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExYXFkdHQzaHphODF6Y3Rlb2JnMTYybzlsaHVibG8zZXNpYjAybWc4NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Wt0zLr2PkDbDkfQOSo/giphy.gif" alt="TripGem" className="tripgem-logo w-20 h-20 sm:w-32 sm:h-32" />
          <span className="font-display font-extrabold text-4xl sm:text-7xl lg:text-8xl tracking-tight leading-none">
            <span className="tripgem-text-trip">Trip</span><span className="tripgem-text-gem">Gem</span>
          </span>
    </div>
    <div className="hero-badge mx-auto">
              <span className="dot" />
              {stats.total} substances indexed
            </div>
            <h1 className="text-4xl sm:text-7xl lg:text-8xl font-display font-extrabold leading-[1.05] tracking-tight gradient-text">
              Evidence-Based<br />Harm Reduction
            </h1>
            <p className="text-base sm:text-xl text-[var(--text3)] max-w-xl mx-auto leading-relaxed"
               style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both' }}>
              Comprehensive database with interaction checking, combination risk matrix, and dosage guides.
            </p>
            <div className="disclaimer-box max-w-lg mx-auto mt-3"
                 style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both' }}>
              Educational resource only. Not medical advice. Always consult healthcare professionals.
            </div>
          </header>
        </div>

        <section className="section-card" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both', contain: 'none' }}>
          <StatsBar stats={stats} categories={categories} />
        </section>

        <div style={{ display: 'grid' }}>
          {FEATURES.map(feature => {
            const isActive = feature.key === activeSection
            const FeatureComponent = feature.component
            return (
              <section
                key={feature.key}
                className="section-card"
                style={{
                  gridRow: 1,
                  gridColumn: 1,
                  display: isActive ? 'block' : 'none',
                  contain: 'none',
                }}
              >
                <FeatureComponent
                  {...(sectionProps[feature.key as Section] ?? {})}
                />
              </section>
            )
          })}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] sm:hidden"
        style={{
          background: 'rgba(4, 4, 12, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center justify-around h-16">
          {FEATURES.map(feature => (
            <button
              key={feature.key}
              onClick={() => handleSectionChange(feature.key as Section)}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-300 relative ${
                activeSection === feature.key
                  ? 'text-[var(--neon-magenta)] [text-shadow:0_0_12px_var(--neon-magenta)]'
                  : 'text-[var(--text3)]'
              }`}
              aria-current={activeSection === feature.key ? 'page' as const : undefined}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
              </svg>
              <span className="text-xs font-medium">{feature.label}</span>
            </button>
          ))}

      <button
        onClick={() => { playClick(); toggleSettings() }}
        className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-300 text-[var(--text3)] hover:text-[var(--accent2)]"
            aria-label="Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </nav>

<footer className="w-full text-center py-12 sm:py-24 border-t border-[var(--border)] relative mt-8 mb-16 sm:mb-0">
  <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-[rgba(168,85,247,0.2)] to-transparent" />
  <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-[rgba(168,85,247,0.15)] to-transparent" />
  <p className="text-xs text-[var(--text3)] max-w-md mx-auto leading-relaxed">
          Open-source harm reduction resource for educational purposes.
        </p>
        <p className="text-[10px] text-[var(--text4)] mt-3 font-mono">
          Data: <a href="https://psychonautwiki.org" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text2)] transition-colors">PsychonautWiki</a>
          {' · '}<a href="https://tripsit.me" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text2)] transition-colors">TripSit</a>
          {' · '}Erowid · WHO
        </p>
        <p className="text-[10px] text-[var(--text5)] mt-2 font-mono">
          <a href="https://github.com/oxygas/DrugVault" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text3)] transition-colors">Source</a>
          {' · '}© {new Date().getFullYear()} · MIT
        </p>
      </footer>

      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {mounted && <OnboardingModal />}

      <UserSettings />

      <ThemeSelector />

      <ScoreBreakdownPopup substances={substances} />

      {popupSubstance && (
        <SubstancePopup
          substance={popupSubstance}
          comboMatrix={comboMatrix}
  onClose={closePopup}
  onNavigate={openPopup}
          allSubstances={substances}
        />
      )}

      {/* Keyboard shortcuts hint */}
      {!isTouch && (
        <button
          onClick={() => setShowShortcuts(true)}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-[var(--accent)]/10 backdrop-blur-sm border border-[var(--border)] flex items-center justify-center hover:bg-[var(--accent)]/20 transition-all duration-300 hover:scale-110 group"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          <svg className="w-5 h-5 text-[var(--accent2)] group-hover:text-[var(--accent)] transition-colors" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18m-7.5 6.75l-1.591 1.591M12 13.875l1.591-1.591M7.5 10.5H6.375m4.284-5.674l-1.59-1.59m-3.36 5.844l1.59 1.59" />
          </svg>
        </button>
      )}
    </div>
  )
}