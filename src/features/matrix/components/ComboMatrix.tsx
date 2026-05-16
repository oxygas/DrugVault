'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Substance, Category, ComboLevel } from '@/lib/types'
import { CATEGORY_COLORS, COMBO_LEVEL_COLORS, COMBO_LEVEL_LABELS, COMBO_DESCRIPTIONS } from '@/lib/types'

interface ComboMatrixProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  onSelectSubstance?: (substance: Substance) => void
}

export default function ComboMatrix({ substances, comboRules, onSelectSubstance }: ComboMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: Category; col: Category } | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ row: Category; col: Category; level: ComboLevel } | null>(null)

  const categories = useMemo(
    () => [...new Set(substances.map(s => s.category))].sort() as Category[],
    [substances]
  )

  const getLevel = useCallback((row: Category, col: Category): ComboLevel => {
    if (row === col) return 'low_risk'
    return comboRules[`${row}+${col}`] || comboRules[`${col}+${row}`] || 'caution'
  }, [comboRules])

  const getLevelStyle = (level: ComboLevel) => {
    const color = COMBO_LEVEL_COLORS[level]
    return {
      background: `color-mix(in srgb, ${color} 18%, transparent)`,
      borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
      color,
      boxShadow: level === 'deadly' ? `0 0 10px ${color}50, inset 0 0 6px ${color}15` : undefined,
    }
  }

  return (
    <div className="space-y-4">
    <div className="flex items-center gap-3 mb-2 justify-center">
      <h3 className="text-sm lg:text-base font-display font-semibold text-[var(--text2)]">Drug Combination Matrix</h3>
      <span className="text-[11px] lg:text-xs text-[var(--text4)] font-mono">{categories.length}×{categories.length}</span>
    </div>

    <div className="overflow-x-auto -mx-2 px-2 pb-2 flex justify-center">
      <div className="inline-block min-w-fit max-w-full">
        <div
          className="grid gap-[2px] lg:gap-[3px] glass rounded-xl p-2.5 lg:p-3 border border-[var(--border)]"
          style={{
            gridTemplateColumns: `minmax(48px, 80px) repeat(${categories.length}, minmax(36px, 1fr))`,
            gridTemplateRows: `32px repeat(${categories.length}, 1fr)`,
          }}
        >
          <div className="flex items-center justify-center text-[9px] lg:text-[10px] text-[var(--text4)] font-mono uppercase tracking-wider">
            → ↓
          </div>
          {categories.map(col => (
            <div
              key={col}
              className="flex items-center justify-center text-[9px] sm:text-[10px] lg:text-[11px] font-display font-medium text-[var(--text3)] px-1 truncate"
              style={{ color: CATEGORY_COLORS[col] }}
            >
              {col}
            </div>
          ))}

          {categories.map((row, ri) => (
            <div key={row} className="contents">
              <div
                className="flex items-center justify-end text-[9px] sm:text-[10px] lg:text-[11px] font-display font-medium pr-1.5 truncate"
                style={{ color: CATEGORY_COLORS[row] }}
              >
                {row}
              </div>
              {categories.map((col, ci) => {
                const level = getLevel(row, col)
                const isHovered = hoveredCell?.row === row && hoveredCell?.col === col
                const isCrossHovered = hoveredCell && (hoveredCell.row === row || hoveredCell.col === col)
                const isSelected = selectedCell?.row === row && selectedCell?.col === col
                const style = getLevelStyle(level)

                return (
                  <button
                    key={`${row}-${col}`}
                    className={`combo-cell relative flex items-center justify-center rounded-md text-[7px] sm:text-[9px] lg:text-[10px] font-mono font-semibold transition-all duration-150 border min-h-[28px] lg:min-h-[34px] ${level === 'deadly' ? 'deadly-pulse' : ''} ${isSelected ? 'ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-transparent' : ''}`}
                    style={{
                      ...style,
                      opacity: isCrossHovered && !isHovered ? 0.55 : 1,
                      transform: isHovered ? 'scale(1.18)' : 'scale(1)',
                      zIndex: isHovered ? 10 : 1,
                    }}
                    onMouseEnter={() => setHoveredCell({ row, col })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => setSelectedCell({ row, col, level })}
                    aria-label={`${row} + ${col}: ${COMBO_LEVEL_LABELS[level]}`}
                  >
                    {row === col ? '—' : COMBO_LEVEL_LABELS[level].charAt(0)}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="flex flex-wrap gap-3 mt-2 justify-center">
      {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => (
        <div key={level} className="flex items-center gap-1.5">
          <span
            className={`w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-sm border ${level === 'deadly' ? 'deadly-pulse' : ''}`}
            style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, borderColor: `color-mix(in srgb, ${color} 35%, transparent)` }}
          />
          <span className="text-[10px] lg:text-[11px] text-[var(--text4)] font-mono">{COMBO_LEVEL_LABELS[level]}</span>
        </div>
      ))}
    </div>

      {selectedCell && (
        <div className="info-card" style={{ '--info-c': COMBO_LEVEL_COLORS[selectedCell.level] } as React.CSSProperties}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-display font-semibold" style={{ color: COMBO_LEVEL_COLORS[selectedCell.level] }}>
              {selectedCell.row} + {selectedCell.col}
            </h4>
            <button onClick={() => setSelectedCell(null)} className="text-[var(--text4)] hover:text-white transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono uppercase"
              style={{ background: `${COMBO_LEVEL_COLORS[selectedCell.level]}15`, color: COMBO_LEVEL_COLORS[selectedCell.level], border: `1px solid ${COMBO_LEVEL_COLORS[selectedCell.level]}20` }}
            >
              {COMBO_LEVEL_LABELS[selectedCell.level]}
            </span>
          </div>
          <p className="text-xs text-[var(--text3)] leading-relaxed">
            {COMBO_DESCRIPTIONS[selectedCell.level] || 'Use caution when combining these substance categories.'}
          </p>
        </div>
      )}
    </div>
  )
}
