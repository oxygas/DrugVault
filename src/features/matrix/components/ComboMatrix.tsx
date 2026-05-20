'use client'

import { useState, useMemo, useCallback, useEffect, Fragment } from 'react'
import type { Substance, ComboLevel } from '@/lib/types'
import { CATEGORY_COLORS, COMBO_LEVEL_COLORS, COMBO_LEVEL_LABELS, COMBO_LEVEL_ORDER, COMBO_DESCRIPTIONS } from '@/lib/types'

interface ComboMatrixProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  onSelectSubstance?: (substance: Substance) => void
}

export default function ComboMatrix({ substances, comboRules, onSelectSubstance }: ComboMatrixProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [expandedPair, setExpandedPair] = useState<string | null>(null)
  const [activeRow, setActiveRow] = useState<string | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
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

  // ─── MOBILE VIEW ───
  if (isMobile) {
    const interactions = selectedCat
      ? categories
          .filter(c => c !== selectedCat)
          .map(other => ({ other, level: getLevel(selectedCat, other) as ComboLevel }))
          .sort((a, b) => COMBO_LEVEL_ORDER.indexOf(a.level) - COMBO_LEVEL_ORDER.indexOf(b.level))
      : []

    return (
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center gap-2 px-1">
          <h3 className="text-sm font-display font-semibold text-[var(--text2)]">Interactions</h3>
          <span className="text-[11px] font-mono text-[var(--text4)]">{N}</span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => {
            const active = selectedCat === cat
            const count = (subMap.get(cat) ?? []).length
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCat(active ? null : cat); setExpandedPair(null) }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-display font-medium whitespace-nowrap border transition-all flex-shrink-0 ${
                  active
                    ? 'border-[var(--border3)] bg-[var(--surface-solid)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border2)]'
                }`}
                style={active ? { borderColor: CATEGORY_COLORS[cat] + '40', boxShadow: `0 0 12px ${CATEGORY_COLORS[cat]}15` } : undefined}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[cat] }} />
                <span className={active ? 'text-white' : 'text-[var(--text3)]'}>{cat}</span>
                <span className="text-[9px] font-mono text-[var(--text4)]">{count}</span>
              </button>
            )
          })}
        </div>

        {!selectedCat ? (
          <div className="flex flex-col items-center gap-2 py-8 text-[var(--text4)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-mono">Tap a category to see interactions</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {interactions.map(({ other, level }) => {
              const color = COMBO_LEVEL_COLORS[level]
              const pairKey = `${selectedCat}+${other}`
              const isExpanded = expandedPair === pairKey
              return (
                <div key={other}
                  className="rounded-xl border overflow-hidden transition-all"
                  style={{
                    borderColor: isExpanded ? color + '30' : 'var(--border)',
                    background: isExpanded ? `${color}06` : undefined,
                  }}>
                  <button
                    onClick={() => setExpandedPair(isExpanded ? null : pairKey)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-3"
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[other] }} />
                    <span className="text-[13px] font-display font-semibold text-[var(--text2)] flex-1 text-left">{other}</span>
                    <span
                      className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wide flex-shrink-0"
                      style={{ background: `${color}14`, color, border: `1px solid ${color}20` }}
                    >
                      {COMBO_LEVEL_LABELS[level]}
                    </span>
                    <svg
                      className={`w-4 h-4 text-[var(--text4)] flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 space-y-3" style={{ animation: 'fadeInUp 0.15s ease both' }}>
                      <p className="text-[12px] text-[var(--text3)] leading-relaxed">
                        {COMBO_DESCRIPTIONS[level] || 'Use caution.'}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {[selectedCat, other].map(cat => {
                          const drugs = subMap.get(cat) ?? []
                          return (
                            <div key={cat}>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
                                <span className="text-[10px] font-mono text-[var(--text4)] uppercase">{cat} ({drugs.length})</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {drugs.slice(0, 4).map(s => (
                                  <button
                                    key={s.name}
                                    onClick={() => onSelectSubstance?.(s)}
                                    className="text-[10px] px-2 py-0.5 rounded-full font-mono transition-colors"
                                    style={{
                                      background: `${CATEGORY_COLORS[cat]}10`,
                                      color: CATEGORY_COLORS[cat],
                                      border: `1px solid ${CATEGORY_COLORS[cat]}18`,
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
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center pt-1">
          {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => (
            <div key={level} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-sm ${level === 'deadly' ? 'deadly-pulse' : ''}`}
                style={{ background: `${color}18`, border: `1px solid ${color}35` }} />
              <span className="text-[9px] text-[var(--text4)] font-mono">{COMBO_LEVEL_LABELS[level]}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── DESKTOP VIEW (unchanged) ───
  const cellSize = 42
  const labelSize = 90

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[100vw] overflow-hidden">
      <div className="flex items-center gap-3">
        <h3 className="text-sm lg:text-base font-display font-semibold text-[var(--text2)]">Combos</h3>
        <span className="text-[11px] text-[var(--text4)] font-mono">{N}</span>
      </div>

      <div className="overflow-x-auto w-full pb-2">
        <div
          className="glass rounded-xl p-2 border border-[var(--border)]"
          style={{
            display: 'grid',
            gap: '3px',
            gridTemplateColumns: `${labelSize}px repeat(${N}, ${cellSize}px)`,
          }}
        >
          <div className="flex items-center justify-center text-[11px] text-[var(--text4)] font-mono"
            style={{ gridColumn: 1, gridRow: 1 }}>↓</div>

          {categories.map((cat, ci) => (
            <div key={cat}
              className="flex items-center justify-center text-[11px] font-display font-medium px-0.5 truncate"
              style={{ gridColumn: ci + 2, gridRow: 1, color: CATEGORY_COLORS[cat], minHeight: cellSize }}
              title={cat}>{cat}</div>
          ))}

          {categories.map((row, ri) => {
            const r = ri + 2
            return (
              <Fragment key={row}>
                <div
                  className="flex items-center justify-end text-[11px] font-display font-medium pr-1 truncate"
                  style={{ gridColumn: 1, gridRow: r, color: CATEGORY_COLORS[row], minHeight: cellSize }}
                  title={row}>{row}</div>

                {categories.map((col, ci) => {
                  const c = ci + 2
                  const level = getLevel(row, col)
                  const isSelf = ri === ci

                  if (isSelf) {
                    return (
                      <div key={`${row}-${col}`}
                        className="flex items-center justify-center text-[var(--text4)] font-mono text-[11px] select-none"
                        style={{ gridColumn: c, gridRow: r, background: 'rgba(255,255,255,0.02)', border: '1px solid transparent', minHeight: cellSize }}>—</div>
                    )
                  }

                  const color = COMBO_LEVEL_COLORS[level]
                  return (
                    <button key={`${row}-${col}`}
                      className={`relative flex items-center justify-center rounded text-[10px] font-mono font-semibold border transition-all ${level === 'deadly' ? 'deadly-pulse' : ''}`}
                      style={{
                        gridColumn: c, gridRow: r, minHeight: cellSize,
                        background: `${color}18`, borderColor: `${color}30`, color,
                        boxShadow: level === 'deadly' ? `0 0 8px ${color}40` : undefined,
                      }}
                      onClick={() => {
                        const newActive = activeRow === `${row}+${col}` ? null : `${row}+${col}`
                        setActiveRow(newActive)
                      }}
                      aria-label={`${row} + ${col}: ${COMBO_LEVEL_LABELS[level]}`}>
                      {COMBO_LEVEL_LABELS[level].charAt(0)}
                    </button>
                  )
                })}
              </Fragment>
            )
          })}
        </div>
      </div>

      {activeRow && (() => {
        const [row, col] = activeRow.split('+')
        if (!row || !col || row === col) return null
        const level = getLevel(row, col)
        const color = COMBO_LEVEL_COLORS[level]
        return (
          <div className="glass-strong rounded-xl p-4 border border-[var(--border2)] w-full max-w-sm mx-auto"
            style={{ animation: 'fadeInUp 0.2s ease both' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[row] }} />
              <span className="text-xs font-display font-semibold text-white">{row}</span>
              <span className="text-[var(--text4)] text-xs">+</span>
              <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[col] }} />
              <span className="text-xs font-display font-semibold text-white">{col}</span>
              <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase"
                style={{ background: `${color}18`, color, border: `1px solid ${color}25` }}>
                {COMBO_LEVEL_LABELS[level]}
              </span>
            </div>
            <p className="text-xs text-[var(--text3)] leading-relaxed mb-2.5">
              {COMBO_DESCRIPTIONS[level] || 'Use caution.'}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {[row, col].map(cat => {
                const drugs = subMap.get(cat) ?? []
                return (
                  <div key={cat}>
                    <div className="text-[10px] font-mono text-[var(--text4)] mb-1 uppercase">{cat} ({drugs.length})</div>
                    <div className="flex flex-wrap gap-1">
                      {drugs.slice(0, 5).map(s => (
                        <button key={s.name}
                          onClick={() => onSelectSubstance?.(s)}
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-mono"
                          style={{ background: `${CATEGORY_COLORS[cat]}12`, color: CATEGORY_COLORS[cat], border: `1px solid ${CATEGORY_COLORS[cat]}20` }}>
                          {s.name}
                        </button>
                      ))}
                      {drugs.length > 5 && (
                        <span className="text-[9px] text-[var(--text4)] font-mono">+{drugs.length - 5}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={() => setActiveRow(null)} className="mt-2 text-[10px] text-[var(--text4)] hover:text-white transition-colors w-full text-center">
              Close
            </button>
          </div>
        )
      })()}

      <div className="flex flex-wrap gap-3 justify-center">
        {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => (
          <div key={level} className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-sm border ${level === 'deadly' ? 'deadly-pulse' : ''}`}
              style={{ background: `${color}18`, borderColor: `${color}35` }} />
            <span className="text-[11px] text-[var(--text4)] font-mono">{COMBO_LEVEL_LABELS[level]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}