'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { Substance, Category } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/types'
import { searchSubstances } from '@/lib/data'

const RECENT_SEARCHES_KEY = 'tripgem_recent_searches'
const MAX_RECENT = 8

function getRecentSearches(): Substance['name'][] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
  } catch {
    return []
  }
}

function addRecentSearch(name: Substance['name']) {
  const recent = getRecentSearches().filter(n => n !== name)
  recent.unshift(name)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY)
}

interface SearchBarProps {
  substances: Substance[]
  onSelect: (substance: Substance) => void
  selectedCategories: Category[]
  onCategoryToggle: (cat: Category) => void
  onCategoryClear: () => void
  externalInputRef?: React.RefObject<HTMLInputElement | null>
}

export default function SearchBar({ substances, onSelect, selectedCategories, onCategoryToggle, onCategoryClear, externalInputRef }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [results, setResults] = useState<Substance[]>([])
  const [recentSearches, setRecentSearches] = useState<Substance['name'][]>(() => getRecentSearches())
  const localRef = useRef<HTMLInputElement>(null)
  const inputRef = externalInputRef ?? localRef
  const dropdownRef = useRef<HTMLDivElement>(null)

  const search = useCallback((q: string) => {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    setResults(searchSubstances(q, 10))
  }, [])

  const handleSelect = useCallback((substance: Substance) => {
    onSelect(substance)
    addRecentSearch(substance.name)
    setRecentSearches(getRecentSearches())
    setQuery('')
    setResults([])
    setFocused(false)
  }, [onSelect])

  useEffect(() => {
    function handleClick(e: PointerEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setFocused(false)
      }
    }
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [inputRef, dropdownRef])

  const categories = Object.entries(CATEGORY_COLORS) as [Category, string][]

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      <div className="relative search-input">
        <div className="flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3">
          <button
            onClick={onCategoryClear}
            className={`cat-pill-inline shrink-0 ${selectedCategories.length === 0 ? 'active' : ''}`}
            style={{ '--pill-c': 'var(--accent)' } as React.CSSProperties}
            aria-label="Show all categories"
          >
            All
          </button>

          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text4)] shrink-0 pointer-events-none" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => search(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search substances..."
            className="flex-1 min-w-0 py-3 sm:py-3.5 lg:py-4 bg-transparent border-0 text-white placeholder:text-[var(--text4)] text-sm sm:text-base lg:text-[15px] focus:outline-none"
            aria-label="Search substances"
            role="combobox"
            aria-expanded={focused && (results.length > 0 || recentSearches.length > 0)}
            aria-controls="search-results"
            aria-autocomplete="list"
            enterKeyHint="search"
            autoComplete="off"
          />

          {query ? (
            <button
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
              className="shrink-0 text-[var(--text4)] hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <kbd className="hidden sm:inline shrink-0 text-[11px] font-mono text-[var(--text5)] border border-[var(--border)] rounded px-1.5 py-0.5 leading-none">
              /
            </kbd>
          )}
        </div>

        {focused && (
          <div
            ref={dropdownRef}
            id="search-results"
            role="listbox"
            className="absolute z-50 w-full mt-2 glass-strong rounded-xl overflow-hidden shadow-xl max-h-[60vh] overflow-y-auto border border-[var(--border2)]"
          >
            {query.length >= 2 && results.length > 0 && (
              <div className="border-b border-[var(--border)]">
                <div className="px-3 py-1.5 text-[10px] font-mono text-[var(--text4)] uppercase tracking-wider">
                  Results
                </div>
                {results.map((s, i) => (
                    <button
                    key={s.name}
                    id={`search-result-${i}`}
                    role="option"
                    aria-selected={false}
                    onClick={() => handleSelect(s)}
                    className="w-full px-4 py-3 lg:py-4 flex items-center gap-3 hover:bg-[rgba(255,255,255,0.05)] transition-colors text-left border-b border-[var(--border)] last:border-0"
                    style={{ animation: `fadeInUp 0.2s ease-out ${i * 25}ms both` }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[s.category], boxShadow: `0 0 6px ${CATEGORY_COLORS[s.category]}40` }} />
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-medium text-sm lg:text-[15px] text-white truncate">{s.name}</div>
                      <div className="text-[11px] lg:text-xs text-[var(--text3)] truncate">{s.category}</div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{
                      background: `${CATEGORY_COLORS[s.category]}12`,
                      color: CATEGORY_COLORS[s.category],
                      border: `1px solid ${CATEGORY_COLORS[s.category]}20`,
                    }}>
                      {s.harmScore}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {query.length === 0 && recentSearches.length > 0 && (
              <div>
                <div className="px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[var(--text4)] uppercase tracking-wider">Recent</span>
                  <button
                    onClick={() => { clearRecentSearches(); setRecentSearches([]) }}
                    className="text-[10px] text-[var(--text4)] hover:text-[var(--text3)] transition-colors"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.map(name => {
                  const s = substances.find(s => s.name === name)
                  if (!s) return null
                  return (
                    <button
                      key={name}
                      onClick={() => handleSelect(s)}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[rgba(255,255,255,0.04)] transition-colors text-left border-b border-[var(--border)] last:border-0"
                    >
                      <svg className="w-3.5 h-3.5 text-[var(--text4)] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[s.category] }} />
                        <span className="font-display text-sm text-[var(--text2)] truncate">{s.name}</span>
                        <span className="text-[10px] text-[var(--text4)] truncate">{s.category}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {query.length >= 2 && results.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-[var(--text4)]">No substances found for &ldquo;{query}&rdquo;</p>
              </div>
            )}

            {query.length > 0 && query.length < 2 && (
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-[var(--text4)]">Type at least 2 characters to search</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
        {categories.map(([cat, color]) => (
          <button
            key={cat}
            onClick={() => onCategoryToggle(cat)}
            className={`cat-pill ${selectedCategories.includes(cat) ? 'active' : ''}`}
            style={{ '--pill-c': color, color: selectedCategories.includes(cat) ? '#fff' : undefined } as React.CSSProperties}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}