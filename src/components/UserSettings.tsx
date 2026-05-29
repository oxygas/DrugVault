'use client'

import { useState } from 'react'
import { useSettingsStore } from '@/stores/settings'
import type { UserLevel } from '@/lib/types'

const USER_LEVEL_INFO: Record<UserLevel, { label: string; description: string; color: string }> = {
  new: {
    label: 'New',
    description: 'Little to no tolerance, lower starting doses recommended',
    color: '#10b981',
  },
  common: {
    label: 'Common',
    description: 'Moderate tolerance with regular use',
    color: '#f59e0b',
  },
  heavy: {
    label: 'Heavy',
    description: 'Significant tolerance, higher doses may be needed',
    color: '#ef4444',
  },
}

export default function UserSettings() {
  const {
  bodyWeight,
  weightUnit,
  userLevel,
  settingsOpen,
  uiSounds,
  setBodyWeight,
  setWeightUnit,
  setUserLevel,
  setSettingsOpen,
  setOnboarded,
  setUISounds,
  } = useSettingsStore()

  const [weightInput, setWeightInput] = useState(String(bodyWeight))

  if (!settingsOpen) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.6)', animation: 'fadeIn 0.2s ease-out' }}
      onClick={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false) }}
      role="dialog"
      aria-modal="true"
      aria-label="User settings"
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden border border-[var(--border)]"
        style={{
          background: 'rgba(8,8,24,0.97)',
          backdropFilter: 'blur(20px)',
          animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
          maxHeight: '90dvh',
        }}
      >
        <div className="p-5 sm:p-6 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-[var(--accent2)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-lg font-display font-bold text-white">User Settings</h2>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[var(--text4)] hover:text-white"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[70dvh]">
          {/* Body Weight */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-mono text-[var(--text4)] uppercase tracking-[0.15em]">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
              Body Weight
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

          {/* User Experience Level */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-mono text-[var(--text4)] uppercase tracking-[0.15em]">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              Experience Level
            </label>
            <div className="flex flex-col gap-2">
              {(Object.entries(USER_LEVEL_INFO) as [UserLevel, typeof USER_LEVEL_INFO['new']][]).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setUserLevel(key)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    userLevel === key
                      ? 'border-[rgba(168,85,247,0.4)] bg-[rgba(168,85,247,0.08)]'
                      : 'border-[var(--border)] hover:border-[var(--border2)] bg-[rgba(255,255,255,0.02)]'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: info.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{info.label}</div>
                    <div className="text-xs text-[var(--text4)] mt-0.5">{info.description}</div>
                  </div>
                  {userLevel === key && (
                    <svg className="w-4 h-4 text-[var(--accent2)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
                  </div>

          {/* UI Sounds */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-mono text-[var(--text4)] uppercase tracking-[0.15em]">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              UI Sounds
            </label>
            <button
              onClick={() => setUISounds(!uiSounds)}
              className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all text-left ${
                uiSounds
                  ? 'border-[rgba(6,182,212,0.4)] bg-[rgba(6,182,212,0.08)]'
                  : 'border-[var(--border)] hover:border-[var(--border2)] bg-[rgba(255,255,255,0.02)]'
              }`}
            >
              <span className={`w-3 h-3 rounded-full flex-shrink-0`} style={{ background: uiSounds ? '#06b6d4' : '#475569' }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{uiSounds ? 'On' : 'Off'}</div>
                <div className="text-xs text-[var(--text4)] mt-0.5">Retro synth click & interaction sounds</div>
              </div>
              {uiSounds && (
                <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
          </div>

          <div className="rounded-xl p-4 border border-[var(--border)] bg-[rgba(255,255,255,0.02)] space-y-3">
            <p className="text-xs text-[var(--text4)] leading-relaxed">
              Your settings are saved locally and used to personalize dosage recommendations.
              Body weight helps calculate mg/kg ratios. Experience level adjusts suggested starting doses and risk warnings.
            </p>
            <button
              onClick={() => { setOnboarded(false); setSettingsOpen(false) }}
              className="text-[11px] font-mono text-[var(--text4)] hover:text-[var(--accent2)] transition-colors underline underline-offset-2 decoration-dotted"
            >
              Show welcome guide again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
