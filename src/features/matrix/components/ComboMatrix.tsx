'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import type { Substance, ComboLevel } from '@/lib/types'
import { CATEGORY_COLORS, COMBO_LEVEL_COLORS, COMBO_LEVEL_LABELS, COMBO_DESCRIPTIONS } from '@/lib/types'

interface ComboMatrixProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  onSelectSubstance?: (substance: Substance) => void
}

export default function ComboMatrix({ substances, comboRules, onSelectSubstance }: ComboMatrixProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [selectedSub, setSelectedSub] = useState<Substance | null>(null)
  const [detailPair, setDetailPair] = useState<{ a: string; b: string } | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  if (isMobile) {
    const subs = selectedSub ? subMap.get(selectedSub.category) ?? [] : []

    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-display font-semibold text-[var(--text2)]">Drug Matrix</h3>
        </div>

        {!selectedSub ? (
          <div className="space-y-1">
            <p className="text-[11px] font-mono text-[var(--text4)] mb-2">Select a substance</p>
            {categories.map(cat => {
              const drugs = subMap.get(cat) ?? []
              const color = CATEGORY_COLORS[cat]
              return (
                <div key={cat} className="mb-2">
                  <div className="flex items-center gap-1.5 mb-1.5 px-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-[10px] font-mono text-[var(--text4)] uppercase tracking-wider">{cat}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {drugs.map(s => (
                      <button
                        key={s.name}
                        onClick={() => setSelectedSub(s)}
                        className="text-[12px] px-3 py-2 rounded-xl font-display font-medium border transition-all"
                        style={{
                          borderColor: `${color}25`,
                          background: `${color}08`,
                          color: color,
                        }}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => setSelectedSub(null)}
              className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text4)] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to substances
            </button>

            <div className="flex items-center gap-2 px-2 py-3 rounded-xl border" style={{ borderColor: `${CATEGORY_COLORS[selectedSub.category]}30`, background: `${CATEGORY_COLORS[selectedSub.category]}06` }}>
              <span className="w-3 h-3 rounded-full" style={{ background: CATEGORY_COLORS[selectedSub.category] }} />
              <span className="text-base font-display font-bold text-white">{selectedSub.name}</span>
              <span className="text-[10px] font-mono text-[var(--text4)]">{selectedSub.category}</span>
            </div>

            {categories.map(other => {
              const level = getLevel(selectedSub.category, other)
              const color = COMBO_LEVEL_COLORS[level]
              const otherDrugs = subMap.get(other) ?? []
              const isSame = selectedSub.category === other

              return (
                <div key={other}
                  className="rounded-xl border overflow-hidden"
                  style={{
                    borderColor: 'var(--border)',
                    background: isSame ? 'rgba(255,255,255,0.02)' : undefined,
                  }}
                >
                  <button
                    onClick={() => !isSame && setDetailPair({ a: selectedSub.category, b: other })}
                    className={`w-full flex items-center gap-3 px-4 py-3 ${isSame ? 'cursor-default' : 'cursor-pointer hover:bg-white/5'}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: isSame ? 'var(--text4)' : CATEGORY_COLORS[other] }} />
                    <span className="text-[14px] font-display font-semibold text-[var(--text2)] flex-1 text-left">{other}</span>
                    {isSame ? (
                      <span className="text-[10px] font-mono text-[var(--text4)]">SAME</span>
                    ) : (
                      <span
                        className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wide"
                        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
                      >
                        {COMBO_LEVEL_LABELS[level]}
                      </span>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {detailPair && (() => {
          const level = getLevel(detailPair.a, detailPair.b)
          const color = COMBO_LEVEL_COLORS[level]
          return (
            <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setDetailPair(null)}>
              <div className="glass-strong rounded-2xl p-5 w-full max-w-sm border border-[var(--border2)]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[detailPair.a] }} />
                  <span className="text-sm font-display font-bold text-white">{detailPair.a}</span>
                  <span className="text-[var(--text4)]">+</span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[detailPair.b] }} />
                  <span className="text-sm font-display font-bold text-white">{detailPair.b}</span>
                  <span className="ml-auto px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase"
                    style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                    {COMBO_LEVEL_LABELS[level]}
                  </span>
                </div>
                <p className="text-[13px] text-[var(--text3)] leading-relaxed mb-4">
                  {COMBO_DESCRIPTIONS[level] || 'Use caution with this combination.'}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[detailPair.a, detailPair.b].map(cat => {
                    const drugs = subMap.get(cat) ?? []
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
                          <span className="text-[10px] font-mono text-[var(--text4)] uppercase">{cat}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {drugs.slice(0, 4).map(s => (
                            <button
                              key={s.name}
                              onClick={() => { onSelectSubstance?.(s); setDetailPair(null); setSelectedSub(s) }}
                              className="text-[10px] px-2 py-1 rounded-full font-mono transition-colors"
                              style={{
                                background: `${CATEGORY_COLORS[cat]}10`,
                                color: CATEGORY_COLORS[cat],
                                border: `1px solid ${CATEGORY_COLORS[cat]}20`,
                              }}
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button
                  onClick={() => setDetailPair(null)}
                  className="w-full py-2 text-[12px] font-mono text-[var(--text4)] hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  Close
                </button>
              </div>
            </div>
          )
        })()}

        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center pt-2">
          {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => (
            <div key={level} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: `${color}40`, border: `1px solid ${color}40` }} />
              <span className="text-[10px] font-mono text-[var(--text4)]">{COMBO_LEVEL_LABELS[level]}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex items-center gap-3">
        <h3 className="text-base font-display font-semibold text-[var(--text2)]">Drug Matrix</h3>
        <span className="text-[11px] text-[var(--text4)] font-mono">{categories.length} categories</span>
      </div>

      <div className="overflow-x-auto w-full">
        <div className="rounded-xl overflow-hidden border border-[var(--border)]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left text-[11px] font-mono text-[var(--text4)] uppercase tracking-wider bg-[rgba(255,255,255,0.02)] border-b border-[var(--border)]">Category</th>
                {categories.map(cat => (
                  <th key={cat}
                    className="p-3 text-center text-[11px] font-display font-semibold bg-[rgba(255,255,255,0.02)] border-b border-[var(--border)]"
                    style={{ color: CATEGORY_COLORS[cat], minWidth: 90 }}
                  >
                    {cat}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((row, ri) => (
                <tr key={row} className={ri % 2 === 0 ? 'bg-transparent' : 'bg-[rgba(255,255,255,0.01)]'}>
                  <td
                    className="p-3 text-left text-[12px] font-display font-semibold border-r border-[var(--border)]"
                    style={{ color: CATEGORY_COLORS[row] }}
                  >
                    {row}
                  </td>
                  {categories.map((col, ci) => {
                    const level = getLevel(row, col)
                    const color = COMBO_LEVEL_COLORS[level]
                    const isSame = ri === ci

                    if (isSame) {
                      return (
                        <td key={`${row}-${col}`} className="p-3 text-center border border-[var(--border)]">
                          <span className="text-[11px] font-mono text-[var(--text4)]">—</span>
                        </td>
                      )
                    }

                    return (
                      <td key={`${row}-${col}`} className="p-2 border border-[var(--border)] text-center">
                        <button
                          onClick={() => setDetailPair({ a: row, b: col })}
                          className="w-full py-2 px-3 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all hover:scale-105"
                          style={{
                            background: `${color}12`,
                            color,
                            border: `1px solid ${color}30`,
                          }}
                        >
                          {COMBO_LEVEL_LABELS[level]}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detailPair && (() => {
        const level = getLevel(detailPair.a, detailPair.b)
        const color = COMBO_LEVEL_COLORS[level]
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setDetailPair(null)}>
            <div className="glass-strong rounded-2xl p-6 w-full max-w-lg border border-[var(--border2)]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full" style={{ background: CATEGORY_COLORS[detailPair.a] }} />
                <span className="text-base font-display font-bold text-white">{detailPair.a}</span>
                <span className="text-[var(--text4)] font-display">+</span>
                <span className="w-3 h-3 rounded-full" style={{ background: CATEGORY_COLORS[detailPair.b] }} />
                <span className="text-base font-display font-bold text-white">{detailPair.b}</span>
                <span className="ml-auto px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wide"
                  style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                  {COMBO_LEVEL_LABELS[level]}
                </span>
              </div>
              <p className="text-[13px] text-[var(--text3)] leading-relaxed mb-5">
                {COMBO_DESCRIPTIONS[level] || 'Use caution with this combination.'}
              </p>
              <div className="grid grid-cols-2 gap-4 mb-5">
                {[detailPair.a, detailPair.b].map(cat => {
                  const drugs = subMap.get(cat) ?? []
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
                        <span className="text-[11px] font-mono text-[var(--text4)] uppercase tracking-wider">{cat}</span>
                        <span className="text-[10px] font-mono text-[var(--text4)]">({drugs.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {drugs.slice(0, 5).map(s => (
                          <button
                            key={s.name}
                            onClick={() => { onSelectSubstance?.(s); setDetailPair(null) }}
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
                onClick={() => setDetailPair(null)}
                className="w-full py-2.5 text-[12px] font-mono text-[var(--text4)] hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                Close
              </button>
            </div>
          </div>
        )
      })()}

      <div className="flex flex-wrap gap-4 justify-center">
        {(Object.entries(COMBO_LEVEL_COLORS) as [ComboLevel, string][]).map(([level, color]) => (
          <div key={level} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border" style={{ background: `${color}15`, borderColor: `${color}35` }} />
            <span className="text-[11px] text-[var(--text4)] font-mono">{COMBO_LEVEL_LABELS[level]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}