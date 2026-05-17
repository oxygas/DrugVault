'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Substance, Category, ComboLevel } from '@/lib/types'
import { CATEGORY_COLORS, HARM_LEVEL_COLORS, COMBO_LEVEL_COLORS, COMBO_LEVEL_LABELS, COMBO_DESCRIPTIONS } from '@/lib/types'

interface DrugCheckerProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  substanceCombos?: { substanceA: string; substanceB: string; level: ComboLevel; note?: string | null }[]
}

export default function DrugChecker({ substances, comboRules, substanceCombos }: DrugCheckerProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Substance[]>([])
  const [results, setResults] = useState<{
    pairs: { a: Substance; b: Substance; level: ComboLevel; description: string; note?: string | null }[]
    worstLevel: ComboLevel
    drugNames: string[]
  } | null>(null)

  const subComboMap = useMemo(() => {
    const m = new Map<string, { level: ComboLevel; note?: string | null }>()
    if (!substanceCombos) return m
    const aliasMap = new Map<string, string>()
    for (const s of substances) {
      const key = s.name.toLowerCase()
      aliasMap.set(key, key)
      for (const a of s.aliases) aliasMap.set(a.toLowerCase(), key)
    }
    for (const c of substanceCombos) {
      const aR = aliasMap.get(c.substanceA.toLowerCase()) ?? c.substanceA.toLowerCase()
      const bR = aliasMap.get(c.substanceB.toLowerCase()) ?? c.substanceB.toLowerCase()
      m.set(`${aR}+${bR}`, { level: c.level, note: c.note })
      m.set(`${bR}+${aR}`, { level: c.level, note: c.note })
    }
    return m
  }, [substanceCombos, substances])

  const filtered = useMemo(() =>
    query.length >= 1
      ? substances.filter(s =>
          s.name.toLowerCase().includes(query.toLowerCase()) &&
          !selected.find(s2 => s2.name === s.name)
        ).slice(0, 8)
      : [],
    [query, substances, selected]
  )

  const getComboLevel = useCallback((a: Category, b: Category): ComboLevel => {
    if (a === b) return 'low_risk'
    return comboRules[`${a}+${b}`] || comboRules[`${b}+${a}`] || 'caution'
  }, [comboRules])

  const addDrug = useCallback((sub: Substance) => {
    setSelected(prev => [...prev, sub])
    setQuery('')
    setResults(null)
  }, [])

  const removeDrug = useCallback((name: string) => {
    setSelected(prev => prev.filter(s => s.name !== name))
    setResults(null)
  }, [])

  const checkAll = useCallback(() => {
    if (selected.length < 2) return
    const pairs: { a: Substance; b: Substance; level: ComboLevel; description: string; note?: string | null }[] = []
    const levelOrder: Record<string, number> = { safe: 0, low_risk: 1, caution: 2, unsafe: 3, dangerous: 4, deadly: 5 }
    let worst = 'safe' as ComboLevel
    let worstOrder = 0

    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        const a = selected[i]
        const b = selected[j]
        const aLow = a.name.toLowerCase()
        const bLow = b.name.toLowerCase()
        const scKey = `${aLow}+${bLow}`
        const sc = subComboMap.get(scKey)
        let level: ComboLevel
        let description: string
        let note: string | null | undefined

        if (sc) {
          level = sc.level
          description = sc.note ?? COMBO_DESCRIPTIONS[level] ?? ''
          note = sc.note
        } else {
          level = getComboLevel(a.category, b.category)
          description = COMBO_DESCRIPTIONS[level] ?? ''
        }

        pairs.push({ a, b, level, description, note })
        const order = levelOrder[level] ?? 2
        if (order > worstOrder) {
          worstOrder = order
          worst = level
        }
      }
    }

    setResults({ pairs, worstLevel: worst, drugNames: selected.map(s => s.name) })
  }, [selected, subComboMap, getComboLevel])

  const clearAll = useCallback(() => {
    setSelected([])
    setResults(null)
    setQuery('')
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={selected.length === 0 ? 'Search and add substances...' : 'Add another substance...'}
                className="w-full pl-10 pr-4 py-3 rounded-xl glass border border-[var(--border2)] text-sm text-white placeholder:text-[var(--text4)] focus:outline-none focus:border-[var(--accent)]/40 transition-all bg-transparent"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text4)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>

          {filtered.length > 0 && (
            <div className="absolute z-20 w-full mt-1 glass-strong rounded-xl overflow-hidden shadow-xl border border-[var(--border2)] max-h-56 overflow-y-auto">
              {filtered.map(s => (
                <button
                  key={s.name}
                  onClick={() => addDrug(s)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[rgba(255,255,255,0.04)] transition-colors text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[s.category], boxShadow: `0 0 8px ${CATEGORY_COLORS[s.category]}50` }} />
                  <span className="text-sm text-white font-display truncate flex-1">{s.name}</span>
                  <span className="text-[10px] text-[var(--text4)] font-mono">{s.category}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase" style={{ background: `${HARM_LEVEL_COLORS[s.harmLevel]}15`, color: HARM_LEVEL_COLORS[s.harmLevel] }}>
                    {s.harmLevel}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selected.map((s, i) => (
            <div
              key={s.name}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl glass border border-[var(--border)] transition-all duration-200 hover:border-[var(--accent)]/30 hover:shadow-[0_0_20px_var(--accent-glow)]"
              style={{ animation: `fadeInUp 0.3s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s both` }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[s.category] }} />
              <span className="text-sm text-white font-display">{s.name}</span>
              <button
                onClick={() => removeDrug(s.name)}
                className="p-0.5 rounded-full text-[var(--text4)] hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                aria-label={`Remove ${s.name}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <button
            onClick={clearAll}
            className="text-[11px] text-[var(--text4)] hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-[rgba(255,255,255,0.04)]"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={checkAll}
          disabled={selected.length < 2}
          className="cta-btn flex items-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
          style={{
            background: selected.length >= 2 && results
              ? (() => {
                  const order: Record<string, number> = { safe: 0, low_risk: 1, caution: 2, unsafe: 3, dangerous: 4, deadly: 5 }
                  const worst = results?.worstLevel
                  const o = worst ? order[worst] ?? 2 : 2
                  if (o >= 4) return 'linear-gradient(135deg, #ef4444, #dc2626)'
                  if (o >= 3) return 'linear-gradient(135deg, #f97316, #ea580c)'
                  if (o >= 2) return 'linear-gradient(135deg, #eab308, #ca8a04)'
                  return 'linear-gradient(135deg, var(--accent), #7c3aed)'
                })()
              : 'linear-gradient(135deg, var(--accent), #7c3aed)'
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {results ? 'Re-check Interactions' : 'Check Interactions'}
        </button>
        <span className="text-[11px] text-[var(--text4)] font-mono">
          {selected.length} selected — {selected.length >= 2 ? `${selected.length * (selected.length - 1) / 2} pairs` : 'add 2+ to check'}
        </span>
      </div>

      {results && results.pairs.length > 0 && (
        <div className="space-y-4" style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {selected.map((s, i) => (
              <div
                key={s.name}
                className="glass rounded-xl p-3 border border-[var(--border)] transition-all duration-300 hover:border-[var(--border2)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                style={{
                  animation: `fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s both`,
                  '--card-accent': CATEGORY_COLORS[s.category],
                } as React.CSSProperties}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[s.category] }} />
                  <span className="text-xs font-display font-semibold text-white truncate">{s.name}</span>
                </div>
                <div className="space-y-1 text-[10px] text-[var(--text4)] font-mono">
                  <div className="flex justify-between">
                    <span>Category</span>
                    <span className="text-[var(--text3)] truncate ml-2">{s.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Harm</span>
                    <span style={{ color: HARM_LEVEL_COLORS[s.harmLevel] }}>{s.harmScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Onset</span>
                    <span className="text-[var(--text3)]">{s.onset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration</span>
                    <span className="text-[var(--text3)]">{s.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass rounded-xl p-4 border border-[var(--border)] overflow-x-auto">
            <h4 className="text-sm font-display font-semibold text-[var(--text2)] mb-3">Pairwise Interactions</h4>
            <div className="inline-block min-w-fit">
              <div
                className="grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${selected.length + 1}, minmax(90px, 120px))`,
                }}
              >
                <div className="text-[10px] text-[var(--text4)] font-mono flex items-center" />
                {selected.map(s => (
                  <div key={s.name} className="text-[10px] font-display font-medium text-center truncate px-1" style={{ color: CATEGORY_COLORS[s.category] }}>
                    {s.name}
                  </div>
                ))}
                {selected.map((row, i) => (
                  <>
                    <div className="text-[10px] font-display font-medium flex items-center truncate pr-2" style={{ color: CATEGORY_COLORS[row.category] }}>
                      {row.name}
                    </div>
                    {selected.map((col, j) => {
                      if (i === j) {
                        return (
                          <div key={`${row.name}-${col.name}`} className="flex items-center justify-center rounded-lg min-h-[32px] text-[10px] font-mono text-[var(--text4)]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            —
                          </div>
                        )
                      }
                      const pair = results.pairs.find(p =>
                        (p.a.name === row.name && p.b.name === col.name) ||
                        (p.a.name === col.name && p.b.name === row.name)
                      )
                      if (!pair) return <div key={`${row.name}-${col.name}`} />
                      const lc = COMBO_LEVEL_COLORS[pair.level]
                      return (
                        <div
                          key={`${row.name}-${col.name}`}
                          className="flex items-center justify-center rounded-lg min-h-[32px] text-[10px] font-mono font-semibold transition-all duration-200 hover:scale-110 cursor-default"
                          style={{
                            background: `${lc}15`,
                            color: lc,
                            border: `1px solid ${lc}25`,
                            boxShadow: pair.level === 'deadly' ? `0 0 12px ${lc}30` : undefined,
                          }}
                          title={`${row.name} + ${col.name}: ${COMBO_LEVEL_LABELS[pair.level]}`}
                        >
                          {COMBO_LEVEL_LABELS[pair.level]}
                        </div>
                      )
                    })}
                  </>
                ))}
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-4 border transition-all duration-300"
            style={{
              background: (() => {
                const order: Record<string, number> = { safe: 0, low_risk: 1, caution: 2, unsafe: 3, dangerous: 4, deadly: 5 }
                const o = order[results.worstLevel] ?? 2
                if (o >= 4) return 'rgba(239, 68, 68, 0.06)'
                if (o >= 3) return 'rgba(249, 115, 22, 0.06)'
                if (o >= 2) return 'rgba(234, 179, 8, 0.06)'
                return 'rgba(34, 197, 94, 0.06)'
              })(),
              borderColor: (() => {
                const order: Record<string, number> = { safe: 0, low_risk: 1, caution: 2, unsafe: 3, dangerous: 4, deadly: 5 }
                const o = order[results.worstLevel] ?? 2
                if (o >= 4) return 'rgba(239, 68, 68, 0.2)'
                if (o >= 3) return 'rgba(249, 115, 22, 0.2)'
                if (o >= 2) return 'rgba(234, 179, 8, 0.2)'
                return 'rgba(34, 197, 94, 0.2)'
              })(),
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-display font-semibold text-[var(--text2)]">
                Overall Interaction Assessment
              </h4>
              <span
                className="px-3 py-1 rounded-full text-[11px] font-semibold font-mono uppercase"
                style={{
                  background: `${COMBO_LEVEL_COLORS[results.worstLevel]}18`,
                  color: COMBO_LEVEL_COLORS[results.worstLevel],
                  border: `1px solid ${COMBO_LEVEL_COLORS[results.worstLevel]}25`,
                  boxShadow: results.worstLevel === 'deadly' ? `0 0 16px ${COMBO_LEVEL_COLORS[results.worstLevel]}30` : undefined,
                }}
              >
                {COMBO_LEVEL_LABELS[results.worstLevel]}
              </span>
            </div>
            <p className="text-xs text-[var(--text3)] leading-relaxed mb-3">
              {results.drugNames.slice(0, -1).join(', ')} and {results.drugNames.slice(-1)} combination is rated <strong style={{ color: COMBO_LEVEL_COLORS[results.worstLevel] }}>{COMBO_LEVEL_LABELS[results.worstLevel].toLowerCase()}</strong> based on the worst pairwise interaction.
            </p>
            <div className="space-y-1.5">
              {results.pairs
                .sort((a, b) => {
                  const order: Record<string, number> = { safe: 0, low_risk: 1, caution: 2, unsafe: 3, dangerous: 4, deadly: 5 }
                  return (order[b.level] ?? 0) - (order[a.level] ?? 0)
                })
                .map((pair, i) => {
                  const lc = COMBO_LEVEL_COLORS[pair.level]
                  return (
                    <div
                      key={`${pair.a.name}-${pair.b.name}`}
                      className="flex items-start gap-2.5 text-xs"
                      style={{
                        animation: `fadeIn 0.3s ease-out ${i * 0.05}s both`,
                      }}
                    >
                      <div className="flex items-center gap-1.5 mt-0.5 min-w-fit">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[pair.a.category] }} />
                        <span className="text-white font-display text-[11px]">{pair.a.name}</span>
                        <span className="text-[var(--text4)]">+</span>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[pair.b.category] }} />
                        <span className="text-white font-display text-[11px]">{pair.b.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto min-w-fit">
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold font-mono uppercase"
                          style={{ background: `${lc}18`, color: lc, border: `1px solid ${lc}25` }}
                        >
                          {COMBO_LEVEL_LABELS[pair.level]}
                        </span>
                      </div>
                      {pair.note && (
                        <p className="text-[11px] text-[var(--text4)] leading-relaxed mt-0.5 w-full italic">
                          {pair.note}
                        </p>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {selected.length === 0 && !results && (
        <div className="text-center py-12 glass rounded-xl border border-[var(--border)]">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[rgba(168,85,247,0.06)] flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--accent2)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384-3.108A2.25 2.25 0 014.5 10.004V7.5a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25v2.504c0 .576-.22 1.11-.58 1.516l.25.15M11.42 15.17l5.384 3.108a2.25 2.25 0 002.42 0l5.384-3.108M11.42 15.17l.25-.15M20.25 7.5a2.25 2.25 0 00-2.25-2.25h-2.25A2.25 2.25 0 0013.5 7.5v2.504c0 .576.22 1.11.58 1.516l-.25.15m0 0l-5.384 3.108M20.25 7.5v2.504c0 .576-.22 1.11-.58 1.516l.25.15" />
            </svg>
          </div>
          <p className="text-sm text-[var(--text3)]">Select 2 or more substances to check interactions</p>
          <p className="text-[11px] text-[var(--text4)] mt-1">Search and add substances using the input above</p>
        </div>
      )}
    </div>
  )
}
