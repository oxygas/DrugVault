'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Substance, ComboLevel } from '@/lib/types'
import {
  CATEGORY_COLORS,
  COMBO_LEVEL_COLORS,
  COMBO_LEVEL_LABELS,
  COMBO_LEVEL_ORDER,
  COMBO_DESCRIPTIONS,
} from '@/lib/types'

interface ComboMatrixPhoneProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  onSelectSubstance?: (substance: Substance) => void
}

export default function ComboMatrixPhone({ substances, comboRules, onSelectSubstance }: ComboMatrixPhoneProps) {
  const categories = useMemo(() => [...new Set(substances.map(s => s.category))].sort(), [substances])
  const [selectedCat, setSelectedCat] = useState(categories[0])

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

  const interactions = useMemo(() => {
    if (!selectedCat) return []
    return categories
      .filter(c => c !== selectedCat)
      .map(other => ({ other, level: getLevel(selectedCat, other) as ComboLevel }))
      .sort((a, b) => COMBO_LEVEL_ORDER.indexOf(a.level) - COMBO_LEVEL_ORDER.indexOf(b.level))
  }, [selectedCat, categories, getLevel])

  const deadlyCount = useMemo(() => {
    let count = 0
    for (const a of categories) {
      for (const b of categories) {
        if (a >= b) continue
        if (getLevel(a, b) === 'deadly') count++
      }
    }
    return count
  }, [categories, getLevel])

  const countByLevel = useMemo(() => {
    if (!selectedCat) return {}
    const counts: Partial<Record<ComboLevel, number>> = {}
    for (const { level } of interactions) {
      counts[level] = (counts[level] || 0) + 1
    }
    return counts
  }, [interactions])

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-display font-semibold text-[var(--text2)]">Combo Matrix</h3>
        <span className="text-[10px] font-mono text-[var(--text4)]">{categories.length}×{categories.length}</span>
        {deadlyCount > 0 && (
          <span className="ml-auto text-[9px] font-mono font-bold text-[#b91c1c] px-1.5 py-0.5 rounded" style={{ background: '#b91c1c12', border: '1px solid #b91c1c25' }}>
            {deadlyCount} deadly
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1">
        {categories.map(cat => {
          const active = selectedCat === cat
          const color = CATEGORY_COLORS[cat]
          const count = (subMap.get(cat) ?? []).length
          const short = cat.replace(/[aeiou]/gi, '').slice(0, 3).toUpperCase() || cat.slice(0, 2).toUpperCase()
          return (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className="rounded-lg text-center transition-all relative overflow-hidden"
              style={{
                background: active ? `${color}18` : 'var(--surface)',
                border: active ? `1.5px solid ${color}50` : '1px solid var(--border)',
                padding: '6px 4px',
              }}
            >
              <div className="flex items-center gap-1.5 justify-center mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-[9px] font-mono font-bold truncate" style={{ color }}>{short}</span>
              </div>
              <div className="text-[7px] font-mono text-[var(--text4)] truncate">{count} subs</div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-1.5 px-0.5">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[selectedCat] }} />
        <span className="text-[12px] font-display font-semibold text-[var(--text2)]">{selectedCat}</span>
        <span className="text-[9px] font-mono text-[var(--text4)]">{(subMap.get(selectedCat) ?? []).length} substances</span>
      </div>

      <div className="flex gap-1 flex-wrap">
        {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => {
          const c = countByLevel[level]
          return (
            <span
              key={level}
              className="text-[8px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1"
              style={{ background: `${color}10`, color, border: `1px solid ${color}18` }}
            >
              <span className="w-1.5 h-1.5 rounded-sm" style={{ background: `${color}30` }} />
              {COMBO_LEVEL_LABELS[level]}{c !== undefined ? ` ${c}` : ''}
            </span>
          )
        })}
      </div>

      <div className="flex flex-col gap-1">
        {interactions.map(({ other, level }) => {
          const color = COMBO_LEVEL_COLORS[level]
          const isHighRisk = level === 'deadly' || level === 'dangerous'
          return (
            <div
              key={other}
              className="rounded-lg border overflow-hidden"
              style={{
                borderColor: isHighRisk ? color + '25' : 'var(--border)',
                borderLeft: `3px solid ${color}`,
              }}
            >
              <div className="flex items-center gap-2 px-2.5 py-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[other] }} />
                <span className="text-[11px] font-display font-semibold text-[var(--text2)] flex-1 truncate">{other}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase flex-shrink-0 ${level === 'deadly' ? 'deadly-pulse' : ''}`}
                  style={{ background: `${color}14`, color, border: `1px solid ${color}20` }}
                >
                  {COMBO_LEVEL_LABELS[level]}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-x-2 gap-y-0.5 justify-center pt-0.5">
        {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => (
          <div key={level} className="flex items-center gap-0.5">
            <span className={`w-1.5 h-1.5 rounded-sm ${level === 'deadly' ? 'deadly-pulse' : ''}`} style={{ background: `${color}30`, border: `1px solid ${color}40` }} />
            <span className="text-[7px] text-[var(--text4)] font-mono">{COMBO_LEVEL_LABELS[level]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
