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

  const filtered = useMemo(() =>
    query.length >= 1
      ? substances.filter(s =>
          s.name.toLowerCase().includes(query.toLowerCase()) &&
          !selected.find(s2 => s2.name === s.name)
        ).slice(0, 10)
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
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Search Section */}
      <div ref={searchRef} className="space-y-4">
        <label className="block text-base font-medium text-gray-300">
          Add substances to check
        </label>
        <div className="relative">
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
            <svg className="w-6 h-6 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setDropdownOpen(true) }}
              onFocus={() => setDropdownOpen(true)}
              placeholder={selected.length === 0 ? "Type to search substances..." : "Add another substance"}
              className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-lg"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus() }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Dropdown */}
          {dropdownOpen && filtered.length > 0 && (
            <div className="absolute z-20 w-full mt-3 bg-gray-900 border border-white/10 rounded-xl shadow-xl max-h-72 overflow-y-auto">
              {filtered.map((s, i) => {
                const catColor = CATEGORY_COLORS[s.category]
                return (
                  <button
                    key={s.name}
                    onClick={() => addDrug(s)}
                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: catColor }} />
                    <span className="text-white font-medium flex-1 text-left text-base">{s.name}</span>
                    <span className="text-sm text-gray-400">{s.category}</span>
                    <span
                      className="text-sm px-3 py-1 rounded-full font-medium"
                      style={{ background: `${HARM_LEVEL_COLORS[s.harmLevel]}20`, color: HARM_LEVEL_COLORS[s.harmLevel] }}
                    >
                      {s.harmLevel}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected substances */}
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {selected.map((s) => {
              const catColor = CATEGORY_COLORS[s.category]
              return (
                <div
                  key={s.name}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all hover:scale-105"
                  style={{ background: `${catColor}15`, borderColor: `${catColor}30`, borderWidth: 1, borderStyle: 'solid' }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: catColor }} />
                  <span className="text-white">{s.name}</span>
                  <button
                    onClick={() => removeDrug(s.name)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
            <button
              onClick={clearAll}
              className="text-base text-gray-400 hover:text-white transition-colors underline underline-offset-4 ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
        <button
          onClick={checkInteractions}
          disabled={!canCheck}
          className={`px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all flex items-center gap-3 ${
            canCheck
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg hover:shadow-purple-500/25'
              : 'bg-gray-700/50 opacity-50 cursor-not-allowed'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {results ? 'Re-check Interactions' : 'Check Interactions'}
        </button>
        <span className="text-base text-gray-400">
          {selected.length === 0
            ? 'Add 2 or more substances to begin'
            : !canCheck
              ? `${selected.length} selected — need ${2 - selected.length} more`
              : `${pairCount} pair${pairCount > 1 ? 's' : ''} to check`
          }
        </span>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Overall Assessment */}
          <div
            className="p-8 rounded-2xl border-2"
            style={{
              background: LEVEL_INFO[results.worstLevel].bg,
              borderColor: LEVEL_INFO[results.worstLevel].border,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-gray-400 uppercase tracking-wider">Overall Risk</h3>
              <span
                className="px-5 py-2 rounded-full text-base font-bold uppercase"
                style={{
                  background: LEVEL_INFO[results.worstLevel].text + '15',
                  color: LEVEL_INFO[results.worstLevel].text,
                }}
              >
                {COMBO_LEVEL_LABELS[results.worstLevel]}
              </span>
            </div>
            <p className="text-lg text-gray-300">
              The worst interaction among your selected substances is <strong style={{ color: LEVEL_INFO[results.worstLevel].text }}>{COMBO_LEVEL_LABELS[results.worstLevel].toLowerCase()}</strong>.
            </p>
          </div>

          {/* Interaction Pairs */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-6">All Interactions</h3>
            <div className="space-y-4">
              {results.pairs
                .sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level])
                .map((pair, i) => {
                  const info = LEVEL_INFO[pair.level]
                  return (
                    <div
                      key={`${pair.a.name}-${pair.b.name}`}
                      className="p-5 rounded-xl border-l-4 flex items-start gap-4"
                      style={{ background: info.bg, borderLeftColor: info.text }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[pair.a.category] }} />
                        <span className="text-white font-medium text-base">{pair.a.name}</span>
                        <span className="text-gray-500 text-lg">+</span>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[pair.b.category] }} />
                        <span className="text-white font-medium text-base">{pair.b.name}</span>
                        <span
                          className="ml-auto px-4 py-1.5 rounded-full text-sm font-bold uppercase"
                          style={{ background: info.text + '20', color: info.text }}
                        >
                          {COMBO_LEVEL_LABELS[pair.level]}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!results && selected.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-5.338 0l-.318-.158a6 6 0 00-3.86-.517L2.572 14.88a2 2 0 01-1.022.547" />
            </svg>
          </div>
          <p className="text-lg text-gray-400 mb-2">No substances selected</p>
          <p className="text-base text-gray-500">Search and add substances above to check for interactions</p>
        </div>
      )}
    </div>
  )
}
