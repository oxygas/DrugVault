'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import type { Substance, ComboLevel } from '@/lib/types'
import { CATEGORY_COLORS, COMBO_LEVEL_COLORS, COMBO_LEVEL_LABELS, COMBO_DESCRIPTIONS } from '@/lib/types'
import { isTouchDevice } from '@/lib/device'

interface ComboMatrixProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  onSelectSubstance?: (substance: Substance) => void
}

export default function ComboMatrix({ substances, comboRules, onSelectSubstance }: ComboMatrixProps) {
  const [touchDevice, setTouchDevice] = useState(false)
  const [activePair, setActivePair] = useState<{ a: string; b: string } | null>(null)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    setTouchDevice(isTouchDevice())
  }, [])

  const categories = useMemo(
    () => [...new Set(substances.map(s => s.category))].sort(),
    [substances]
  )

  const N = categories.length

  const getLevel = useCallback((a: string, b: string): ComboLevel => {
    if (a === b) return 'low_risk'
    return comboRules[`${a}+${b}`] || comboRules[`${b}+${a}`] || 'caution'
  }, [comboRules])

  const subMap = useMemo(() => {
    const m = new Map<string, Substance[]>()
    for (const s of substances) {
      const arr = m.get(s.category) ?? []
      arr.push(s)
      m.set(s.category, arr)
    }
    return m
  }, [substances])

  const showListView = touchDevice && N > 5

  // ─── MOBILE LIST VIEW ───────────────────────────────────────────────────
  if (showListView && view === 'list') {
    return (
      <div className="flex flex-col gap-3 w-full px-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-display font-semibold text-white">Drug Matrix</h3>
          <span className="text-[11px] font-mono text-[var(--text4)]">{N} categories</span>
          <button
            onClick={() => setView('grid')}
            className="ml-auto text-[10px] px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--text3)] font-mono"
          >
            Grid
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => {
            const active = expandedCat === cat
            return (
              <button
                key={cat}
                onClick={() => setExpandedCat(active ? null : cat)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-display font-semibold border transition-all flex-shrink-0"
                style={{
                  borderColor: active ? CATEGORY_COLORS[cat] : 'var(--border)',
                  background: active ? `${CATEGORY_COLORS[cat]}12` : 'var(--surface)',
                  color: active ? CATEGORY_COLORS[cat] : 'var(--text3)',
                  boxShadow: active ? `0 0 16px ${CATEGORY_COLORS[cat]}20` : undefined,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: active ? CATEGORY_COLORS[cat] : 'var(--text4)' }} />
                {cat}
              </button>
            )
          })}
        </div>

        {!expandedCat ? (
          <div className="flex flex-col items-center gap-2 py-12 text-[var(--text4)]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-20">
              <rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="14" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-mono">Tap a category above</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {categories.map(other => {
              if (other === expandedCat) return null
              const level = getLevel(expandedCat, other)
              const color = COMBO_LEVEL_COLORS[level]
              const otherDrugs = subMap.get(other) ?? []

              return (
                <div key={other}
                  className="rounded-xl border overflow-hidden transition-all"
                  style={{ borderColor: 'var(--border)' }}>
                  <button
                    onClick={() => setActivePair({ a: expandedCat, b: other })}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors"
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[other] }} />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-display font-semibold text-white">{other}</div>
                      <div className="text-[10px] font-mono text-[var(--text4)]">{otherDrugs.length} substances</div>
                    </div>
                    <span
                      className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wide"
                      style={{ background: `${color}15`, color, border: `1px solid ${color}30`, letterSpacing: '0.05em' }}
                    >
                      {COMBO_LEVEL_LABELS[level]}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Detail Modal */}
        {activePair && (() => {
          const level = getLevel(activePair.a, activePair.b)
          const color = COMBO_LEVEL_COLORS[level]
          return (
            <div
              className="fixed inset-0 z-[200] flex items-end justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
              onClick={() => setActivePair(null)}
            >
              <div
                className="rounded-2xl p-5 w-full max-w-sm border"
                style={{
                  background: 'var(--surface-elevated)',
                  borderColor: 'var(--border2)',
                  animation: 'slideUp 0.25s ease'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-3 h-3 rounded-full" style={{ background: CATEGORY_COLORS[activePair.a] }} />
                  <span className="text-sm font-display font-bold text-white">{activePair.a}</span>
                  <span className="text-[var(--text4)] font-display">+</span>
                  <span className="w-3 h-3 rounded-full" style={{ background: CATEGORY_COLORS[activePair.b] }} />
                  <span className="text-sm font-display font-bold text-white">{activePair.b}</span>
                  <span className="ml-auto px-3 py-1 rounded-lg text-[11px] font-mono font-bold uppercase"
                    style={{ background: `${color}15`, color, border: `1px solid ${color}35` }}>
                    {COMBO_LEVEL_LABELS[level]}
                  </span>
                </div>
                <p className="text-[13px] text-[var(--text3)] leading-relaxed mb-4">
                  {COMBO_DESCRIPTIONS[level] || 'Use caution with this combination.'}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[activePair.a, activePair.b].map(cat => {
                    const drugs = subMap.get(cat) ?? []
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
                          <span className="text-[11px] font-mono text-[var(--text4)] uppercase tracking-wider">{cat}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {drugs.slice(0, 4).map(s => (
                            <button
                              key={s.name}
                              onClick={() => { onSelectSubstance?.(s); setActivePair(null) }}
                              className="text-[11px] px-2.5 py-1 rounded-full font-mono"
                              style={{
                                background: `${CATEGORY_COLORS[cat]}10`,
                                color: CATEGORY_COLORS[cat],
                                border: `1px solid ${CATEGORY_COLORS[cat]}25`,
                              }}
                            >
                              {s.name}
                            </button>
                          ))}
                          {drugs.length > 4 && (
                            <span className="text-[10px] text-[var(--text4)] font-mono self-center">+{drugs.length - 4}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button
                  onClick={() => setActivePair(null)}
                  className="w-full py-2.5 text-[12px] font-mono text-[var(--text4)] hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  Close
                </button>
              </div>
            </div>
          )
        })()}

        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center pt-1 pb-3">
          {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => (
            <div key={level} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm border" style={{ background: `${color}18`, borderColor: `${color}35` }} />
              <span className="text-[10px] font-mono text-[var(--text4)]">{COMBO_LEVEL_LABELS[level]}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── DESKTOP / GRID VIEW ────────────────────────────────────────────────
  const cellSize = touchDevice ? 32 : 56
  const labelSize = touchDevice ? 56 : 96

  return (
    <div className="flex flex-col items-center gap-4 w-full overflow-hidden px-2">
      <div className="flex items-center gap-3">
        <h3 className="text-sm lg:text-base font-display font-semibold text-white">Drug Matrix</h3>
        <span className="text-[11px] font-mono text-[var(--text4)]">{N} categories</span>
        {showListView && (
          <button
            onClick={() => setView('list')}
            className="text-[10px] px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--text3)] font-mono"
          >
            List
          </button>
        )}
      </div>

      <div className="overflow-x-auto w-full pb-3">
        <div
          className="rounded-2xl p-2.5 border border-[var(--border)]"
          style={{
            display: 'grid',
            gap: '3px',
            gridTemplateColumns: `${labelSize}px repeat(${N}, ${cellSize}px)`,
          }}
        >
          <div
            className="flex items-center justify-center text-[10px] text-[var(--text4)] font-mono"
            style={{ gridColumn: 1, gridRow: 1 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </div>

          {categories.map((cat, ci) => (
            <div key={cat}
              className="flex items-center justify-center text-[9px] lg:text-[11px] font-display font-bold uppercase px-0.5 truncate"
              style={{ gridColumn: ci + 2, gridRow: 1, color: CATEGORY_COLORS[cat], minHeight: cellSize, letterSpacing: '0.04em' }}
              title={cat}
            >
              {cat}
            </div>
          ))}

          {categories.map((row, ri) => {
            const r = ri + 2
            return (
              <div key={row}>
                <div
                  className="flex items-center justify-end text-[9px] lg:text-[11px] font-display font-bold uppercase pr-2 truncate"
                  style={{ gridColumn: 1, gridRow: r, color: CATEGORY_COLORS[row], minHeight: cellSize, letterSpacing: '0.04em' }}
                  title={row}
                >
                  {row}
                </div>

                {categories.map((col, ci) => {
                  const c = ci + 2
                  const level = getLevel(row, col)
                  const isSelf = ri === ci

                  if (isSelf) {
                    return (
                      <div key={`${row}-${col}`}
                        className="flex items-center justify-center text-[var(--text4)] font-mono text-[10px] select-none"
                        style={{
                          gridColumn: c, gridRow: r,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.04)',
                          minHeight: cellSize,
                          borderRadius: '6px',
                        }}>
                        —
                      </div>
                    )
                  }

                  const color = COMBO_LEVEL_COLORS[level]
                  const label = COMBO_LEVEL_LABELS[level]
                  return (
                    <button key={`${row}-${col}`}
                      className="relative flex items-center justify-center rounded-lg text-[8px] lg:text-[9px] font-mono font-bold uppercase border transition-all hover:scale-110 hover:z-10"
                      style={{
                        gridColumn: c, gridRow: r, minHeight: cellSize,
                        background: `${color}15`,
                        borderColor: `${color}35`,
                        color,
                        letterSpacing: '0.03em',
                        boxShadow: `0 0 0 0 ${color}00`,
                      }}
                      onClick={() => setActivePair({ a: row, b: col })}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.background = `${color}25`
                        el.style.boxShadow = `0 0 12px ${color}30`
                        el.style.borderColor = `${color}60`
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.background = `${color}15`
                        el.style.boxShadow = `0 0 0 0 ${color}00`
                        el.style.borderColor = `${color}35`
                      }}
                      aria-label={`${row} + ${col}: ${label}`}
                      title={`${row} + ${col}: ${label}`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {activePair && (() => {
        const level = getLevel(activePair.a, activePair.b)
        const color = COMBO_LEVEL_COLORS[level]
        return (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setActivePair(null)}
          >
            <div
              className="rounded-2xl p-6 w-full max-w-md border"
              style={{
                background: 'var(--surface-elevated)',
                borderColor: `${color}30`,
                animation: 'fadeInUp 0.2s ease both',
                boxShadow: `0 0 40px ${color}15`,
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="w-4 h-4 rounded-full" style={{ background: CATEGORY_COLORS[activePair.a] }} />
                <span className="text-base font-display font-bold text-white">{activePair.a}</span>
                <span className="text-[var(--text4)] font-display text-lg">+</span>
                <span className="w-4 h-4 rounded-full" style={{ background: CATEGORY_COLORS[activePair.b] }} />
                <span className="text-base font-display font-bold text-white">{activePair.b}</span>
                <span className="ml-auto px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wide"
                  style={{ background: `${color}15`, color, border: `1px solid ${color}35` }}>
                  {COMBO_LEVEL_LABELS[level]}
                </span>
              </div>
              <p className="text-[13px] text-[var(--text3)] leading-relaxed mb-5">
                {COMBO_DESCRIPTIONS[level] || 'Use caution with this combination.'}
              </p>
              <div className="grid grid-cols-2 gap-4 mb-5">
                {[activePair.a, activePair.b].map(cat => {
                  const drugs = subMap.get(cat) ?? []
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
                        <span className="text-[11px] font-mono text-[var(--text4)] uppercase tracking-wider">{cat}</span>
                        <span className="text-[10px] font-mono text-[var(--text4)]">({drugs.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {drugs.slice(0, 5).map(s => (
                          <button
                            key={s.name}
                            onClick={() => { onSelectSubstance?.(s); setActivePair(null) }}
                            className="text-[11px] px-2.5 py-1 rounded-full font-mono transition-colors"
                            style={{
                              background: `${CATEGORY_COLORS[cat]}10`,
                              color: CATEGORY_COLORS[cat],
                              border: `1px solid ${CATEGORY_COLORS[cat]}25`,
                            }}
                          >
                            {s.name}
                          </button>
                        ))}
                        {drugs.length > 5 && (
                          <span className="text-[10px] text-[var(--text4)] font-mono self-center">+{drugs.length - 5}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={() => setActivePair(null)}
                className="w-full py-2.5 text-[12px] font-mono text-[var(--text4)] hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                Close
              </button>
            </div>
          </div>
        )
      })()}

      <div className="flex flex-wrap gap-3 justify-center">
        {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => (
          <div key={level} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm border"
              style={{ background: `${color}15`, borderColor: `${color}35` }}
            />
            <span className="text-[11px] text-[var(--text4)] font-mono">{COMBO_LEVEL_LABELS[level]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}