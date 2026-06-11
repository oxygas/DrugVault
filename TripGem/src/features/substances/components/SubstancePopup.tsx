'use client'

import { useState, useRef, useEffect, Suspense, lazy, useMemo } from 'react'
import Image from 'next/image'
import { Skull } from 'lucide-react'
import type { Substance, Category, ComboLevel } from '@/lib/types'
import { CATEGORY_COLORS, HARM_LEVEL_COLORS, COMBO_LEVEL_COLORS, COMBO_LEVEL_LABELS, COMBO_DESCRIPTIONS } from '@/lib/types'
import { playClick, playFavorite, playPopupTab } from '@/lib/ui-sounds'
import { useDevice } from '@/lib/device'
import RadarChart from '@/components/RadarChart'
import DurationTimeline from '@/components/DurationTimeline'
import DosageTable from '@/components/DosageTable'
import ToleranceSection from '@/components/ToleranceSection'
import EffectsTabContent from '@/components/EffectsTabContent'
import LegalStatusTabContent from '@/components/LegalStatusTabContent'
import ScoreBadges from '@/components/ScoreBadges'
import HarmReductionCard from '@/components/HarmReductionCard'
import CategoryHarmReduction from '@/components/CategoryHarmReduction'
import { useUIStore } from '@/stores/ui'

const SubjectiveEffectsModal = lazy(() => import('@/components/SubjectiveEffectsModal'))

function speakSubstanceName(name: string) {
  if (typeof window === 'undefined') return
  const prev = document.querySelector('.tripgem-tts-audio')
  if (prev) prev.remove()
  const audio = document.createElement('audio')
  audio.className = 'tripgem-tts-audio'
  audio.style.display = 'none'
  audio.volume = 0.8
  audio.src = `/api/tts?text=${encodeURIComponent(name)}`
  document.body.appendChild(audio)
  audio.play().catch(() => audio.remove())
  audio.onended = () => audio.remove()
}

