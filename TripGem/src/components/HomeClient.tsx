'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import type { Substance, Category, ComboLevel, CategoryMeta, SubstanceCombo } from '@/lib/types'
import { FEATURES, type FeatureConfig } from '@/features/registry'
import StatsBar from '@/components/StatsBar'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'
import { useUIStore } from '@/stores/ui'
import { useGemBotStore } from '@/stores/gembot'
import { playClick, playOpen, playClose, playToggle, playSectionChange, playSearch, hydrateUIsounds, setUIsoundsEnabled } from '@/lib/ui-sounds'

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

const StatDetailModal = dynamic(() => import('@/components/StatDetailModal'), {
  ssr: false,
  loading: () => null
})

type Section = 'substances' | 'matrix' | 'tools'

const FETCH_FIELDS = [
  'name','category','harmScore','harmLevel','aliases',
  'addictionScore','odRisk','withdrawalSeverity',
  'dependenceLiability','interactionDanger','smiles',
  'subjectiveEffects','popularityRank'
].join(',')

interface HomeClientProps {
  stats: {
    total: number
    categories: number
    extremeCount: number
    highHarmCount: number
    highAddictionCount: number
    highOdRiskCount: number
    totalCombos: number
    dangerousCombos: number
    safeCombos: number
  }
  categories: CategoryMeta[]
  comboMatrix: Record<string, ComboLevel>
  substanceCombos?: SubstanceCombo[]
}

