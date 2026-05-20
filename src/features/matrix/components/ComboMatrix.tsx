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
  const [activeRow, setActiveRow] = useState<string | null>(null)
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

  if (showListView && view === 'list') {
    return (
      <div className="flex flex-col items-center gap-3 w-full max-w-[100vw] overflow-hidden px-2">
        <div className="flex items-center gap-2 w-full">
          <h3 className="text-xs font-display font-semibold text-[var(--text2)]">Interactions</h3>
          <span className="text-[10px] font-mono text-[var(--text4)]">{N}</span>
          <button
            onClick={() => setView('grid')}
            className="ml-auto text-[10px] px-2 py-1 rounded border border-[var(--border)] text-[var(--text3)]"
          >
            Grid
          </button>
        </div>

        <div className="w-full space-y-2">
          {categories.map(cat => {
            const rowDrugs = subMap.get(cat) ?? []
            const isOpen = activeRow === cat
            return (
              <div key={cat} className="rounded-lg border overflow-hidden"
                style={{ borderColor: isOpen ? CATEGORY_COLORS[cat] + '50' : 'var(--border)' }}>
                <button
                  onClick={() => setActiveRow(isOpen ? null : cat)}
                  className="w-full flex items-center gap-2 p-2.5"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[cat] }} />
                  <span className="text-xs font-display font-semibold text-white truncate">{cat}</span>
                  <span className="text-[10px] font-mono text-[var(--text4)] ml-1">{rowDrugs.length}</span>
                  <svg className={`w-3.5 h-3.5 text-[var(--text4)] ml-auto flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="px-2 pb-2 space-y-0.5">
                    {categories.filter(c => c !== cat).map(other => {
                      const level = getLevel(cat, other)
                      const color = COMBO_LEVEL_COLORS[level]
                      return (
                        <div key={other} className="flex items-center gap-1.5 py-1.5 px-2 rounded text-[10px]"
                          style={{ background: `${color}06` }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[other] }} />
                          <span className="font-display text-[var(--text2)] truncate flex-1">{other}</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase flex-shrink-0"
                            style={{ background: `${color}18`, color, border: `1px solid ${color}25` }}>
                            {COMBO_LEVEL_LABELS[level]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => (
            <div key={level} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm border" style={{ background: `${color}18`, borderColor: `${color}35` }} />
              <span className="text-[9px] text-[var(--text4)] font-mono">{COMBO_LEVEL_LABELS[level]}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const cellSize = touchDevice ? 24 : 36
  const labelSize = touchDevice ? 48 : 80

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 w-full max-w-[100vw] overflow-hidden px-2">
      <div className="flex items-center gap-2 sm:gap-3 w-full">
        <h3 className="text-xs sm:text-sm lg:text-base font-display font-semibold text-[var(--text2)]">Combos</h3>
        <span className="text-[10px] sm:text-[11px] text-[var(--text4)] font-mono">{N}</span>
        {showListView && (
          <button
            onClick={() => setView('list')}
            className="ml-auto text-[10px] px-2 py-1 rounded border border-[var(--border)] text-[var(--text3)]"
          >
            List
          </button>
        )}
      </div>

      <div className="overflow-x-auto w-full pb-2">
        <div
          className="glass rounded-xl p-1 sm:p-2 border border-[var(--border)]"
          style={{
            display: 'grid',
            gap: '2px',
            gridTemplateColumns: `${labelSize}px repeat(${N}, ${cellSize}px)`,
          }}
        >
          <div className="flex items-center justify-center text-[8px] text-[var(--text4)] font-mono"
            style={{ gridColumn: 1, gridRow: 1 }}>↓</div>

          {categories.map((cat, ci) => (
            <div key={cat}
              className="flex items-center justify-center text-[7px] sm:text-[9px] font-display font-medium px-0.5 truncate"
              style={{ gridColumn: ci + 2, gridRow: 1, color: CATEGORY_COLORS[cat], minHeight: cellSize }}
              title={cat}>{cat}</div>
          ))}

          {categories.map((row, ri) => {
            const r = ri + 2
            return (
              <div key={row}>
                <div
                  className="flex items-center justify-end text-[8px] sm:text-[9px] font-display font-medium pr-1 truncate"
                  style={{ gridColumn: 1, gridRow: r, color: CATEGORY_COLORS[row], minHeight: cellSize }}
                  title={row}>{row}</div>

                {categories.map((col, ci) => {
                  const c = ci + 2
                  const level = getLevel(row, col)
                  const isSelf = ri === ci

                  if (isSelf) {
                    return (
                      <div key={`${row}-${col}`}
                        className="flex items-center justify-center text-[var(--text4)] font-mono text-[8px] select-none"
                        style={{ gridColumn: c, gridRow: r, background: 'rgba(255,255,255,0.02)', border: '1px solid transparent', minHeight: cellSize }}>—</div>
                    )
                  }

                  const color = COMBO_LEVEL_COLORS[level]
                  return (
                    <button key={`${row}-${col}`}
                      className={`relative flex items-center justify-center rounded text-[7px] sm:text-[8px] font-mono font-semibold border transition-all ${level === 'deadly' ? 'deadly-pulse' : ''}`}
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
              </div>
            )
          })}
        </div>
      </div>

      {activeRow && (() => {
        const [row, col] = activeRow.split('+')
        if (!row || !col || row === col) return null
        const level = getLevel(row, col)
        const color = COMBO_LEVEL_COLORS[level]
        const rowDrugs = subMap.get(row) ?? []
        const colDrugs = subMap.get(col) ?? []
        return (
          <div className="glass-strong rounded-xl p-3 sm:p-4 border border-[var(--border2)] w-full max-w-sm mx-auto"
            style={{ animation: 'fadeInUp 0.2s ease both' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[row] }} />
              <span className="text-xs font-display font-semibold text-white">{row}</span>
              <span className="text-[var(--text4)] text-xs">+</span>
              <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[col] }} />
              <span className="text-xs font-display font-semibold text-white">{col}</span>
              <span className="ml-auto px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-semibold uppercase"
                style={{ background: `${color}18`, color, border: `1px solid ${color}25` }}>
                {COMBO_LEVEL_LABELS[level]}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-[var(--text3)] leading-relaxed mb-2.5">
              {COMBO_DESCRIPTIONS[level] || 'Use caution.'}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {[row, col].map(cat => {
                const drugs = subMap.get(cat) ?? []
                return (
                  <div key={cat}>
                    <div className="text-[9px] font-mono text-[var(--text4)] mb-1 uppercase">{cat} ({drugs.length})</div>
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
              Tap cell to close
            </button>
          </div>
        )
      })()}

      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
        {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => (
          <div key={level} className="flex items-center gap-1">
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm border ${level === 'deadly' ? 'deadly-pulse' : ''}`}
              style={{ background: `${color}18`, borderColor: `${color}35` }} />
            <span className="text-[9px] sm:text-[10px] text-[var(--text4)] font-mono">{COMBO_LEVEL_LABELS[level]}</span>
          </div>
        ))}
      </div>

      {touchDevice && N > 5 && (
        <p className="text-[9px] text-[var(--text4)] font-mono">← scroll →</p>
      )}
    </div>
  )
}