function hexToHsl(hex: string): { h: number; s: number; h2?: number; l: number } {
  hex = hex.replace(/^#/, '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

function getShiftingGradient(hexColor: string): string {
  const hsl = hexToHsl(hexColor)
  const h = hsl.h
  // Ensure the base saturation and lightness are vibrant and readable
  const baseS = Math.max(hsl.s, 80)
  const baseL = Math.max(55, Math.min(hsl.l, 70))

  // Shift only slightly around the base color to create a shimmering effect 
  // using shades/tones of the theme color, never escaping to other colors.
  const c0 = `hsl(${(h - 10 + 360) % 360}, ${baseS}%, ${baseL}%)`
  const c1 = `hsl(${h}, ${baseS - 12}%, ${baseL + 15}%)`
  const c2 = `hsl(${(h + 10) % 360}, ${baseS}%, ${baseL + 5}%)`
  const c3 = `hsl(${h}, ${baseS - 15}%, ${baseL + 20}%)`

  // 1000% wide looping gradient with duplicated stops for a seamless transition
  return `linear-gradient(90deg, ${c0}, ${c1}, ${c2}, ${c3}, ${c0}, ${c1}, ${c2}, ${c3}, ${c0})`
}


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
  isOpen: boolean
  comboMatrix: Record<string, ComboLevel>
  onClose: () => void
  onNavigate: (substance: Substance) => void
  allSubstances: Substance[]
  setStatModal?: (label: string) => void
}

type Tab = 'overview' | 'effects' | 'risks' | 'dosage' | 'tolerance' | 'interactions' | 'legal'

export default function SubstancePopup({ substance: initialSubstance, isOpen, comboMatrix, onClose, onNavigate, allSubstances, setStatModal }: SubstancePopupProps) {
  const [tab, setTab] = useState<Tab>('overview')
  const [animKey, setAnimKey] = useState(0)
  const [effectsModalOpen, setEffectsModalOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const touchStartXRef = useRef<number | null>(null)
  const onCloseRef = useRef(onClose)
  const [isFav, setIsFav] = useState(() => initialSubstance ? getFavorites().includes(initialSubstance.name) : false)
  const [favPulse, setFavPulse] = useState(0)

  const pullStartYRef = useRef<number | null>(null)
  const [pullOffset, setPullOffset] = useState(0)
  const pullOffsetRef = useRef(0)
  const isPullingRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  const { isMobile } = useDevice()

  const [prevName, setPrevName] = useState(initialSubstance?.name ?? '')
  const [detailedSubstance, setDetailedSubstance] = useState<Substance | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(true)

  const [comboSubstanceName, setComboSubstanceName] = useState<string>('')
  const [comboDropdownOpen, setComboDropdownOpen] = useState(false)
  
  const selectedComboSub = useMemo(() => 
    allSubstances.find(s => s.name === comboSubstanceName)
  , [comboSubstanceName, allSubstances])

  const comboLevel = useMemo(() => {
    if (!selectedComboSub || !initialSubstance) return null
    return comboMatrix[`${initialSubstance.category}+${selectedComboSub.category}`] || comboMatrix[`${selectedComboSub.category}+${initialSubstance.category}`] || 'caution'
  }, [selectedComboSub, initialSubstance, comboMatrix])

  const filteredComboSubs = useMemo(() =>
    initialSubstance
      ? allSubstances
          .filter(s => s.name !== initialSubstance.name && s.name.toLowerCase().includes(comboSubstanceName.toLowerCase()))
          .slice(0, 30)
      : []
  , [comboSubstanceName, initialSubstance, allSubstances])

  if (initialSubstance && initialSubstance.name !== prevName) {
    setPrevName(initialSubstance.name)
    setDetailedSubstance(null)
    setLoadingDetails(true)
    setTab('overview')
    setAnimKey(k => k + 1)
  }

  useEffect(() => {
    if (!initialSubstance) return
    const slug = initialSubstance.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    let active = true

    fetch(`/api/substances/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (active) {
          setDetailedSubstance(data)
          setLoadingDetails(false)
        }
      })
      .catch(() => {
        if (active) {
          setLoadingDetails(false)
        }
      })

    return () => { active = false }
  }, [initialSubstance, initialSubstance?.name])

  const substance = detailedSubstance || initialSubstance || { name: '', category: '', harmLevel: 'low' as const }

  const catColor = CATEGORY_COLORS[substance.category]
  const harmColor = HARM_LEVEL_COLORS[substance.harmLevel]
  const sanityImageUrl = substance.chemicalStructure?.asset?.url || null
  const structureAlt = substance.chemicalStructure?.alt || `${substance.name} chemical structure`
  const hasEffects = substance.subjectiveEffects && (
    (substance.subjectiveEffects.allEffects?.length || 0) > 0 ||
    (substance.subjectiveEffects.mostLoved?.length || 0) > 0 ||
    (substance.subjectiveEffects.riskyEffects?.length || 0) > 0 ||
    (substance.subjectiveEffects.timeline?.length || 0) > 0 ||
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
    // We intentionally do NOT autofocus the first element on mount anymore.
    // Calling .focus() while the popup is animating in (slideUp) forces mobile
    // browsers to instantly scroll the underlying window to bring the off-screen
    // element into view, causing the jarring jump-to-top bug.
  }, [])

  useEffect(() => {
    const popup = popupRef.current
    if (!popup) return
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = popup.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus({ preventScroll: true }) }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus({ preventScroll: true }) }
    }
    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [])

  const handleTabTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
  }
  const handleTabTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartXRef.current
    touchStartXRef.current = null
    if (Math.abs(diff) < 50) return
    setTab(prev => {
      const idx = tabKeys.indexOf(prev)
      if (diff < 0 && idx < tabKeys.length - 1) return tabKeys[idx + 1]
      if (diff > 0 && idx > 0) return tabKeys[idx - 1]
      return prev
    })
    setAnimKey(k => k + 1)
  }

  // Scroll lock — prevents background from scrolling when popup is open
  // We use event listeners instead of body overflow:hidden because overflow:hidden causes
  // VirtuosoGrid to lose its height and scroll to the top of the page.
  // NOTE: touchmove is registered with { passive: false } only when strictly needed.
  // We pre-detect outside-popup touches in touchstart, then only call preventDefault
  // for touchmove events that originated outside the popup — this avoids blocking
  // native scroll optimisation for the vast majority of touches inside the popup.
  useEffect(() => {
    if (!isOpen) return

    let touchOutsidePopup = false

    const handleTouchStart = (e: TouchEvent) => {
      const popup = popupRef.current
      touchOutsidePopup = !!(popup && !popup.contains(e.target as Node))
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchOutsidePopup) {
        e.preventDefault()
      }
    }

    const handleWheel = (e: WheelEvent) => {
      const popup = popupRef.current
      if (popup && popup.contains(e.target as Node)) return
      e.preventDefault()
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [isOpen])

  const relatedSubs = useMemo(() =>
    initialSubstance
      ? allSubstances
          .filter(s => s.category === initialSubstance.category && s.name !== initialSubstance.name)
          .slice(0, 4)
      : []
  , [initialSubstance, allSubstances])

  // Return nothing when closed — component stays mounted to avoid remount cost
  // Must be after all hooks to satisfy Rules of Hooks
  if (!isOpen) return null

  // Pull-to-dismiss gesture — uses refs to avoid stale closure issues
  const handlePullStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    // Don't trigger pull-to-dismiss on tab buttons or the tablist
    if (target.closest('[role="tab"]') || target.closest('[role="tablist"]')) return
    // Only allow pull-to-dismiss if the scrollable area is at the top
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
      onClose()
    } else {
      setPullOffset(0)
    }
  }

  const handleFavorite = () => {
    playFavorite()
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

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center backdrop-blur-sm"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.08) 0%, rgba(236,72,153,0.04) 30%, rgba(0,0,0,0.65) 70%)' } as React.CSSProperties}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`${substance.name} details`}
    >
      <div
        ref={popupRef}
        className={`border border-[var(--border)] w-full flex flex-col${isMobile ? ' h-[100dvh]' : ' neon-popup-glow h-[92dvh] sm:h-[85dvh] sm:rounded-lg rounded-t-lg'}`}
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${catColor} 25%, var(--bg)) 0%, color-mix(in srgb, ${catColor} 5%, var(--bg)) 25%, var(--bg) 100%)`,
          overflow: 'clip',
          ...(!isMobile ? {
            maxWidth: 'min(1100px,96vw)',
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
        <div className="popup-header sticky top-0 z-10 p-3 sm:p-5 lg:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-1.5 h-6 lg:h-7 rounded-full" style={{ background: catColor, boxShadow: `0 0 12px ${catColor}40` }} />
                <div style={{ filter: `drop-shadow(0 0 8px ${catColor}66)` }}>
                  <h2
                    className="text-xl sm:text-2xl lg:text-3xl font-display font-bold truncate substance-title-dynamic"
                    style={{
                      backgroundImage: getShiftingGradient(catColor),
                    }}
                  >
                    {substance.name}
                  </h2>
                </div>
                {substance.harmLevel === 'extreme' && (
                  <button 
                    onClick={() => { playClick(); setStatModal?.('Extreme Danger') }}
                    className="group relative flex-shrink-0"
                    title="Extreme Harm Risk - Click for details"
                  >
                    <Skull className="w-6 h-6 sm:w-7 sm:h-7 skull-icon transition-transform group-hover:scale-110" />
                  </button>
                )}

                <button
                  onClick={() => speakSubstanceName(substance.name)}
                  className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors flex-shrink-0 text-[var(--text4)] hover:text-[var(--cyan)]"
                  aria-label={`Pronounce ${substance.name}`}
                  title="Listen to pronunciation"
                >
                  <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                </button>
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
          {(substance.aliases?.length || 0) > 0 && (
            <div className="hidden sm:flex sm:flex-wrap gap-1 mt-2 ml-4">
              {(substance.aliases || []).map(a => (
                <span key={a} className="text-[11px] lg:text-xs px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.04)] text-[var(--text4)] font-mono border border-[var(--border)]">
                  {a}
                </span>
              ))}
              {(substance.brandNames || []).map(b => (
                <span key={b} className="text-[11px] lg:text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 font-mono border border-blue-500/20">🏥 {b}</span>
              ))}
              {(substance.streetNames || []).map(s => (
                <span key={s} className="text-[11px] lg:text-xs px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.03)] text-[var(--text4)] font-mono border border-[var(--border)]">⚡ {s}</span>
              ))}
            </div>
          )}
        </div>
          <div className="flex items-center gap-1">

            <button
              onClick={() => {
                const { setMatrixCategory, setActiveSection } = useUIStore.getState()
                setMatrixCategory(substance.category)
                setActiveSection('matrix')
                onClose()
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-display font-semibold transition-all hover:bg-[rgba(255,255,255,0.06)]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text3)',
                border: '1px solid var(--border)',
              }}
              title="Compare in Matrix"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="hidden sm:inline">Compare</span>
            </button>
            <button
              onClick={handleFavorite}
              className="p-3 -m-1 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors flex-shrink-0"
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg key={favPulse} className="w-5 h-5 heart-svg" fill={isFav ? 'var(--red)' : 'none'} stroke={isFav ? 'var(--red)' : 'currentColor'} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-3 -m-1 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[var(--text4)] hover:text-white flex-shrink-0"
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
            className="flex gap-1 mt-3 mx-0 p-1.5 overflow-x-auto popup-tab-bar rounded-[20px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-2xl"
            style={{ scrollbarWidth: 'none' }}
          >
            {tabKeys.map(key => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={(e) => { e.stopPropagation(); playPopupTab(key); setTab(key); setAnimKey(k => k + 1) }}
                className={`tab-btn flex-shrink-0 ${tab === key ? 'active' : ''}`}
                ref={el => {
                  if (el && tab === key) {
                    // Scroll active tab into view without scrolling the entire window
                    setTimeout(() => {
                      const container = el.parentElement;
                      if (container) {
                        const scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
                        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                      }
                    }, 0)
                  }
                }}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>

        </div>

        <div className="popup-scroll-area flex-1 overflow-y-auto overscroll-contain min-h-0 substance-popup-scroll p-4 sm:p-6 lg:p-8">
          <div key={`${tab}-${animKey}`} className="space-y-5 lg:space-y-6" style={{ animation: 'fadeIn 0.15s ease-out' }}>
          {tab === 'overview' && (
            <>
              <ScoreBadges substance={substance} className="mb-2" />
              <HarmReductionCard substance={substance} />
              <CategoryHarmReduction category={substance.category} />
              
              <div className="glass rounded-xl p-4 sm:p-5 border border-[var(--border2)] relative group mb-5">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--border)] to-transparent opacity-10 pointer-events-none rounded-xl" />
                <h4 className="text-base sm:text-lg font-bold font-display text-[var(--text)] mb-3 flex items-center gap-2 relative z-10">
                  <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Quick Combo Checker
                </h4>
                <div className="flex flex-col gap-3">
                    <div className="w-full relative">
                      <input
                        type="text"
                        inputMode="search"
                        autoComplete="off"
                        placeholder="Search substance to mix..."
                        className={`w-full bg-[var(--bg2)] text-[var(--text)] text-base sm:text-sm font-semibold font-display border border-[var(--border3)] py-2.5 px-3 pr-10 focus:outline-none focus:border-[var(--accent)] transition-all ${comboDropdownOpen ? 'rounded-t-lg rounded-b-none border-b-0 border-[var(--accent)]' : 'rounded-lg'}`}
                        value={comboSubstanceName}
                        onChange={(e) => { setComboSubstanceName(e.target.value); setComboDropdownOpen(true) }}
                        onFocus={() => setComboDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setComboDropdownOpen(false), 150)}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text4)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    {comboDropdownOpen && (
                        <div className="-mt-3 max-h-[200px] overflow-y-auto substance-popup-scroll bg-[var(--bg2)] border border-[var(--accent)] border-t-0 rounded-b-lg">
                          {filteredComboSubs.length > 0 ? filteredComboSubs.map(s => (
                            <button
                              key={s.name}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setComboSubstanceName(s.name)
                                setComboDropdownOpen(false)
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--surface-hover)] active:bg-[var(--border)] transition-colors border-t border-[var(--border)] first:border-t-0"
                            >
                              <div className="font-semibold text-[var(--text)]">{s.name}</div>
                              <div className="text-[10px] text-[var(--text4)] uppercase tracking-wider">{s.category}</div>
                            </button>
                          )) : (
                            <div className="p-4 text-center text-sm text-[var(--text4)]">No substances found.</div>
                          )}
                        </div>
                      )}
                </div>

                {selectedComboSub && comboLevel && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: COMBO_LEVEL_COLORS[comboLevel], backgroundColor: COMBO_LEVEL_COLORS[comboLevel] }} />
                        <span className="text-base sm:text-lg font-bold font-mono tracking-tight" style={{ color: COMBO_LEVEL_COLORS[comboLevel] }}>
                          {COMBO_LEVEL_LABELS[comboLevel]}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text2)] leading-relaxed bg-[var(--bg)]/50 p-3 rounded-lg border border-[var(--border)]">
                        <span className="font-semibold text-white">{substance.name}</span> + <span className="font-semibold text-white">{selectedComboSub.name}</span>: {COMBO_DESCRIPTIONS[comboLevel]}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                <RadarChart substance={substance} />
                <div className="space-y-4">
                  <DurationTimeline substance={substance} />
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text2)] mb-2 font-display">Chemical Structure</h4>
                    <div className="chemical-structure-container rounded-xl p-1 flex items-center justify-center relative">
                      <ChemicalStructureImage
                        substanceName={substance.name}
                        smiles={substance.smiles}
                        sanityUrl={sanityImageUrl}
                        alt={structureAlt}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {loadingDetails ? (
                <div className="info-card" style={{ '--info-c': catColor } as React.CSSProperties}>
                  <div className="h-4 w-24 skeleton-neon rounded mb-3" />
                  <div className="h-3 w-full skeleton-neon rounded mb-2" />
                  <div className="h-3 w-5/6 skeleton-neon rounded" />
                </div>
              ) : substance.pwSummary ? (
                <div className="info-card" style={{ '--info-c': catColor } as React.CSSProperties}>
                  <h4 className="text-sm font-semibold mb-2 font-display text-[var(--text2)]">Summary</h4>
                  <p className="text-sm text-[var(--text3)] leading-relaxed">{substance.pwSummary}</p>
                </div>
              ) : null}
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
            loadingDetails ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="info-card" style={{ '--info-c': 'rgba(255,255,255,0.05)' } as React.CSSProperties}>
                    <div className="h-4 w-32 skeleton-neon rounded mb-4" />
                    <div className="h-3 w-full skeleton-neon rounded mb-2" />
                    <div className="h-3 w-5/6 skeleton-neon rounded mb-2" />
                    <div className="h-3 w-4/5 skeleton-neon rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <InfoList title="Risks" items={substance.risks || []} color="var(--orange)" icon="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                <InfoList title="Overdose Signs" items={substance.overdose || []} color="var(--red)" icon="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                <InfoList title="Safety Tips" items={substance.safety || []} color="var(--green)" icon="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                <InfoList title="Withdrawal Symptoms" items={substance.withdrawal || []} color="var(--yellow)" icon="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
                <InfoList title="Recovery Options" items={substance.recovery || []} color="var(--cyan)" icon="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </div>
            )
          )}

          {tab === 'effects' && (
            loadingDetails ? (
              <div className="space-y-4">
                <div className="info-card" style={{ '--info-c': catColor } as React.CSSProperties}>
                  <div className="h-4 w-40 skeleton-neon rounded mb-4" />
                  <div className="h-3 w-full skeleton-neon rounded mb-2" />
                  <div className="h-3 w-11/12 skeleton-neon rounded mb-2" />
                </div>
              </div>
            ) : (
              <EffectsTabContent
                substance={substance}
                catColor={catColor}
                onOpenFullReport={() => setEffectsModalOpen(true)}
              />
            )
          )}

          {tab === 'dosage' && (
            loadingDetails ? (
              <div className="info-card" style={{ '--info-c': catColor } as React.CSSProperties}>
                <div className="h-5 w-36 skeleton-neon rounded mb-4" />
                <div className="space-y-3">
                  <div className="h-10 w-full skeleton-neon rounded" />
                  <div className="h-10 w-full skeleton-neon rounded" />
                  <div className="h-10 w-full skeleton-neon rounded" />
                </div>
              </div>
            ) : (
              <DosageTable substance={substance} />
            )
          )}

          {tab === 'tolerance' && (
            loadingDetails ? (
              <div className="info-card" style={{ '--info-c': catColor } as React.CSSProperties}>
                <div className="h-5 w-32 skeleton-neon rounded mb-4" />
                <div className="h-3 w-full skeleton-neon rounded mb-2" />
                <div className="h-3 w-4/5 skeleton-neon rounded" />
              </div>
            ) : (
              <ToleranceSection substance={substance} />
            )
          )}

          {tab === 'legal' && (
            loadingDetails ? (
              <div className="info-card" style={{ '--info-c': catColor } as React.CSSProperties}>
                <div className="h-5 w-32 skeleton-neon rounded mb-4" />
                <div className="h-3 w-full skeleton-neon rounded mb-2" />
                <div className="h-3 w-4/5 skeleton-neon rounded" />
              </div>
            ) : (
              <LegalStatusTabContent substance={substance} catColor={catColor} />
            )
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
              {loadingDetails ? (
                <div className="info-card" style={{ '--info-c': 'var(--orange)' } as React.CSSProperties}>
                  <div className="h-4 w-36 skeleton-neon rounded mb-3" />
                  <div className="h-3 w-full skeleton-neon rounded mb-2" />
                  <div className="h-3 w-4/5 skeleton-neon rounded" />
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}
          </div>
        </div>

        {effectsModalOpen && (
          <Suspense fallback={<div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>}>
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
  width?: number
  height?: number
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(sanityUrl)
  const [source, setSource] = useState<'sanity' | 'pubchem' | 'cactus' | null>(sanityUrl ? 'sanity' : null)
  const [loading, setLoading] = useState(!sanityUrl)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (sanityUrl) {
      return
    }

    let cancelled = false

    async function fetchStructure() {
      setLoading(true)
      setError(false)

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

        if (!cancelled) {
          if (data.imageUrl) {
            setImageUrl(data.imageUrl)
            setSource(data.source)
          } else {
            setError(true)
          }
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
    return <Image src={imageUrl} alt={alt} width={width || 400} height={height || 267} sizes="(max-width: 768px) 100vw, 400px" className="w-auto h-auto max-w-full max-h-64 object-contain" onError={() => setError(true)} />
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-auto h-auto max-w-full max-h-64"
      loading="lazy"
      onLoad={() => setLoading(false)}
      onError={() => {
        if (source === 'pubchem' && smiles) {
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
