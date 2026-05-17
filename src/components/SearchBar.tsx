'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { Substance, Category } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/types'

interface SearchBarProps {
  substances: Substance[]
  onSelect: (substance: Substance) => void
  selectedCategories: Category[]
  onCategoryToggle: (cat: Category) => void
  onCategoryClear: () => void
}

export default function SearchBar({ substances, onSelect, selectedCategories, onCategoryToggle, onCategoryClear }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [results, setResults] = useState<Substance[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const search = useCallback((q: string) => {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    const lower = q.toLowerCase()
    const matched = substances
      .filter(s =>
        s.name.toLowerCase().includes(lower) ||
        s.aliases.some(a => a.toLowerCase().includes(lower))
      )
      .slice(0, 8)
    setResults(matched)
  }, [substances])

  useEffect(() => {
    function handleClick(e: MouseEvent | TouchEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('touchstart', handleClick) }
  }, [])

  const categories = Object.entries(CATEGORY_COLORS) as [Category, string][]

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      <div className="relative search-input">
        <div className="relative flex items-center">
          <svg className="absolute left-3.5 sm:left-4 w-4 h-4 sm:w-5 sm:h-5 text-[var(--text4)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => search(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search substances..."
            className="w-full pl-10 sm:pl-12 pr-10 py-3 sm:py-3.5 lg:py-4 rounded-[var(--radius-lg)] lg:rounded-[var(--radius-xl)] bg-transparent border-0 text-white placeholder:text-[var(--text4)] text-sm sm:text-base lg:text-[15px] focus:outline-none text-center"
            aria-label="Search substances"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
              className="absolute right-3 sm:right-4 text-[var(--text4)] hover:text-white transition-colors p-1 rounded-md hover:bg-[rgba(255,255,255,0.06)]"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {focused && results.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-2 glass-strong rounded-xl overflow-hidden shadow-xl max-h-[60vh] overflow-y-auto border border-[var(--border2)]"
          >
            {results.map((s, i) => (
              <button
                key={s.name}
                onClick={() => { onSelect(s); setQuery(''); setResults([]); setFocused(false) }}
                className="w-full px-4 py-3 lg:py-4 flex items-center gap-3 hover:bg-[rgba(255,255,255,0.05)] transition-colors text-left border-b border-[var(--border)] last:border-0"
                style={{ animation: `fadeInUp 0.25s ease-out ${i * 30}ms both` }}
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
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
        <button
          onClick={onCategoryClear}
          className={`cat-pill ${selectedCategories.length === 0 ? 'active' : ''}`}
          style={{ '--pill-c': 'var(--accent)' } as React.CSSProperties}
        >
          All
        </button>
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
