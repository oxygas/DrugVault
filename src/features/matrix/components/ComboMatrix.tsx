'use client'

import { useState, useMemo, useCallback, Fragment, useRef, useEffect } from 'react'
import type { Substance, Category, ComboLevel } from '@/lib/types'
import { CATEGORY_COLORS, COMBO_LEVEL_COLORS, COMBO_LEVEL_LABELS, COMBO_DESCRIPTIONS } from '@/lib/types'
import { isTouchDevice } from '@/lib/device'

interface ComboMatrixProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  onSelectSubstance?: (substance: Substance) => void
}

function levelStyle(level: ComboLevel) {
  const c = COMBO_LEVEL_COLORS[level]
  return {
    background: `color-mix(in srgb, ${c} 18%, transparent)`,
    borderColor: `color-mix(in srgb, ${c} 30%, transparent)`,
    color: c,
    boxShadow: level === 'deadly' ? `0 0 10px ${c}50, inset 0 0 6px ${c}15` : undefined,
  }
}

export default function ComboMatrix({ substances, comboRules, onSelectSubstance }: ComboMatrixProps) {
  const [hovered, setHovered] = useState<{ row: string; col: string } | null>(null)
  const [selected, setSelected] = useState<{ row: string; col: string; level: ComboLevel } | null>(null)
  const [touchDevice, setTouchDevice] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTouchDevice(isTouchDevice())
  }, [])

  const categories = useMemo(
    () => [...new Set(substances.map(s => s.category))].sort(),
    [substances]
  )

  const maxPopoverDrugs = touchDevice ? 5 : 10

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

  const cellSize = touchDevice ? 28 : 36
  const headerSize = touchDevice ? 60 : 80
  const labelSize = touchDevice ? 56 : 80

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <h3 className="text-xs sm:text-sm lg:text-base font-display font-semibold text-[var(--text2)]">Drug Combination Matrix</h3>
        <span className="text-[10px] sm:text-[11px] lg:text-xs text-[var(--text4)] font-mono">{N} categories</span>
      </div>

      <div ref={scrollRef} className="overflow-x-auto w-full flex justify-start pb-2">
        <div
          className="glass rounded-xl p-1.5 sm:p-2 lg:p-3 border border-[var(--border)]"
          style={{
            display: 'grid',
            gap: '2px',
            gridTemplateColumns: `${labelSize}px repeat(${N}, ${cellSize}px)`,
          }}
        >
          <div className="flex items-center justify-center text-[8px] sm:text-[9px] text-[var(--text4)] font-mono tracking-wider"
            style={{ gridColumn: 1, gridRow: 1 }}>
            ↓
          </div>

          {categories.map((cat, ci) => (
            <div key={cat}
              className="flex items-center justify-center text-[8px] sm:text-[9px] lg:text-[10px] font-display font-medium px-0.5 truncate"
              style={{ gridColumn: ci + 2, gridRow: 1, color: CATEGORY_COLORS[cat], minHeight: headerSize }}
              title={cat}>
              {cat}
            </div>
          ))}

          {categories.map((row, ri) => {
            const r = ri + 2
            return (
              <Fragment key={row}>
                <div
                  className="flex items-center justify-end text-[8px] sm:text-[9px] lg:text-[10px] font-display font-medium pr-1 truncate"
                  style={{ gridColumn: 1, gridRow: r, color: CATEGORY_COLORS[row], minHeight: cellSize }}
                  title={row}>
                  {row}
                </div>

                {categories.map((col, ci) => {
                  const c = ci + 2

                  const level = getLevel(row, col)
                  const isSelf = ri === ci
                  const isHov = hovered?.row === row && hovered?.col === col
                  const crossHover = hovered && (hovered.row === row || hovered.col === col)
                  const isSel = selected?.row === row && selected?.col === col

                  if (isSelf) {
                    return (
                      <div key={`${row}-${col}`}
                        className="flex items-center justify-center rounded text-[var(--text4)] font-mono text-[8px] sm:text-[9px] select-none"
                        style={{
                          gridColumn: c,
                          gridRow: r,
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid transparent',
                          minHeight: cellSize,
                        }}>
                        —
                      </div>
                    )
                  }

                  const s = levelStyle(level)
                  return (
                    <button key={`${row}-${col}`}
                      className={`relative flex items-center justify-center rounded text-[7px] sm:text-[8px] lg:text-[9px] font-mono font-semibold transition-all duration-150 border ${level === 'deadly' ? 'deadly-pulse' : ''} ${isSel ? 'ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-transparent' : ''}`}
                      style={{
                        gridColumn: c,
                        gridRow: r,
                        minHeight: cellSize,
                        ...s,
                        opacity: crossHover && !isHov ? 0.45 : 1,
                        transform: isHov ? 'scale(1.2)' : 'scale(1)',
                        zIndex: isHov ? 10 : 1,
                      }}
                      onClick={() => {
                        if (touchDevice) {
                          const newHover = hovered?.row === row && hovered?.col === col ? null : { row, col }
                          setHovered(newHover)
                          setSelected(newHover ? { row, col, level } : null)
                        } else {
                          setHovered({ row, col })
                          setSelected({ row, col, level })
                        }
                      }}
                      onMouseEnter={() => !touchDevice && setHovered({ row, col })}
                      onMouseLeave={() => !touchDevice && setHovered(null)}
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

      {hovered && hovered.row !== hovered.col && (
        <div className="glass-strong rounded-xl p-3 sm:p-4 border border-[var(--border2)] w-full max-w-md mx-auto"
          style={{ animation: 'fadeInUp 0.2s ease both' }}>
          <div className="flex items-center gap-2 sm:gap-3 mb-2.5 sm:mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[hovered.row] }} />
              <span className="text-xs sm:text-sm font-display font-semibold text-white">{hovered.row}</span>
            </div>
            <span className="text-[var(--text4)] text-xs">+</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[hovered.col] }} />
              <span className="text-xs sm:text-sm font-display font-semibold text-white">{hovered.col}</span>
            </div>
            <div className="ml-auto">
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold uppercase"
                style={{
                  background: `${COMBO_LEVEL_COLORS[getLevel(hovered.row, hovered.col)]}18`,
                  color: COMBO_LEVEL_COLORS[getLevel(hovered.row, hovered.col)],
                  border: `1px solid ${COMBO_LEVEL_COLORS[getLevel(hovered.row, hovered.col)]}25`,
                }}>
                {COMBO_LEVEL_LABELS[getLevel(hovered.row, hovered.col)]}
              </span>
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-[var(--text3)] leading-relaxed mb-2.5">
            {COMBO_DESCRIPTIONS[getLevel(hovered.row, hovered.col)] || 'Use caution when combining these substance categories.'}
          </p>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3">
            {([hovered.row, hovered.col] as string[]).map(cat => {
              const drugs = subMap.get(cat) ?? []
              return (
                <div key={cat}>
                  <div className="text-[9px] sm:text-[10px] font-mono text-[var(--text4)] mb-1.5 uppercase tracking-wider">{cat} ({drugs.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {drugs.slice(0, maxPopoverDrugs).map(s => (
                      <button key={s.name}
                        onClick={() => onSelectSubstance?.(s)}
                        className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-mono transition-all hover:scale-105"
                        style={{
                          background: `${CATEGORY_COLORS[cat]}12`,
                          color: CATEGORY_COLORS[cat],
                          border: `1px solid ${CATEGORY_COLORS[cat]}20`,
                        }}>
                        {s.name}
                      </button>
                    ))}
                    {drugs.length > maxPopoverDrugs && (
                      <span className="text-[9px] sm:text-[10px] text-[var(--text4)] font-mono px-1">+{drugs.length - maxPopoverDrugs}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => { setHovered(null); setSelected(null) }}
            className="mt-2 text-[10px] text-[var(--text4)] hover:text-white transition-colors">
            Tap anywhere to close
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
        {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => (
          <div key={level} className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm border ${level === 'deadly' ? 'deadly-pulse' : ''}`}
              style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, borderColor: `color-mix(in srgb, ${color} 35%, transparent)` }} />
            <span className="text-[9px] sm:text-[10px] lg:text-[11px] text-[var(--text4)] font-mono">{COMBO_LEVEL_LABELS[level]}</span>
          </div>
        ))}
      </div>

      {touchDevice && N > 6 && (
        <p className="text-[9px] text-[var(--text4)] font-mono text-center">← scroll to see all →</p>
      )}

      {selected && (!hovered || selected.row === selected.col) && (
        <div className="info-card w-full max-w-md mx-auto" style={{ '--info-c': COMBO_LEVEL_COLORS[selected.level] } as React.CSSProperties}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] sm:text-xs font-display font-semibold" style={{ color: COMBO_LEVEL_COLORS[selected.level] }}>
              {selected.row} + {selected.col}
            </h4>
            <button onClick={() => setSelected(null)} className="text-[var(--text4)] hover:text-white transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold font-mono uppercase"
              style={{ background: `${COMBO_LEVEL_COLORS[selected.level]}15`, color: COMBO_LEVEL_COLORS[selected.level], border: `1px solid ${COMBO_LEVEL_COLORS[selected.level]}20` }}>
              {COMBO_LEVEL_LABELS[selected.level]}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[var(--text3)] leading-relaxed">
            {COMBO_DESCRIPTIONS[selected.level] || 'Use caution when combining these substance categories.'}
          </p>
        </div>
      )}
    </div>
  )
}
