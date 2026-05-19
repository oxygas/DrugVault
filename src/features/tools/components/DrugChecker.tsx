'use client'

import { useState, useMemo, useCallback, Fragment, useRef, useEffect } from 'react'
import type { Substance, Category, ComboLevel } from '@/lib/types'
import { CATEGORY_COLORS, HARM_LEVEL_COLORS, COMBO_LEVEL_COLORS, COMBO_LEVEL_LABELS, COMBO_DESCRIPTIONS } from '@/lib/types'

interface DrugCheckerProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  substanceCombos?: { substanceA: string; substanceB: string; level: ComboLevel; note?: string | null }[]
}

const LEVEL_ORDER: Record<string, number> = { safe: 0, low_risk: 1, caution: 2, unsafe: 3, dangerous: 4, deadly: 5 }
const LEVEL_BG: Record<string, string> = {
  safe: 'rgba(16,185,129,0.06)',
  low_risk: 'rgba(6,182,212,0.06)',
  caution: 'rgba(245,158,11,0.06)',
  unsafe: 'rgba(249,115,22,0.06)',
  dangerous: 'rgba(239,68,68,0.06)',
  deadly: 'rgba(185,28,28,0.08)',
}
const LEVEL_BORDER: Record<string, string> = {
  safe: 'rgba(16,185,129,0.2)',
  low_risk: 'rgba(6,182,212,0.2)',
  caution: 'rgba(245,158,11,0.2)',
  unsafe: 'rgba(249,115,22,0.2)',
  dangerous: 'rgba(239,68,68,0.2)',
  deadly: 'rgba(185,28,28,0.3)',
}
const LEVEL_BANNER: Record<string, string> = {
  safe: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))',
  low_risk: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(6,182,212,0.04))',
  caution: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
  unsafe: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.04))',
  dangerous: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))',
  deadly: 'linear-gradient(135deg, rgba(185,28,28,0.15), rgba(185,28,28,0.05))',
}

