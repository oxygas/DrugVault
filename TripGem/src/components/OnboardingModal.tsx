'use client'

import { useState, useEffect, useRef } from 'react'
import { useSettingsStore } from '@/stores/settings'
import { USER_LEVEL_OPTIONS } from '@/lib/user-level'
import { setUIsoundsEnabled } from '@/lib/ui-sounds'

export default function OnboardingModal() {
  const {
    bodyWeight,
    weightUnit,
    userLevel,
    onboarded,
    uiSounds,
    loFiMode,
    setBodyWeight,
    setWeightUnit,
    setUserLevel,
    setOnboarded,
    setSettingsOpen,
    setUISounds,
    setLoFiMode,
  } = useSettingsStore()

  const handleToggleUISounds = () => {
    const next = !uiSounds
    setUIsoundsEnabled(next)
    setUISounds(next)
  }

  const handleToggleLoFiMode = () => {
    setLoFiMode(!loFiMode)
  }

  const [weightInput, setWeightInput] = useState(String(bodyWeight))
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (onboarded) return
    const handleScroll = (e: Event) => {
      if (e.cancelable) e.preventDefault()
    }
    window.addEventListener('wheel', handleScroll, { passive: false })
    window.addEventListener('touchmove', handleScroll, { passive: false })
    return () => {
      window.removeEventListener('wheel', handleScroll)
      window.removeEventListener('touchmove', handleScroll)
    }
  }, [onboarded])

  if (onboarded) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.7)', animation: 'fadeIn 0.3s ease-out' }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to TripGem"
    >
      <div
        ref={containerRef}
        className="w-full max-w-md rounded-2xl overflow-hidden border border-[var(--border)]"
        style={{
          background: 'rgba(8,8,24,0.98)',
          backdropFilter: 'blur(20px)',
          animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
          maxHeight: '90vh',
        }}
      >
        <div className="p-6 sm:p-8 text-center border-b border-[var(--border)]">
  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--accent2)] to-[var(--accent3)] flex items-center justify-center shadow-lg" style={{ boxShadow: '0 10px 15px -3px rgba(var(--accent-rgb), 0.2)' }}>
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  </div>
          <h2 className="text-xl font-display font-bold text-white mb-2">Welcome to TripGem</h2>
          <p className="text-sm text-[var(--text3)] leading-relaxed">
            Personalize your experience for accurate dosage recommendations.
            Your data stays on your device.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-mono text-[var(--text4)] uppercase tracking-[0.15em]">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
              Your Body Weight
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={weightInput}
                onChange={(e) => {
                  const raw = e.target.value
                  setWeightInput(raw)
                  const v = parseFloat(raw)
                  if (!isNaN(v) && v > 0 && v <= 500) setBodyWeight(v)
                }}
                className="flex-1 px-4 py-3 rounded-xl text-white placeholder:text-[var(--text4)] bg-[rgba(10,10,30,0.5)] border border-[var(--border2)] focus:outline-none focus:border-blue-500/50 text-base"
                placeholder="70"
              />
              <div className="flex rounded-xl overflow-hidden border border-[var(--border2)] bg-[rgba(10,10,30,0.5)]">
                <button
                  onClick={() => setWeightUnit('kg')}
                  className={`px-4 py-3 text-sm font-mono font-bold tracking-wider transition-all ${
                    weightUnit === 'kg' ? 'text-blue-400 bg-blue-500/10' : 'text-[var(--text4)] hover:text-white'
                  }`}
                >
                  KG
                </button>
                <button
                  onClick={() => setWeightUnit('lb')}
                  className={`px-4 py-3 text-sm font-mono font-bold tracking-wider transition-all ${
                    weightUnit === 'lb' ? 'text-blue-400 bg-blue-500/10' : 'text-[var(--text4)] hover:text-white'
                  }`}
                >
                  LB
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-mono text-[var(--text4)] uppercase tracking-[0.15em]">
              <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              Experience Level
            </label>
            <div className="flex flex-col gap-2">
              {USER_LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setUserLevel(opt.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    userLevel === opt.value
                      ? 'border-[rgba(var(--accent-rgb),0.4)] bg-[rgba(var(--accent-rgb),0.08)]'
                      : 'border-[var(--border)] hover:border-[var(--border2)] bg-[rgba(255,255,255,0.02)]'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: opt.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{opt.label}</div>
                    <div className="text-xs text-[var(--text4)] mt-0.5">{opt.description}</div>
                  </div>
                  {userLevel === opt.value && (
                    <svg className="w-4 h-4 text-[var(--accent2)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* UI Sounds toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] hover:border-[var(--border2)] transition-all">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--text4)] uppercase tracking-[0.15em] mb-1">
                <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
                UI Sounds
              </div>
              <div className="text-xs text-[var(--text4)] leading-normal">Retro synth click &amp; interaction sounds</div>
            </div>
            <button
              role="switch"
              aria-checked={uiSounds}
              onClick={handleToggleUISounds}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                uiSounds ? 'bg-[var(--accent2)] shadow-[0_0_8px_var(--accent2)]' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  uiSounds ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Solid State Mode toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] hover:border-[var(--border2)] transition-all">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--text4)] uppercase tracking-[0.15em] mb-1">
                <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Solid State Mode
              </div>
              <div className="text-xs text-[var(--text4)] leading-normal">Disables ambient orbs &amp; effects for max performance</div>
            </div>
            <button
              role="switch"
              aria-checked={loFiMode}
              onClick={handleToggleLoFiMode}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                loFiMode ? 'bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  loFiMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setOnboarded(true)}
              className="flex-1 px-5 py-3 rounded-xl text-sm font-semibold text-[var(--text4)] hover:text-white border border-[var(--border)] hover:border-[var(--border2)] transition-all"
            >
              Skip
            </button>
            <button
              onClick={() => {
                setOnboarded(true)
                setSettingsOpen(false)
              }}
              className="flex-1 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--accent2), var(--accent3))',
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
