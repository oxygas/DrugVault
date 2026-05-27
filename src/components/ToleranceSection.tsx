'use client'

import { useState } from 'react'
import type { Substance, UserLevel, Category } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/types'
import { useSettingsStore } from '@/stores/settings'

interface ToleranceSectionProps {
  substance: Substance
}

type Tab = 'new' | 'common' | 'heavy'

const USER_LEVEL_TOLERANCE: Record<Tab, { label: string; color: string; description: string; maxDose: string; breakDays: string; redoseNote: string; riskNote: string }> = {
  new: {
    label: 'New User',
    color: '#10b981',
    description: 'No significant tolerance. Start with the lowest recommended dose and wait for full onset before redosing.',
    maxDose: 'Light',
    breakDays: '7–14 days between uses',
    redoseNote: 'Avoid redosing. Effects can intensify unpredictably. Wait at least 2 hours before considering a small redose.',
    riskNote: 'Highest risk of overwhelming effects. Always have a tripsitter for your first experience.',
  },
  common: {
    label: 'Common User',
    color: '#f59e0b',
    description: 'Moderate tolerance may have developed. Effects may be slightly diminished at standard doses.',
    maxDose: 'Common',
    breakDays: '7 days minimum between uses',
    redoseNote: 'One redose at 50–75% of initial dose after 90–120 minutes is typical. Limit total redoses.',
    riskNote: 'Moderate risk. Tolerance accumulation can lead to dose escalation if not monitored.',
  },
  heavy: {
    label: 'Heavy User',
    color: '#ef4444',
    description: 'Significant tolerance expected. Standard doses may produce minimal effects. Extended breaks strongly recommended.',
    maxDose: 'Strong',
    breakDays: '14–30 days minimum to reset tolerance',
    redoseNote: 'Redosing is strongly discouraged at this level. Diminished returns with increased side effects and toxicity risk.',
    riskNote: 'Elevated risk of adverse effects, toxicity, and long-term health consequences. Consider professional guidance.',
  },
}

const CATEGORY_CROSS_TOLERANCE: Record<string, { categories: string[]; note: string }> = {
  Psychedelics: {
    categories: ['Psychedelics'],
    note: 'Cross-tolerance exists between classical psychedelics (LSD, psilocybin, mescaline). Using one significantly reduces the effects of others for 7–14 days.',
  },
  Dissociatives: {
    categories: ['Dissociatives'],
    note: 'Dissociatives share significant cross-tolerance within the class. NMDA receptor antagonists (ketamine, DXM, PCP) exhibit strong cross-tolerance.',
  },
  Stimulants: {
    categories: ['Stimulants'],
    note: 'Stimulants develop substantial cross-tolerance within the class. Amphetamine-type substances show the strongest cross-tolerance.',
  },
  Opioids: {
    categories: ['Opioids'],
    note: 'Complete cross-tolerance between all opioid agonists. Switching opioids requires dose adjustment using morphine equivalence tables.',
  },
  Depressants: {
    categories: ['Depressants', 'Gabapentionoids'],
    note: 'Partial cross-tolerance exists between central depressants. GABAergic tolerance is complex and substance-specific.',
  },
  Benzodiazepines: {
    categories: ['Depressants'],
    note: 'Benzodiazepines share cross-tolerance with other GABAergic depressants including alcohol and barbiturates.',
  },
  Cannabinoids: {
    categories: ['Cannabinoids'],
    note: 'Reverse tolerance is occasionally reported with cannabinoids. Regular use leads to cannabinoid receptor downregulation.',
  },
}

const DOSE_LABELS: Record<string, { label: string; color: string }> = {
  t: { label: 'Threshold', color: '#10b981' },
  l: { label: 'Light', color: '#06b6d4' },
  c: { label: 'Common', color: '#eab308' },
  s: { label: 'Strong', color: '#f59e0b' },
  h: { label: 'Heavy', color: '#ef4444' },
}

