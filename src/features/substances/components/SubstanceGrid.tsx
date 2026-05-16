'use client'

import { useState, useEffect, useRef } from 'react'
import type { Substance, Category } from '@/lib/types'
import SubstanceCard from './SubstanceCard'

interface SubstanceGridProps {
  substances: Substance[]
  selectedCategories: Category[]
  onSubstanceClick: (substance: Substance) => void
}

export default function SubstanceGrid({ substances, selectedCategories, onSubstanceClick }: SubstanceGridProps) {
  const [visible, setVisible] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const filtered = selectedCategories.length > 0
    ? substances.filter(s => selectedCategories.includes(s.category))
    : substances

  useEffect(() => {
    setVisible(new Set())
  }, [filtered])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    const firstBatch = filtered.slice(0, 12).map(s => s.name)
    setVisible(prev => {
      const next = new Set(prev)
      for (const name of firstBatch) next.add(name)
      return next
    })

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const key = entry.target.getAttribute('data-key')
          if (key && entry.isIntersecting) {
            setVisible(prev => {
              const next = new Set(prev)
              next.add(key)
              return next
            })
          }
        })
      },
      { threshold: 0.01, rootMargin: '40px' }
    )

    cardRefs.current.forEach(el => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [filtered])

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 sm:py-24">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--text4)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <p className="text-[var(--text3)] text-sm">No substances found</p>
        <p className="text-[var(--text4)] text-xs mt-1">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6 justify-items-center">
      {filtered.map((substance, i) => (
        <div
          key={substance.name}
          ref={el => { if (el) cardRefs.current.set(substance.name, el) }}
          data-key={substance.name}
          className={`transition-all duration-500 ease-out ${
            visible.has(substance.name)
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6'
          }`}
          style={{ transitionDelay: `${(i % 12) * 40}ms` }}
        >
          <SubstanceCard substance={substance} onClick={onSubstanceClick} />
        </div>
      ))}
    </div>
  )
}