export default function DrugChecker({ substances, comboRules, substanceCombos }: DrugCheckerProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Substance[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [results, setResults] = useState<{
    pairs: { a: Substance; b: Substance; level: ComboLevel; description: string; note?: string | null }[]
    worstLevel: ComboLevel
    drugNames: string[]
  } | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent | TouchEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [])

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
    setDropdownOpen(false)
    inputRef.current?.focus()
  }, [])

  const removeDrug = useCallback((name: string) => {
    setSelected(prev => prev.filter(s => s.name !== name))
    setResults(null)
  }, [])

  const checkAll = useCallback(() => {
    if (selected.length < 2) return
    const pairs: { a: Substance; b: Substance; level: ComboLevel; description: string; note?: string | null }[] = []
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
        const order = LEVEL_ORDER[level] ?? 2
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

  const canCheck = selected.length >= 2
  const pairCount = selected.length >= 2 ? selected.length * (selected.length - 1) / 2 : 0

  return (
    <div className="space-y-8">
      <div ref={searchRef} className="space-y-5">
        <div className="relative">
          <div
            className="flex items-center gap-3 rounded-2xl border transition-all duration-300 bg-[rgba(8,8,24,0.6)]"
            style={{
              borderColor: query ? 'rgba(168,85,247,0.3)' : 'var(--border2)',
            }}
          >
            <div className="pl-6 flex-shrink-0">
              <svg className={`w-6 h-6 transition-colors duration-300 ${query ? 'text-[var(--accent2)]' : 'text-[var(--text4)]'}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setDropdownOpen(true) }}
              onFocus={() => setDropdownOpen(true)}
              placeholder={selected.length === 0 ? 'Search substances to check...' : 'Add another substance...'}
              className="flex-1 py-5 bg-transparent text-lg text-white placeholder:text-[var(--text4)] focus:outline-none"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setDropdownOpen(false); inputRef.current?.focus() }}
                className="mr-5 p-2 rounded-lg text-[var(--text4)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {dropdownOpen && filtered.length > 0 && (
            <div className="absolute z-20 w-full mt-2 rounded-xl overflow-hidden border border-[var(--border2)] shadow-xl max-h-72 overflow-y-auto" style={{ background: '#0a0a1e' }}>
              {filtered.map((s, i) => {
                const catColor = CATEGORY_COLORS[s.category]
                return (
                  <button
                    key={s.name}
                    onClick={() => addDrug(s)}
                    className="w-full px-6 py-4 flex items-center gap-4 transition-colors text-left border-b border-[var(--border)] last:border-b-0 hover:bg-[rgba(255,255,255,0.03)]"
                    style={{ animation: `fadeIn 0.15s ease-out ${i * 0.03}s both` }}
                  >
                    <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: catColor, boxShadow: `0 0 8px ${catColor}50` }} />
                    <span className="text-lg text-white font-display truncate flex-1">{s.name}</span>
                    <span className="text-sm text-[var(--text4)] font-mono">{s.category}</span>
                    <span className="text-sm px-3 py-1 rounded-full font-mono font-semibold" style={{ background: `${HARM_LEVEL_COLORS[s.harmLevel]}15`, color: HARM_LEVEL_COLORS[s.harmLevel] }}>
                      {s.harmLevel}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {selected.map((s, i) => {
              const catColor = CATEGORY_COLORS[s.category]
              return (
                <div
                  key={s.name}
                  className="group flex items-center gap-2 px-5 py-3 rounded-xl border transition-all duration-200"
                  style={{
                    background: `${catColor}08`,
                    borderColor: `${catColor}20`,
                    animation: `fadeInUp 0.2s cubic-bezier(0.16,1,0.3,1) ${i * 0.04}s both`,
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: catColor }} />
                  <span className="text-base sm:text-lg text-white font-display">{s.name}</span>
                  <button
                    onClick={() => removeDrug(s.name)}
                    className="ml-2 p-1 rounded text-[var(--text4)] hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                    aria-label={`Remove ${s.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
            <button
              onClick={clearAll}
              className="text-sm text-[var(--text4)] hover:text-white transition-colors px-4 py-2 ml-1 rounded-lg hover:bg-[rgba(255,255,255,0.04)]"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        <button
          onClick={checkAll}
          disabled={!canCheck}
          className="flex-1 sm:flex-none relative overflow-hidden rounded-2xl py-5 px-12 text-lg font-display font-semibold transition-all duration-300 disabled:opacity-25 disabled:pointer-events-none"
          style={{
            background: canCheck && results
              ? LEVEL_BANNER[results.worstLevel]
              : 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(168,85,247,0.04))',
            border: `1px solid ${
              canCheck && results
                ? LEVEL_BORDER[results.worstLevel]
                : canCheck
                  ? 'rgba(168,85,247,0.25)'
                  : 'var(--border)'
            }`,
            color: canCheck && results
              ? COMBO_LEVEL_COLORS[results.worstLevel]
              : canCheck
                ? 'var(--accent2)'
                : 'var(--text4)',
          }}
        >
          {canCheck && results && (
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background: `linear-gradient(90deg, transparent, ${COMBO_LEVEL_COLORS[results.worstLevel]}, transparent)`,
              }}
            />
          )}
          <span className="flex items-center justify-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {results ? 'Re-check Interactions' : 'Check Interactions'}
          </span>
        </button>
        <span className="text-base text-[var(--text4)] font-mono flex-shrink-0">
          {selected.length === 0
            ? 'Select 2+ substances'
            : !canCheck
              ? `${selected.length} selected — need 1 more`
              : `${pairCount} pair${pairCount > 1 ? 's' : ''}`
          }
        </span>
      </div>

      {results && results.pairs.length > 0 && (
        <div className="space-y-8" style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
          <div
            className="rounded-2xl p-8 border relative overflow-hidden"
            style={{
              background: LEVEL_BG[results.worstLevel],
              borderColor: LEVEL_BORDER[results.worstLevel],
            }}
          >
            <div className="flex items-start justify-between gap-8 mb-4">
              <div>
                <div className="text-sm font-mono text-[var(--text4)] uppercase tracking-wider mb-2">Overall Assessment</div>
                <h4 className="text-3xl sm:text-4xl font-display font-bold" style={{ color: COMBO_LEVEL_COLORS[results.worstLevel] }}>
                  {COMBO_LEVEL_LABELS[results.worstLevel]}
                </h4>
              </div>
              <span
                className="px-5 py-2 rounded-full text-sm font-mono font-bold uppercase tracking-wider flex-shrink-0"
                style={{
                  background: `${COMBO_LEVEL_COLORS[results.worstLevel]}15`,
                  color: COMBO_LEVEL_COLORS[results.worstLevel],
                  border: `1px solid ${LEVEL_BORDER[results.worstLevel]}`,
                }}
              >
                {results.worstLevel === 'safe' ? 'Safe' :
                 results.worstLevel === 'low_risk' ? 'Low Risk' :
                 results.worstLevel === 'caution' ? 'Caution' :
                 results.worstLevel === 'unsafe' ? 'Unsafe' :
                 results.worstLevel === 'dangerous' ? 'Dangerous' : 'Deadly'}
              </span>
            </div>
            <p className="text-lg text-[var(--text3)] leading-relaxed">
              {results.drugNames.slice(0, -1).join(', ')} and {results.drugNames.slice(-1)} — worst pairwise interaction is <strong style={{ color: COMBO_LEVEL_COLORS[results.worstLevel] }}>{COMBO_LEVEL_LABELS[results.worstLevel].toLowerCase()}</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {selected.map((s, i) => {
              const catColor = CATEGORY_COLORS[s.category]
              return (
                <div
                  key={s.name}
                  className="rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  style={{
                    borderColor: `${catColor}20`,
                    background: `${catColor}04`,
                    animation: `fadeInUp 0.3s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s both`,
                  }}
                >
                  <div className="h-2" style={{ background: `linear-gradient(90deg, ${catColor}, ${catColor}66)` }} />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: catColor }} />
                      <span className="text-lg font-display font-semibold text-white truncate">{s.name}</span>
                    </div>
                    <div className="space-y-3 text-sm font-mono text-[var(--text4)]">
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
                </div>
              )
            })}
          </div>

          <div className="rounded-2xl border border-[var(--border)] p-8 sm:p-10 overflow-x-auto" style={{ background: 'rgba(8,8,24,0.4)' }}>
            <h4 className="text-lg font-display font-semibold text-[var(--text2)] mb-8">Interaction Matrix</h4>
            <div className="inline-block min-w-fit">
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: `repeat(${selected.length + 1}, minmax(120px, 160px))`,
                }}
              >
                <div className="text-sm text-[var(--text5)] font-mono" />
                {selected.map(s => (
                  <div key={s.name} className="text-sm font-display font-medium text-center truncate px-2" style={{ color: CATEGORY_COLORS[s.category] }}>
                    {s.name}
                  </div>
                ))}
                {selected.map((row, i) => (
                  <Fragment key={row.name}>
                    <div className="text-sm font-display font-medium flex items-center truncate pr-4" style={{ color: CATEGORY_COLORS[row.category] }}>
                      {row.name}
                    </div>
                    {selected.map((col, j) => {
                      if (i === j) {
                        return (
                          <div key={`${row.name}-${col.name}`} className="flex items-center justify-center rounded-lg min-h-[56px] text-sm font-mono text-[var(--text5)]" style={{ background: 'rgba(255,255,255,0.02)' }}>
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
                          className="flex items-center justify-center rounded-lg min-h-[56px] text-sm font-mono font-semibold transition-all duration-200 hover:scale-105 cursor-default"
                          style={{
                            background: `${lc}15`,
                            color: lc,
                            border: `1px solid ${lc}25`,
                            boxShadow: pair.level === 'deadly' ? `0 0 20px ${lc}30` : pair.level === 'dangerous' ? `0 0 12px ${lc}20` : undefined,
                          }}
                          title={`${row.name} + ${col.name}: ${COMBO_LEVEL_LABELS[pair.level]}`}
                        >
                          <span className="hidden sm:inline">{COMBO_LEVEL_LABELS[pair.level]}</span>
                          <span className="sm:hidden">{COMBO_LEVEL_LABELS[pair.level].substring(0, 3)}</span>
                        </div>
                      )
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {results.pairs
              .sort((a, b) => (LEVEL_ORDER[b.level] ?? 0) - (LEVEL_ORDER[a.level] ?? 0))
              .map((pair, i) => {
                const lc = COMBO_LEVEL_COLORS[pair.level]
                return (
                  <div
                    key={`${pair.a.name}-${pair.b.name}`}
                    className="flex items-start gap-5 rounded-xl px-6 py-5 transition-all duration-200 hover:bg-[rgba(255,255,255,0.02)]"
                    style={{
                      animation: `fadeIn 0.2s ease-out ${i * 0.04}s both`,
                      borderLeft: `4px solid ${lc}40`,
                    }}
                  >
                    <div className="flex items-center gap-3 text-base min-w-0 flex-1 flex-wrap">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[pair.a.category] }} />
                      <span className="text-white font-display">{pair.a.name}</span>
                      <span className="text-[var(--text5)]">+</span>
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[pair.b.category] }} />
                      <span className="text-white font-display">{pair.b.name}</span>
                      <span
                        className="ml-auto px-4 py-1.5 rounded-full text-sm font-mono font-semibold uppercase flex-shrink-0"
                        style={{ background: `${lc}15`, color: lc, border: `1px solid ${lc}25` }}
                      >
                        {COMBO_LEVEL_LABELS[pair.level]}
                      </span>
                    </div>
                    {pair.note && (
                      <p className="text-base text-[var(--text4)] leading-relaxed italic w-full mt-3">{pair.note}</p>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {selected.length === 0 && !results && (
        <div className="text-center py-24 rounded-2xl border border-dashed" style={{ borderColor: 'rgba(168,85,247,0.15)' }}>
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.1)' }}>
            <svg className="w-12 h-12 text-[var(--accent2)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384-3.108A2.25 2.25 0 014.5 10.004V7.5a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25v2.504c0 .576-.22 1.11-.58 1.516l.25.15M11.42 15.17l5.384 3.108a2.25 2.25 0 002.42 0l5.384-3.108M11.42 15.17l.25-.15M20.25 7.5a2.25 2.25 0 00-2.25-2.25h-2.25A2.25 2.25 0 0013.5 7.5v2.504c0 .576.22 1.11.58 1.516l-.25.15m0 0l-5.384 3.108M20.25 7.5v2.504c0 .576-.22 1.11-.58 1.516l.25.15" />
            </svg>
          </div>
          <p className="text-lg text-[var(--text3)]">Select 2 or more substances to check interactions</p>
          <p className="text-base text-[var(--text4)] mt-3">Search and add them using the input above</p>
        </div>
      )}
    </div>
  )
}