const MAX_DOSE_KEY: Record<Tab, string> = {
  new: 'l',
  common: 'c',
  heavy: 's',
}

function parseDoseValue(v: string | number): number | null {
  const s = String(v).trim()
  if (s === '?' || s === '' || s === '0') return null
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

export default function ToleranceSection({ substance }: ToleranceSectionProps) {
  const catColor = CATEGORY_COLORS[substance.category]
  const { userLevel, setUserLevel, weightKg } = useSettingsStore()
  const [activeTab, setActiveTab] = useState<Tab>(userLevel)

  const roas = substance.pwRoas?.filter(r => r.d) ?? []

  const crossTolerance = (() => {
    const match = CATEGORY_CROSS_TOLERANCE[substance.category]
    if (match) return match
    for (const v of Object.values(CATEGORY_CROSS_TOLERANCE)) {
      if (v.categories.includes(substance.category)) return v
    }
    return null
  })()

  const activeInfo = USER_LEVEL_TOLERANCE[activeTab]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {(Object.entries(USER_LEVEL_TOLERANCE) as [Tab, typeof USER_LEVEL_TOLERANCE['new']][]).map(([key, info]) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key)
              setUserLevel(key)
            }}
            className="text-left rounded-xl p-3.5 border transition-all cursor-pointer"
            style={{
              borderColor: activeTab === key ? `${info.color}50` : 'var(--border)',
              background: activeTab === key ? `${info.color}08` : 'rgba(255,255,255,0.02)',
              boxShadow: activeTab === key ? `0 0 20px ${info.color}10` : 'none',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: info.color, boxShadow: `0 0 6px ${info.color}40` }} />
              <span className="text-xs font-semibold font-display" style={{ color: info.color }}>{info.label}</span>
              {userLevel === key && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full ml-auto" style={{ background: `${info.color}15`, color: info.color }}>
                  You
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text3)] leading-relaxed">{info.description}</p>
          </button>
        ))}
      </div>

      <div
        className="rounded-xl border p-4 sm:p-5 space-y-4 transition-all"
        style={{
          borderColor: `${activeInfo.color}30`,
          background: `${activeInfo.color}05`,
        }}
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-3">
          <span className="w-3 h-3 rounded-full" style={{ background: activeInfo.color, boxShadow: `0 0 8px ${activeInfo.color}50` }} />
          <span className="text-sm font-semibold font-display" style={{ color: activeInfo.color }}>{activeInfo.label} — Dosage &amp; Guidance</span>
          <span className="text-[10px] font-mono ml-auto px-2 py-0.5 rounded-full" style={{ background: `${activeInfo.color}12`, color: activeInfo.color, border: `1px solid ${activeInfo.color}20` }}>
            Max: {activeInfo.maxDose}
          </span>
        </div>

        {roas.length > 0 ? (
          <div className="space-y-3">
            {roas.map(roa => {
              const doseKeys = ['t', 'l', 'c', 's', 'h'] as const
              const maxKey = MAX_DOSE_KEY[activeTab]
              const maxIdx = doseKeys.indexOf(maxKey as typeof doseKeys[number])
              const entries = doseKeys.map(k => ({
                key: k,
                label: DOSE_LABELS[k].label,
                color: DOSE_LABELS[k].color,
                val: roa.d ? `${roa.d[k as keyof typeof roa.d]}${roa.d.u}` : '?',
                raw: roa.d ? parseDoseValue(roa.d[k as keyof typeof roa.d]) : null,
              }))

              return (
                <div key={roa.n} className="bg-[rgba(0,0,0,0.2)] rounded-lg p-3 border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${catColor}12`, color: catColor }}>
                      {roa.n}
                    </span>
                    {roa.dur && (
                      <span className="text-[10px] text-[var(--text4)] font-mono">
                        {roa.dur.o && `${roa.dur.o}`}{roa.dur.t && ` · ${roa.dur.t}`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    {entries.map((d, idx) => {
                      const isRec = idx <= maxIdx && d.raw !== null
                      return (
                        <div
                          key={d.key}
                          className="flex-1 text-center py-1.5 rounded-md text-[10px] font-mono font-semibold transition-all"
                          style={{
                            background: isRec ? `${d.color}18` : 'rgba(255,255,255,0.03)',
                            color: isRec ? d.color : 'var(--text4)',
                            border: `1px solid ${isRec ? `${d.color}30` : 'var(--border)'}`,
                            opacity: d.raw === null ? 0.3 : 1,
                          }}
                        >
                          <div className="text-[9px] uppercase tracking-wider mb-0.5">{d.label.slice(0, 4)}</div>
                          <div>{d.val}</div>
                        </div>
                      )
                    })}
                  </div>
                  {activeTab === 'new' && (
                    <div className="flex flex-wrap gap-1.5">
                      {entries.filter(e => e.raw !== null && e.key === 'l').map(e => (
                        weightKg > 0 && e.raw ? (
                          <span key={e.key} className="text-[9px] font-mono text-[var(--text4)] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.03)]">
                            Starting: {(e.raw / weightKg).toFixed(2)} mg/kg
                          </span>
                        ) : null
                      ))}
                      {entries.filter(e => e.raw !== null && e.key === 't').map(e => (
                        weightKg > 0 && e.raw ? (
                          <span key={e.key} className="text-[9px] font-mono text-[var(--text4)] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.03)]">
                            Threshold: {(e.raw / weightKg).toFixed(2)} mg/kg
                          </span>
                        ) : null
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-[var(--text4)] italic">No dosage data available for this substance.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <div className="bg-[rgba(0,0,0,0.2)] rounded-lg p-3 border border-[var(--border)]">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--text4)] mb-1">Frequency</div>
            <div className="text-xs font-semibold text-[var(--text2)]">{activeInfo.breakDays}</div>
          </div>
          <div className="bg-[rgba(0,0,0,0.2)] rounded-lg p-3 border border-[var(--border)]">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--text4)] mb-1">Redosing</div>
            <div className="text-xs text-[var(--text3)] leading-relaxed">{activeInfo.redoseNote}</div>
          </div>
          <div className="bg-[rgba(0,0,0,0.2)] rounded-lg p-3 border border-[var(--border)]">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--text4)] mb-1">Risk Note</div>
            <div className="text-xs text-[var(--text3)] leading-relaxed">{activeInfo.riskNote}</div>
          </div>
        </div>
      </div>

      {crossTolerance && (
        <div className="info-card" style={{ '--info-c': catColor } as React.CSSProperties}>
          <h4 className="text-sm lg:text-base font-semibold mb-2 flex items-center gap-2 font-display" style={{ color: catColor }}>
            <svg className="w-4.5 h-4.5 lg:w-5 lg:h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cross-Tolerance
          </h4>
          <p className="text-sm text-[var(--text3)] leading-relaxed">{crossTolerance.note}</p>
          {crossTolerance.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {crossTolerance.categories.map(cat => (
                <span
                  key={cat}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                  style={{
                    background: `${CATEGORY_COLORS[cat as Category] || catColor}15`,
                    color: CATEGORY_COLORS[cat as Category] || catColor,
                    border: `1px solid ${CATEGORY_COLORS[cat as Category] || catColor}25`,
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="info-card" style={{ '--info-c': 'var(--yellow)' } as React.CSSProperties}>
        <div className="flex items-center gap-2 mb-1.5">
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span className="text-xs font-semibold text-yellow-400 font-display">Tolerance Reset</span>
        </div>
        <p className="text-xs text-[var(--text3)] leading-relaxed">
          Tolerance levels vary significantly between individuals and substance classes. Regular breaks of 7–14 days are generally recommended for most substances. Some substances (like psychedelics) may require 2–4 weeks for full tolerance reset. Always err on the side of lower doses after a tolerance break.
        </p>
      </div>
    </div>
  )
}
