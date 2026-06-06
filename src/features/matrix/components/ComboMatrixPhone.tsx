'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
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

import { useUIStore } from '@/stores/ui'

export default function ComboMatrixPhone({ substances, comboRules, onSelectSubstance }: ComboMatrixPhoneProps) {
  const categories = useMemo(() => [...new Set(substances.map(s => s.category))].sort(), [substances])
  const matrixCategory = useUIStore(s => s.matrixCategory)
  const setMatrixCategory = useUIStore(s => s.setMatrixCategory)
  
  const [selectedCat, setSelectedCat] = useState(matrixCategory || categories[0])
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  
  const [prevMatrixCat, setPrevMatrixCat] = useState(matrixCategory)
  if (matrixCategory !== prevMatrixCat) {
    setPrevMatrixCat(matrixCategory)
    if (matrixCategory) setSelectedCat(matrixCategory)
  }

  const handleSetCategory = (cat: string) => {
    setSelectedCat(cat)
    setMatrixCategory(cat)
  }

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
  }, [interactions, selectedCat])

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
              onClick={() => {
                handleSetCategory(cat)
                setExpandedCat(null)
              }}
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

      <div className="flex flex-col gap-1.5">
        <div className="flex w-full h-2 rounded-full overflow-hidden opacity-90">
          {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => {
            const c = countByLevel[level] || 0
            if (c === 0) return null
            const pct = (c / interactions.length) * 100
            return <div key={level} style={{ width: `${pct}%`, background: color }} title={`${c} ${COMBO_LEVEL_LABELS[level]}`} />
          })}
        </div>
        <div className="flex gap-1 flex-wrap justify-between px-0.5">
          {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => {
            const c = countByLevel[level]
            if (!c) return null
            return (
              <span key={level} className="text-[9px] font-mono flex items-center gap-1" style={{ color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                {c}
              </span>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {interactions.map(({ other, level }) => {
          const color = COMBO_LEVEL_COLORS[level]
          const isHighRisk = level === 'deadly' || level === 'dangerous'
          const isExpanded = expandedCat === other
          const rowDrugs = subMap.get(selectedCat) ?? []
          const colDrugs = subMap.get(other) ?? []

          return (
            <div
              key={other}
              className="rounded-lg border overflow-hidden transition-all duration-200"
              style={{
                borderColor: isHighRisk ? color + '25' : (isExpanded ? 'var(--border2)' : 'var(--border)'),
                borderLeft: `3px solid ${color}`,
                background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
              }}
            >
              <button 
                onClick={() => setExpandedCat(isExpanded ? null : other)}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[other] }} />
                <span className="text-[11px] font-display font-semibold text-[var(--text2)] flex-1 truncate">{other}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase flex-shrink-0 ${level === 'deadly' ? 'deadly-pulse' : ''}`}
                  style={{ background: `${color}14`, color, border: `1px solid ${color}20` }}
                >
                  {COMBO_LEVEL_LABELS[level]}
                </span>
                <svg className={`w-3.5 h-3.5 text-[var(--text4)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-[var(--border)] mt-1 animate-in slide-in-from-top-2 fade-in duration-200">
                  <p className="text-[10px] text-[var(--text3)] leading-relaxed mb-3">
                    {COMBO_DESCRIPTIONS[level] || 'Use caution.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[9px] font-mono text-[var(--text4)] mb-1.5 uppercase">{selectedCat}</div>
                      <div className="flex flex-wrap gap-1">
                        {rowDrugs.slice(0, 5).map(s => (
                          <button key={s.name} onClick={() => onSelectSubstance?.(s)} className="text-[9px] px-1.5 py-0.5 rounded-full font-mono text-left" style={{ background: `${CATEGORY_COLORS[selectedCat]}12`, color: CATEGORY_COLORS[selectedCat], border: `1px solid ${CATEGORY_COLORS[selectedCat]}20` }}>{s.name}</button>
                        ))}
                        {rowDrugs.length > 5 && <span className="text-[9px] text-[var(--text4)] font-mono self-center">+{rowDrugs.length - 5}</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono text-[var(--text4)] mb-1.5 uppercase">{other}</div>
                      <div className="flex flex-wrap gap-1">
                        {colDrugs.slice(0, 5).map(s => (
                          <button key={s.name} onClick={() => onSelectSubstance?.(s)} className="text-[9px] px-1.5 py-0.5 rounded-full font-mono text-left" style={{ background: `${CATEGORY_COLORS[other]}12`, color: CATEGORY_COLORS[other], border: `1px solid ${CATEGORY_COLORS[other]}20` }}>{s.name}</button>
                        ))}
                        {colDrugs.length > 5 && <span className="text-[9px] text-[var(--text4)] font-mono self-center">+{colDrugs.length - 5}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
