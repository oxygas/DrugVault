'use client'

import type { Substance, Roa, UserLevel } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/types'
import { useSettingsStore } from '@/stores/settings'

interface DosageTableProps {
  substance: Substance
}

function hasMeaningfulDose(roa: Roa): boolean {
  if (!roa.d) return false
  return [roa.d.t, roa.d.l, roa.d.c, roa.d.s, roa.d.h].some(v => {
    const s = String(v).trim()
    return s !== '?' && s !== '' && s !== '0'
  })
}

const USER_LEVEL_DOSE_RECOMMENDATION: Record<UserLevel, { maxLabel: string; maxKey: string }> = {
  new: { maxLabel: 'Light', maxKey: 'l' },
  common: { maxLabel: 'Common', maxKey: 'c' },
  heavy: { maxLabel: 'Strong', maxKey: 's' },
}

const USER_LEVEL_COLORS: Record<UserLevel, string> = {
  new: '#10b981',
  common: '#f59e0b',
  heavy: '#ef4444',
}

function parseDoseValue(v: string | number): number | null {
  const s = String(v).trim()
  if (s === '?' || s === '' || s === '0') return null
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

export default function DosageTable({ substance }: DosageTableProps) {
  const catColor = CATEGORY_COLORS[substance.category]
  const roas = substance.pwRoas
  const { bodyWeight, weightUnit, userLevel, weightKg } = useSettingsStore()

  const meaningfulRoas = roas?.filter(hasMeaningfulDose) ?? []

  if (meaningfulRoas.length === 0) {
    return (
      <div className="w-full">
      <h4 className="text-xs lg:text-sm font-semibold text-[var(--text2)] mb-3 flex items-center gap-2 font-display">
        <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full" style={{ background: catColor, boxShadow: `0 0 6px ${catColor}40` }} />
        Dosage Information
      </h4>
      <div className="info-card" style={{ '--info-c': catColor } as React.CSSProperties}>
        <p className="text-sm lg:text-[15px] text-[var(--text3)] leading-relaxed">Detailed dosage data not available. Always start with the lowest possible dose.</p>
        <p className="text-xs lg:text-sm text-[var(--text4)] mt-3 font-mono">
            Onset: <span className="text-[var(--text2)] font-semibold">{substance.onset}</span>
            <span className="text-[var(--border2)] mx-1.5">·</span>
            Duration: <span className="text-[var(--text2)] font-semibold">{substance.duration}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h4 className="text-xs lg:text-sm font-semibold text-[var(--text2)] flex items-center gap-2 font-display">
          <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full" style={{ background: catColor, boxShadow: `0 0 6px ${catColor}40` }} />
          Dosage Information
        </h4>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono font-semibold px-2 py-1 rounded-full"
            style={{
              background: `${USER_LEVEL_COLORS[userLevel]}15`,
              color: USER_LEVEL_COLORS[userLevel],
              border: `1px solid ${USER_LEVEL_COLORS[userLevel]}25`,
            }}
          >
            {userLevel === 'new' ? 'New' : userLevel === 'common' ? 'Common' : 'Heavy'} user
          </span>
          {weightKg > 0 && (
            <span className="text-[10px] font-mono text-[var(--text4)]">
              {bodyWeight}{weightUnit}
            </span>
          )}
        </div>
      </div>
    <div className="space-y-3">
        {meaningfulRoas.map(roa => (
          <RoaCard key={roa.n} roa={roa} userLevel={userLevel} weightKg={weightKg} />
        ))}
      </div>
      <div className="mt-4 info-card" style={{ '--info-c': 'var(--orange)' } as React.CSSProperties}>
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
      <span className="text-xs lg:text-sm font-display font-semibold text-orange-400">Harm Reduction</span>
      </div>
      <p className="text-[12px] lg:text-sm text-[var(--text3)] leading-relaxed">
          Always start with the lowest dose. Dosages vary by individual body weight, tolerance, and metabolism. When in doubt, use less.
        </p>
      </div>
    </div>
  )
}

function RoaCard({ roa, userLevel, weightKg }: { roa: Roa; userLevel: UserLevel; weightKg: number }) {
  if (!roa.d) return null
  const rec = USER_LEVEL_DOSE_RECOMMENDATION[userLevel]
  const rowColors: Record<string, string> = {
    t: '#10b981',
    l: '#06b6d4',
    c: '#eab308',
    s: '#f59e0b',
    h: '#ef4444',
  }

  const doseEntries: { key: string; label: string; val: string; rawVal: number | null; color: string }[] = [
    { key: 't', label: 'Threshold', val: `${roa.d.t}${roa.d.u}`, rawVal: parseDoseValue(roa.d.t), color: '#10b981' },
    { key: 'l', label: 'Light', val: `${roa.d.l}${roa.d.u}`, rawVal: parseDoseValue(roa.d.l), color: '#06b6d4' },
    { key: 'c', label: 'Common', val: `${roa.d.c}${roa.d.u}`, rawVal: parseDoseValue(roa.d.c), color: '#eab308' },
    { key: 's', label: 'Strong', val: `${roa.d.s}${roa.d.u}`, rawVal: parseDoseValue(roa.d.s), color: '#f59e0b' },
    { key: 'h', label: 'Heavy', val: `${roa.d.h}${roa.d.u}`, rawVal: parseDoseValue(roa.d.h), color: '#ef4444' },
  ]

  const maxPct = 100
  const lastNumeric = [...doseEntries].reverse().find(d => d.rawVal !== null)
  const scaleMax = lastNumeric?.rawVal ? lastNumeric.rawVal * 1.5 : 100

  const maxRecKey = rec.maxKey
  const maxRecIdx = doseEntries.findIndex(d => d.key === maxRecKey)

  return (
    <div className="glass rounded-xl p-4 lg:p-5 border border-[var(--border)]">
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <span className="text-[10px] lg:text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-full bg-[rgba(168,85,247,0.08)] text-[var(--accent2)] border border-[rgba(168,85,247,0.12)]">
          {roa.n}
        </span>
        <span
          className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: `${USER_LEVEL_COLORS[userLevel]}15`,
            color: USER_LEVEL_COLORS[userLevel],
            border: `1px solid ${USER_LEVEL_COLORS[userLevel]}25`,
          }}
        >
          Recommended: up to {rec.maxLabel}
        </span>
      </div>
      <div className="space-y-2.5">
        {doseEntries.map((d, idx) => {
          const pct = d.rawVal ? Math.min(100, (d.rawVal / scaleMax) * 100) : 0
          const isRecMax = idx <= maxRecIdx
          return (
            <div key={d.key} className="flex items-center gap-2 sm:gap-3">
              <span className="text-[11px] lg:text-xs w-16 sm:w-20 text-right flex-shrink-0 font-display font-medium"
                style={{ color: isRecMax ? d.color : 'var(--text4)' }}
              >
                {d.label}
              </span>
              <div className="flex-1 h-2 lg:h-2.5 bg-[rgba(255,255,255,0.03)] rounded-full overflow-hidden border border-[rgba(255,255,255,0.04)] relative">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${d.color}90, ${d.color})`, boxShadow: `0 0 6px ${d.color}30` }}
                />
                {isRecMax && idx < doseEntries.length - 1 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 z-10"
                    style={{
                      left: `${pct}%`,
                      background: USER_LEVEL_COLORS[userLevel],
                      boxShadow: `0 0 4px ${USER_LEVEL_COLORS[userLevel]}`,
                    }}
                  />
                )}
              </div>
              <div className="w-20 sm:w-24 text-right flex-shrink-0 truncate">
                <span className="text-[11px] lg:text-xs font-mono font-semibold" style={{ color: isRecMax ? d.color : 'var(--text4)' }}>
                  {d.val}
                </span>
                {d.rawVal && weightKg > 0 && userLevel === 'new' && (
                  <span className="text-[9px] font-mono text-[var(--text4)] block">
                    {(d.rawVal / weightKg).toFixed(2)} mg/kg
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {roa.dur && (
        <div className="mt-3.5 pt-3 border-t border-[var(--border)] flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--text3)] font-mono">
          {roa.dur.o && <span>Onset: <span className="text-[var(--text2)] font-semibold">{roa.dur.o}</span></span>}
          {roa.dur.p && <span>Peak: <span className="text-[var(--text2)] font-semibold">{roa.dur.p}</span></span>}
          {roa.dur.t && <span>Total: <span className="text-[var(--text2)] font-semibold">{roa.dur.t}</span></span>}
        </div>
      )}
    </div>
  )
}
