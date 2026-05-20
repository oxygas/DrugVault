'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Substance, ComboLevel } from '@/lib/types'
import { CATEGORY_COLORS, COMBO_LEVEL_COLORS, COMBO_LEVEL_LABELS, COMBO_DESCRIPTIONS, COMBO_LEVEL_ORDER } from '@/lib/types'

interface ComboMatrixProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  onSelectSubstance?: (substance: Substance) => void
}

export default function ComboMatrix({ substances, comboRules, onSelectSubstance }: ComboMatrixProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedPair, setExpandedPair] = useState<string | null>(null)

  const categories = useMemo(
    () => [...new Set(substances.map(s => s.category))].sort(),
    [substances]
  )

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

  const interactions = useMemo(() => {
    if (!selectedCategory) return []
    return categories
      .filter(c => c !== selectedCategory)
      .map(other => ({
        other,
        level: getLevel(selectedCategory, other) as ComboLevel,
      }))
      .sort((a, b) => COMBO_LEVEL_ORDER.indexOf(a.level) - COMBO_LEVEL_ORDER.indexOf(b.level))
  }, [selectedCategory, categories, getLevel])

  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-[100vw] px-2 pb-2">
      <div className="flex items-center gap-2">
        <h3 className="text-xs sm:text-sm font-display font-semibold text-[var(--text2)]">Combo Matrix</h3>
        <span className="text-[10px] sm:text-[11px] text-[var(--text4)] font-mono">{categories.length}</span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin -mx-2 px-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat === selectedCategory ? null : cat)
              setExpandedPair(null)
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] sm:text-xs font-display font-medium whitespace-nowrap flex-shrink-0 transition-all border ${
              selectedCategory === cat
                ? 'text-white border-transparent'
                : 'text-[var(--text3)] border-[var(--border)] hover:border-[var(--border2)]'
            }`}
            style={selectedCategory === cat ? { background: CATEGORY_COLORS[cat], boxShadow: `0 0 12px ${CATEGORY_COLORS[cat]}40` } : {}}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
            {cat}
          </button>
        ))}
      </div>

      {selectedCategory && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {interactions.map(({ other, level }) => {
            const color = COMBO_LEVEL_COLORS[level]
            const pairKey = `${selectedCategory}+${other}`
            const expanded = expandedPair === pairKey
            return (
              <button
                key={pairKey}
                onClick={() => setExpandedPair(expanded ? null : pairKey)}
                className="text-left w-full rounded-xl p-3 border transition-all"
                style={{
                  background: `${color}08`,
                  borderColor: expanded ? `${color}40` : 'var(--border)',
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[other] }} />
                  <span className="text-xs sm:text-sm font-display font-semibold text-white truncate">{other}</span>
                  <span
                    className="ml-auto px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold uppercase flex-shrink-0"
                    style={{ background: `${color}18`, color, border: `1px solid ${color}25` }}
                  >
                    {COMBO_LEVEL_LABELS[level]}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[var(--text3)] leading-relaxed">
                  {COMBO_DESCRIPTIONS[level]}
                </p>

                {expanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-[var(--border)]">
                    <div className="grid grid-cols-2 gap-2">
                      {[selectedCategory, other].map(cat => {
                        const drugs = subMap.get(cat) ?? []
                        return (
                          <div key={cat}>
                            <div className="text-[9px] font-mono text-[var(--text4)] mb-1 uppercase tracking-wide">
                              {cat} <span className="text-[var(--text5)]">({drugs.length})</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              {drugs.slice(0, 6).map(s => (
                                <button
                                  key={s.name}
                                  onClick={e => {
                                    e.stopPropagation()
                                    onSelectSubstance?.(s)
                                  }}
                                  className="text-[9px] px-1.5 py-0.5 rounded font-mono text-left truncate"
                                  style={{ background: `${CATEGORY_COLORS[cat]}10`, color: CATEGORY_COLORS[cat] }}
                                >
                                  {s.name}
                                </button>
                              ))}
                              {drugs.length > 6 && (
                                <span className="text-[9px] text-[var(--text4)] font-mono">+{drugs.length - 6} more</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {!selectedCategory && (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
          <p className="text-xs sm:text-sm text-[var(--text4)] font-display">Select a category above to explore interactions</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
        {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => (
          <div key={level} className="flex items-center gap-1">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm border" style={{ background: `${color}18`, borderColor: `${color}35` }} />
            <span className="text-[9px] sm:text-[10px] text-[var(--text4)] font-mono">{COMBO_LEVEL_LABELS[level]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