export default function HomeClient({ stats, categories, comboMatrix, substanceCombos }: HomeClientProps) {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [popupSubstance, setPopupSubstance] = useState<Substance | null>(null)
  const [activeStatModal, setActiveStatModal] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<Section>('substances')
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const isTouchRef = useRef(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const { data: substances = [] } = useQuery({
    queryKey: ['substances'],
    queryFn: async () => {
      const res = await fetch(`/api/substances?fields=${FETCH_FIELDS}&limit=634`)
      const json = await res.json()
      const sorted = [...(json.substances || [])].sort((a: Substance, b: Substance) => {
        const rankA = (a as unknown as Record<string, number>).popularityRank ?? 999
        const rankB = (b as unknown as Record<string, number>).popularityRank ?? 999
        return rankA - rankB
      })
      return sorted
    },
    staleTime: 300_000,
    gcTime: 600_000,
  })

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const popupRef = useRef(popupSubstance)
  const bodyWeight = useSettingsStore(s => s.bodyWeight)
  const weightUnit = useSettingsStore(s => s.weightUnit)
  const userLevel = useSettingsStore(s => s.userLevel)
  const uiSounds = useSettingsStore(s => s.uiSounds)
  const toggleSettings = useSettingsStore(s => s.toggleSettings)
  const settingsOpen = useSettingsStore(s => s.settingsOpen)
  const loFiMode = useSettingsStore(s => s.loFiMode)
  const hydrateSettings = useSettingsStore(s => s.hydrate)
  const toggleTheme = useThemeStore(s => s.toggleTheme)
  const themeOpen = useThemeStore(s => s.themeOpen)
  const hydrateTheme = useThemeStore(s => s.hydrate)
  const scoreBreakdownOpen = useUIStore(s => s.scoreBreakdown.isOpen)
  const gemBotOpen = useGemBotStore(s => s.isOpen)
  const toggleGemBot = useGemBotStore(s => s.toggle)


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
    if (loFiMode) {
      document.documentElement.classList.add('lo-fi-mode')
    } else {
      document.documentElement.classList.remove('lo-fi-mode')
    }
  }, [loFiMode])

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

  const handleStatClick = useCallback((label: string) => {
    playClick()
    setActiveStatModal(label)
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

  const onCategoryClear = useCallback(() => setSelectedCategories([]), [])

  const sectionProps = useMemo((): Record<Section, Record<string, unknown>> => ({
    substances: {
      substances,
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
  }), [substances, selectedCategories, toggleCategory, onCategoryClear, openPopup, comboMatrix, substanceCombos, findSubstance])

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
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[var(--text4)] hover:text-[var(--accent2)] group"
            aria-label="User settings"
            title="User settings (Alt+S)"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium border-r border-[var(--border)] pr-2.5 mr-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
              {mounted ? <>
                <span>{bodyWeight}{weightUnit}</span>
                <span style={{ color: userLevel === 'new' ? '#10b981' : userLevel === 'common' ? '#f59e0b' : '#ef4444' }}>·</span>
                <span className="hidden sm:inline">{userLevelLabel}</span>
              </> : <span className="h-3 w-16" />}
            </div>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          </div>
      </nav>

      {/* Mobile Top Bar */}
      <nav className={`sticky top-0 z-50 border-b border-[var(--border)] sm:hidden nav-bar-mobile ${scrolled ? 'scrolled' : ''}`}
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          background: scrolled ? 'rgba(10, 4, 24, 0.8)' : 'transparent',
        }}
      >
        <div className="w-full px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/tripgem-icon.png" alt="TripGem" className="w-7 h-7 rounded" />
            <span className="font-display font-extrabold text-lg tracking-tight">
              <span className="tripgem-text-trip">Trip</span><span className="tripgem-text-gem">Gem</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { playToggle(); toggleTheme() }}
              className="p-2 rounded-lg text-[var(--text3)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors"
              aria-label="Theme Selector"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
            </button>
            <button
              onClick={() => { playClick(); toggleSettings() }}
              className="p-2 rounded-lg text-[var(--text3)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors"
              aria-label="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="w-full px-4 sm:px-8 py-0 sm:py-0 space-y-6 sm:space-y-10 flex-1">
        <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 bg-[var(--bg2)] border-b border-[var(--border)]">
  <header className="text-center py-8 sm:py-14 lg:py-18 relative">
    <div className="hero-glow" />
    <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6">
          <img src="/tripgem-logo-animated.gif" alt="TripGem" fetchPriority="high" className="hidden sm:block tripgem-logo w-20 h-20 sm:w-32 sm:h-32" />
          <img src="/tripgem-logo.png" alt="TripGem" fetchPriority="high" className="block sm:hidden tripgem-logo w-20 h-20" />
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

        <section className="section-card w-full min-w-0" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both', contain: 'none' }}>
          <StatsBar stats={stats} categories={categories} onStatClick={handleStatClick} />
        </section>

        <div className="w-full min-w-0">
          {FEATURES.map(feature => {
            const isActive = feature.key === activeSection
            if (!isActive) return null
            const FeatureComponent = feature.component
            return (
              <section
                key={feature.key}
                className="section-card w-full min-w-0"
                style={{ contain: 'none' }}
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
        style={{
          background: 'rgba(0, 0, 0, 0.92)',
          backdropFilter: 'blur(16px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[rgba(var(--accent-rgb),0.15)] to-transparent" />
        <div className="flex items-center justify-around h-16">
          {FEATURES.map(feature => {
            const isActive = activeSection === feature.key
            return (
              <button
                key={feature.key}
                onClick={() => handleSectionChange(feature.key as Section)}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? 'text-[var(--neon-magenta)]'
                    : 'text-[var(--text4)] active:text-[var(--text2)]'
                }`}
                aria-current={isActive ? 'page' as const : undefined}
              >
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[var(--neon-magenta)] shadow-[0_0_8px_var(--neon-magenta)]" />
                )}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                </svg>
                <span className="text-[10px] font-medium tracking-wide">{feature.label}</span>
              </button>
            )
          })}
          <button
            onClick={() => { playToggle(); toggleGemBot() }}
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 relative ${
              gemBotOpen
                ? 'text-[var(--neon-magenta)]'
                : 'text-[var(--text4)] active:text-[var(--text2)]'
            }`}
            aria-label="GemBot Chat"
            aria-expanded={gemBotOpen}
          >
            {gemBotOpen && (
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[var(--neon-magenta)] shadow-[0_0_8px_var(--neon-magenta)]" />
            )}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.625.625 0 11-1.25 0 .625.625 0 011.25 0zm0 0H8.63m3.375 0a.625.625 0 11-1.25 0 .625.625 0 011.25 0zm0 0h.008m3.375 0a.625.625 0 11-1.25 0 .625.625 0 011.25 0zm0 0h.008m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l3.076-3.076c.49-.49 1.144-.764 1.83-.764h3.197c1.584 0 2.707-1.394 2.707-3.227V6.198c0-1.833-1.123-3.227-2.707-3.227H6.198c-1.584 0-2.707 1.394-2.707 3.227v7.352z" />
            </svg>
            <span className="text-[10px] font-medium tracking-wide">GemBot</span>
          </button>
        </div>
      </nav>

<footer className="w-full text-center py-12 sm:py-24 border-t border-[var(--border)] relative mt-8 mb-16 sm:mb-0">
  <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-[rgba(var(--accent-rgb),0.2)] to-transparent" />
  <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-[rgba(var(--accent-rgb),0.15)] to-transparent" />
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

      {scoreBreakdownOpen && <ScoreBreakdownPopup substances={substances} />}

      {popupSubstance && (
        <SubstancePopup
          substance={popupSubstance}
          comboMatrix={comboMatrix}
          onClose={closePopup}
          onNavigate={openPopup}
          allSubstances={substances}
          setStatModal={setActiveStatModal}
        />
      )}

      {activeStatModal && (
        <StatDetailModal
          label={activeStatModal}
          substances={substances}
          comboMatrix={comboMatrix}
          onClose={() => setActiveStatModal(null)}
          onNavigate={(substance) => {
            setActiveStatModal(null)
            openPopup(substance)
          }}
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