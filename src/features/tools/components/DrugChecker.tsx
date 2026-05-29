'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { Substance, Category, ComboLevel } from '@/lib/types'
import { CATEGORY_COLORS, COMBO_LEVEL_COLORS, HARM_LEVEL_COLORS, COMBO_LEVEL_LABELS } from '@/lib/types'

interface DrugCheckerProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  substanceCombos?: { substanceA: string; substanceB: string; level: ComboLevel; note?: string | null }[]
}

const LEVEL_ORDER: Record<string, number> = { safe: 0, low_risk: 1, caution: 2, unsafe: 3, dangerous: 4, deadly: 5 }

const LEVEL_INFO: Record<ComboLevel, { bg: string; border: string; text: string }> = {
  safe: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
  low_risk: { bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.3)', text: '#06b6d4' },
  caution: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
  unsafe: { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.3)', text: '#f97316' },
  dangerous: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' },
  deadly: { bg: 'rgba(185,28,28,0.1)', border: 'rgba(185,28,28,0.4)', text: '#b91c1c' },
}

export default function DrugChecker({ substances, comboRules, substanceCombos }: DrugCheckerProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Substance[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [results, setResults] = useState<{
    pairs: { a: Substance; b: Substance; level: ComboLevel; note?: string | null }[]
    worstLevel: ComboLevel
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

  const filtered = useMemo(
    () =>
      query.length >= 1
        ? substances
            .filter(
              s => s.name.toLowerCase().includes(query.toLowerCase()) && !selected.find(s2 => s2.name === s.name),
            )
            .slice(0, 8)
        : [],
    [query, substances, selected],
  )

  const getComboLevel = useCallback(
    (a: Category, b: Category): ComboLevel => {
      if (a === b) return 'low_risk'
      return comboRules[`${a}+${b}`] || comboRules[`${b}+${a}`] || 'caution'
    },
    [comboRules],
  )

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

  const checkInteractions = useCallback(() => {
    if (selected.length < 2) return
    const pairs: { a: Substance; b: Substance; level: ComboLevel; note?: string | null }[] = []
    let worst: ComboLevel = 'safe'
    let worstOrder = 0

    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        const a = selected[i]
        const b = selected[j]
        const sc = subComboMap.get(`${a.name.toLowerCase()}+${b.name.toLowerCase()}`)
        let level: ComboLevel
        let note: string | null | undefined

        if (sc) {
          level = sc.level
          note = sc.note
        } else {
          level = getComboLevel(a.category, b.category)
        }

        pairs.push({ a, b, level, note })
        const order = LEVEL_ORDER[level] ?? 2
        if (order > worstOrder) {
          worstOrder = order
          worst = level
        }
      }
    }

    setResults({ pairs, worstLevel: worst })
  }, [selected, subComboMap, getComboLevel])

  const clearAll = useCallback(() => {
    setSelected([])
    setResults(null)
    setQuery('')
  }, [])

  const pairCount = selected.length >= 2 ? selected.length * (selected.length - 1) / 2 : 0
  const canCheck = selected.length >= 2

  return (
    <div className="w-full space-y-6 sm:space-y-10 lg:space-y-14">
      {/* Search */}
      <div ref={searchRef} className="space-y-4 sm:space-y-8">
        <div className="relative">
          <div className="flex items-center gap-3 sm:gap-5 bg-[rgba(10,10,30,0.4)] border-2 border-[var(--border2)] rounded-xl sm:rounded-2xl px-4 sm:px-8 py-4 sm:py-6 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
            <svg className="w-5 h-5 sm:w-7 sm:h-7 text-[var(--text4)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                setDropdownOpen(true)
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder={selected.length === 0 ? 'Search substances to check interactions...' : 'Add another substance...'}
              className="flex-1 bg-transparent text-white placeholder-[var(--text4)] focus:outline-none text-base sm:text-xl"
              enterKeyHint="search"
              autoComplete="off"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('')
                  inputRef.current?.focus()
                }}
                className="p-2 sm:p-3 hover:bg-white/5 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Dropdown */}
          {dropdownOpen && filtered.length > 0 && (
            <div
              className="absolute z-20 w-full mt-2 sm:mt-4 border border-[var(--border2)] rounded-xl sm:rounded-2xl shadow-2xl max-h-80 sm:max-h-96 overflow-y-auto"
              style={{ background: 'rgba(8,8,24,0.97)', backdropFilter: 'blur(20px)' }}
            >
              {filtered.map(s => {
                const catColor = CATEGORY_COLORS[s.category]
                return (
                  <button
                    key={s.name}
                    onClick={() => addDrug(s)}
                    className="w-full px-4 sm:px-8 py-3 sm:py-6 flex items-center gap-3 sm:gap-5 hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] last:border-b-0"
                  >
                    <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" style={{ background: catColor }} />
                    <span className="text-white font-semibold flex-1 text-left text-sm sm:text-lg">{s.name}</span>
                    <span className="text-xs sm:text-base text-[var(--text4)]">{s.category}</span>
                    <span
                      className="text-xs sm:text-base px-3 sm:px-5 py-1 sm:py-2 rounded-full font-semibold"
                      style={{ background: `${HARM_LEVEL_COLORS[s.harmLevel]}18`, color: HARM_LEVEL_COLORS[s.harmLevel] }}
                    >
                      {s.harmLevel}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {selected.map(s => {
              const catColor = CATEGORY_COLORS[s.category]
              return (
                <div
                  key={s.name}
                  className="inline-flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-lg font-semibold transition-all hover:scale-[1.02]"
                  style={{ background: `${catColor}12`, border: `2px solid ${catColor}25` }}
                >
                  <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ background: catColor }} />
                  <span className="text-white break-all max-w-[140px] sm:max-w-none">{s.name}</span>
                  <button
                    onClick={() => removeDrug(s.name)}
                    className="p-1 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
            <button
              onClick={clearAll}
              className="text-xs sm:text-base text-[var(--text4)] hover:text-white transition-colors underline underline-offset-4 ml-1 sm:ml-2 py-2 sm:py-4 px-2 sm:px-3"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Check button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
        <button
          onClick={checkInteractions}
          disabled={!canCheck}
          className={`w-full sm:w-auto px-6 sm:px-14 py-4 sm:py-6 rounded-xl sm:rounded-2xl font-bold text-white text-base sm:text-xl transition-all flex items-center justify-center gap-3 sm:gap-4 ${
            canCheck
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg hover:shadow-purple-500/25 active:scale-[0.98]'
              : 'bg-[rgba(255,255,255,0.03)] opacity-40 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {results ? 'Re-check Interactions' : 'Check Interactions'}
        </button>
        <span className="text-sm sm:text-lg text-[var(--text4)] py-1 sm:py-2">
          {selected.length === 0
            ? 'Add 2 or more substances to begin'
            : !canCheck
              ? `${selected.length} selected — need ${2 - selected.length} more`
              : `${pairCount} pair${pairCount > 1 ? 's' : ''} to check`}
        </span>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-10 sm:space-y-12" style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
          {/* Overall */}
          <div
            className="p-6 sm:p-10 lg:p-14 rounded-xl sm:rounded-2xl border-2"
            style={{
              background: LEVEL_INFO[results.worstLevel].bg,
              borderColor: LEVEL_INFO[results.worstLevel].border,
            }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 justify-between mb-4 sm:mb-6">
              <h3 className="text-[11px] sm:text-sm font-mono text-[var(--text4)] uppercase tracking-[0.2em]">Overall Risk Assessment</h3>
              <span
                className="px-5 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-bold uppercase tracking-wider"
                style={{
                  background: LEVEL_INFO[results.worstLevel].text + '18',
                  color: LEVEL_INFO[results.worstLevel].text,
                }}
              >
                {COMBO_LEVEL_LABELS[results.worstLevel]}
              </span>
            </div>
            <p className="text-sm sm:text-xl text-[var(--text3)] leading-relaxed">
              The worst interaction among your selected substances is{' '}
              <strong className="text-base sm:text-2xl" style={{ color: LEVEL_INFO[results.worstLevel].text }}>
                {COMBO_LEVEL_LABELS[results.worstLevel].toLowerCase()}
              </strong>
              .
            </p>
          </div>

          {/* Pairs */}
          <div className="space-y-5 sm:space-y-8">
            <h3 className="text-lg sm:text-2xl font-display font-bold text-white">All Interactions</h3>
            <div className="space-y-3 sm:space-y-5">
              {results.pairs
                .sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level])
                .map(pair => {
                  const info = LEVEL_INFO[pair.level]
                  return (
                    <div
                      key={`${pair.a.name}-${pair.b.name}`}
                      className="p-4 sm:p-10 rounded-xl sm:rounded-2xl sm:border-l-[6px] border-l-4 flex flex-col sm:flex-row items-start gap-3 sm:gap-6"
                      style={{ background: info.bg, borderLeftColor: info.text }}
                    >
                      <div className="flex items-center gap-2 sm:gap-5 flex-1 flex-wrap">
                        <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[pair.a.category] }} />
                        <span className="text-white font-bold text-sm sm:text-xl">{pair.a.name}</span>
                        <span className="text-[var(--text4)] text-base sm:text-2xl font-light">+</span>
                        <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[pair.b.category] }} />
                        <span className="text-white font-bold text-sm sm:text-xl">{pair.b.name}</span>
                      </div>
                      <span
                        className="px-4 sm:px-7 py-1.5 sm:py-3 rounded-full text-xs sm:text-base font-bold uppercase tracking-wider"
                        style={{ background: info.text + '18', color: info.text }}
                      >
                        {COMBO_LEVEL_LABELS[pair.level]}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* Empty */}
      {!results && selected.length === 0 && (
        <div className="text-center py-16 sm:py-32">
          <div className="w-16 h-16 sm:w-28 sm:h-28 mx-auto mb-5 sm:mb-10 rounded-2xl sm:rounded-3xl bg-[rgba(255,255,255,0.03)] border border-[var(--border)] flex items-center justify-center">
            <svg className="w-8 h-8 sm:w-14 sm:h-14 text-[var(--text4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-5.338 0l-.318-.158a6 6 0 00-3.86-.517L2.572 14.88a2 2 0 01-1.022.547" />
            </svg>
          </div>
          <h3 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3 sm:mb-4">Interaction Checker</h3>
          <p className="text-sm sm:text-lg text-[var(--text4)] max-w-lg mx-auto leading-relaxed px-4 sm:px-0">
            Search for substances above and add them to check for dangerous combinations.
            Supports 50+ substances with known interaction data.
          </p>
        </div>
      )}
    </div>
  )
}
