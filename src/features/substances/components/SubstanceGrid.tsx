'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import type { Substance } from '@/lib/types'
import SubstanceCard from './SubstanceCard'

interface SubstanceGridProps {
  substances: Substance[]
  onSubstanceClick: (substance: Substance) => void
}

const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window

export default function SubstanceGrid({ substances, onSubstanceClick }: SubstanceGridProps) {
  const batchSize = isTouchDevice ? 24 : 12
  const [visible, setVisible] = useState<Set<string>>(() => new Set(substances.slice(0, batchSize).map(s => s.name)))
  const observerRef = useRef<IntersectionObserver | null>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const rootMargin = useMemo(
    () => isTouchDevice ? '20px' : '40px',
    []
  )

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const key = entry.target.getAttribute('data-key')
          if (key && entry.isIntersecting) {
            setVisible(prev => {
              if (prev.has(key)) return prev
              const next = new Set(prev)
              next.add(key)
              return next
            })
          }
        })
      },
      { threshold: 0.01, rootMargin }
    )

    cardRefs.current.forEach(el => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [substances, rootMargin])

  if (substances.length === 0) {
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
      {substances.map((substance, i) => {
        const delay = isTouchDevice ? (i % 8) * 25 : (i % 12) * 40
        return (
          <div
            key={substance.name}
            ref={el => { if (el) cardRefs.current.set(substance.name, el) }}
            data-key={substance.name}
            className={`transition-all duration-500 ease-out ${
              visible.has(substance.name)
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-6'
            }`}
            style={{
              transitionDelay: `${delay}ms`,
              contentVisibility: 'auto',
              containIntrinsicSize: '0 300px',
            }}
          >
            <SubstanceCard substance={substance} onClick={onSubstanceClick} />
          </div>
        )
      })}
    </div>
  )
}
