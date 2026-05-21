'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import type { Substance, ComboLevel } from '@/lib/types'
import {
  CATEGORY_COLORS,
  COMBO_LEVEL_COLORS,
  COMBO_LEVEL_LABELS,
  COMBO_LEVEL_ORDER,
  COMBO_DESCRIPTIONS,
} from '@/lib/types'

interface ComboMatrixPCProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  onSelectSubstance?: (substance: Substance) => void
}

const MAX_CELL = 100
const MIN_CELL = 85
const LABEL_W = 110
const GAP = 3
const PAD = 6

export default function ComboMatrixPC({ substances, comboRules, onSelectSubstance }: ComboMatrixPCProps) {
  const [clickedCell, setClickedCell] = useState<string | null>(null)
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [popoverPos, setPopoverPos] = useState<React.CSSProperties>({})
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const categories = useMemo(() => [...new Set(substances.map(s => s.category))].sort(), [substances])
  const N = categories.length

  const getLevel = useCallback(
    (a: string, b: string): ComboLevel => {
      if (a === b) return 'low_risk'
      return comboRules[`${a}+${b}`] || comboRules[`${b}+${a}`] || 'caution'
    },
    [comboRules],
  )

  const subMap = useMemo(() => {
    const m = new Map<string, Substance[]>()
    for (const s of substances) {
      const arr = m.get(s.category) ?? []
      arr.push(s)
      m.set(s.category, arr)
    }
    return m
  }, [substances])

  const cellSize = useMemo(() => {
    if (N === 0) return 48
    const maxNameLen = Math.max(...categories.map(c => c.length))
    const nameBased = Math.round(maxNameLen * 7.5)
    return Math.max(MIN_CELL, Math.min(MAX_CELL, nameBased))
  }, [categories, N])

  const headerH = 36
  const cellFont = Math.max(10, Math.min(13, Math.round(cellSize * 0.21)))
  const labelFont = 12

  const hoverData = useMemo(() => {
    if (!hoveredCell) return null
    const [row, col] = hoveredCell.split('+')
    if (!row || !col) return null
    const level = getLevel(row, col)
    const color = COMBO_LEVEL_COLORS[level]
    return { row, col, level, color, rowDrugs: subMap.get(row) ?? [], colDrugs: subMap.get(col) ?? [] }
  }, [hoveredCell, getLevel, subMap])

  const clickData = useMemo(() => {
    if (!clickedCell) return null
    const [row, col] = clickedCell.split('+')
    if (!row || !col || row === col) return null
    const level = getLevel(row, col)
    const color = COMBO_LEVEL_COLORS[level]
    return { row, col, level, color, rowDrugs: subMap.get(row) ?? [], colDrugs: subMap.get(col) ?? [] }
  }, [clickedCell, getLevel, subMap])

  const handleHover = (e: React.MouseEvent, key: string) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => {
      const rect = e.currentTarget.getBoundingClientRect()
      setPopoverPos({
        position: 'fixed' as const,
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
      })
      setHoveredCell(key)
    }, 120)
  }

  const handleHoverOut = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setHoveredCell(null), 80)
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex items-center gap-3">
        <h3 className="text-sm lg:text-base font-display font-semibold text-[var(--text2)]">Combos</h3>
        <span className="text-[11px] text-[var(--text4)] font-mono">{N}×{N}</span>
      </div>

      <div
        className="w-full overflow-auto rounded-xl border border-[var(--border)]"
        style={{ maxHeight: '75vh', scrollbarWidth: 'thin' }}
      >
        <table style={{ borderCollapse: 'separate', borderSpacing: `${GAP}px`, padding: `${PAD}px` }}>
          <thead>
            <tr>
              <th
                className="text-[10px] text-[var(--text4)] font-mono select-none"
                style={{
                  position: 'sticky', left: 0, top: 0, zIndex: 4,
                  background: 'var(--bg3)',
                  width: LABEL_W, height: headerH,
                  verticalAlign: 'bottom', textAlign: 'right',
                  padding: '0 4px 4px 0',
                }}
              >
                ↘
              </th>
              {categories.map(cat => (
                <th
                  key={cat}
                  className="font-display font-semibold text-center"
                  style={{
                    position: 'sticky', top: 0, zIndex: 3,
                    background: 'var(--bg3)',
                    width: cellSize, height: headerH,
                    color: CATEGORY_COLORS[cat],
                    fontSize: `${labelFont}px`,
                    lineHeight: 1.2,
                    padding: '4px 2px',
                    verticalAlign: 'middle',
                  }}
                >
                  {cat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((row, ri) => (
              <tr key={row}>
                <th
                  className="font-display font-semibold text-right"
                  style={{
                    position: 'sticky', left: 0, zIndex: 2,
                    background: 'var(--bg3)',
                    width: LABEL_W, height: cellSize,
                    color: CATEGORY_COLORS[row],
                    fontSize: `${labelFont}px`,
                    lineHeight: 1.2,
                    paddingRight: 8,
                    verticalAlign: 'middle',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row}
                </th>
                {categories.map((col, ci) => {
                  const level = getLevel(row, col)
                  const key = `${row}+${col}`
                  const isSelf = ri === ci

                  if (isSelf) {
                    return (
                      <td
                        key={key}
                        className="text-center font-mono select-none text-[var(--text4)]"
                        style={{ width: cellSize, height: cellSize, background: 'rgba(255,255,255,0.02)', fontSize: `${cellFont}px` }}
                      >
                        —
                      </td>
                    )
                  }

                  const color = COMBO_LEVEL_COLORS[level]
                  return (
                    <td
                      key={key}
                      className={`text-center font-mono font-semibold rounded border ${level === 'deadly' ? 'deadly-pulse' : ''}`}
                      style={{
                        width: cellSize, height: cellSize,
                        background: `${color}18`,
                        borderColor: `${color}30`,
                        color,
                        fontSize: `${cellFont}px`,
                        boxShadow: level === 'deadly' ? `0 0 8px ${color}40` : undefined,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => setClickedCell(clickedCell === key ? null : key)}
                      onMouseEnter={e => handleHover(e, key)}
                      onMouseLeave={handleHoverOut}
                      aria-label={`${row} + ${col}: ${COMBO_LEVEL_LABELS[level]}`}
                      title={`${row} + ${col}: ${COMBO_LEVEL_LABELS[level]} — ${COMBO_DESCRIPTIONS[level] || 'Use caution.'}`}
                    >
                      {COMBO_LEVEL_LABELS[level].charAt(0)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hoverData && (
        <div className="glass-strong rounded-xl border border-[var(--border2)] p-3.5 z-50 pointer-events-none" style={{ ...popoverPos, width: 260, animation: 'fadeInUp 0.12s ease both' }}>
          <div style={{ position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '5px solid var(--border2)' }} />
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[hoverData.row] }} />
            <span className="text-[12px] font-display font-semibold text-white truncate" title={hoverData.row}>{hoverData.row}</span>
            <span className="text-[var(--text4)] text-xs">+</span>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[hoverData.col] }} />
            <span className="text-[12px] font-display font-semibold text-white truncate" title={hoverData.col}>{hoverData.col}</span>
            <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex-shrink-0" style={{ background: `${hoverData.color}14`, color: hoverData.color, border: `1px solid ${hoverData.color}25` }}>
              {COMBO_LEVEL_LABELS[hoverData.level]}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text3)] leading-relaxed mb-2.5" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {COMBO_DESCRIPTIONS[hoverData.level] || 'Use caution.'}
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {[hoverData.row, hoverData.col].map(cat => {
              const drugs = subMap.get(cat) ?? []
              const catColor = CATEGORY_COLORS[cat]
              return (
                <div key={cat}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: catColor }} />
                    <span className="text-[9px] font-mono text-[var(--text4)] uppercase truncate" title={cat}>{cat} ({drugs.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-0.5">
                    {drugs.slice(0, 3).map(s => (
                      <span key={s.name} className="text-[9px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: `${catColor}10`, color: catColor, border: `1px solid ${catColor}18` }}>{s.name}</span>
                    ))}
                    {drugs.length > 3 && <span className="text-[9px] text-[var(--text4)] font-mono self-center">+{drugs.length - 3}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {clickData && (
        <div className="glass-strong rounded-xl p-4 border border-[var(--border2)] w-full max-w-sm mx-auto" style={{ animation: 'fadeInUp 0.2s ease both' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[clickData.row] }} />
            <span className="text-xs font-display font-semibold text-white">{clickData.row}</span>
            <span className="text-[var(--text4)] text-xs">+</span>
            <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[clickData.col] }} />
            <span className="text-xs font-display font-semibold text-white">{clickData.col}</span>
            <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase" style={{ background: `${clickData.color}18`, color: clickData.color, border: `1px solid ${clickData.color}25` }}>
              {COMBO_LEVEL_LABELS[clickData.level]}
            </span>
          </div>
          <p className="text-xs text-[var(--text3)] leading-relaxed mb-2.5">{COMBO_DESCRIPTIONS[clickData.level] || 'Use caution.'}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[clickData.row, clickData.col].map(cat => {
              const drugs = subMap.get(cat) ?? []
              return (
                <div key={cat}>
                  <div className="text-[10px] font-mono text-[var(--text4)] mb-1 uppercase">{cat} ({drugs.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {drugs.slice(0, 5).map(s => (
                      <button key={s.name} onClick={() => onSelectSubstance?.(s)} className="text-[9px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: `${CATEGORY_COLORS[cat]}12`, color: CATEGORY_COLORS[cat], border: `1px solid ${CATEGORY_COLORS[cat]}20` }}>{s.name}</button>
                    ))}
                    {drugs.length > 5 && <span className="text-[9px] text-[var(--text4)] font-mono">+{drugs.length - 5}</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <button onClick={() => setClickedCell(null)} className="mt-2 text-[10px] text-[var(--text4)] hover:text-white transition-colors w-full text-center">Close</button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => (
          <div key={level} className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-sm border ${level === 'deadly' ? 'deadly-pulse' : ''}`} style={{ background: `${color}18`, borderColor: `${color}35` }} />
            <span className="text-[11px] text-[var(--text4)] font-mono">{COMBO_LEVEL_LABELS[level]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
