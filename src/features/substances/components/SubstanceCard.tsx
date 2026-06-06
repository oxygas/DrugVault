'use client'

import { memo, useCallback, useMemo } from 'react'
import type { Substance } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/types'
import { playCategoryClick } from '@/lib/ui-sounds'

interface SubstanceCardProps {
  substance: Substance
  onClick: (substance: Substance) => void
  style?: React.CSSProperties
}

function SubstanceCardInner({ substance, onClick, style }: SubstanceCardProps) {
  const catColor = CATEGORY_COLORS[substance.category]

  const handleClick = useCallback(() => {
    playCategoryClick(substance.category)
    onClick(substance)
  }, [onClick, substance])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      playCategoryClick(substance.category)
      onClick(substance)
    }
  }, [onClick, substance])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
  }, [])

  const allEffects = useMemo(
    () => substance.subjectiveEffects?.allEffects?.slice(0, 3).map(e => e.name),
    [substance]
  )
  const mostLoved = useMemo(
    () => substance.subjectiveEffects?.mostLoved?.slice(0, 3),
    [substance]
  )
  const effects = useMemo(
    () => allEffects?.length ? allEffects : mostLoved?.length ? mostLoved : [],
    [allEffects, mostLoved]
  )

  const aliases = useMemo(() => substance.aliases.slice(0, 3).join(', '), [substance])
  const aliasOverflow = useMemo(
    () => substance.aliases.length > 3 ? `+${substance.aliases.length - 3}` : '',
    [substance]
  )
  const hasAliases = aliases.length > 0

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      className="substance-card vaporwave-card w-full cursor-pointer relative overflow-hidden group"
      style={{ '--tube-c': catColor, ...style } as React.CSSProperties}
      role="button"
      tabIndex={0}
      aria-label={`View ${substance.name}`}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
        background: `radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${catColor}15, transparent 40%)`
      }} />
      <div className="neon-stripe" style={{ background: catColor }} />
      <div className="diagonal-shine" />

      <div className="space-y-[3px]">
      <div className="flex items-center gap-1.5 min-h-[18px]">
        <h3 className="card-name font-display font-semibold text-sm text-white truncate">
          {substance.name}
        </h3>
        <div className="flex items-center gap-[2px] ml-auto shrink-0">
          {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className="harm-dot group-hover:animate-led-power-up"
                style={{
                  background: i < Math.round(substance.harmScore / 10) ? catColor : 'rgba(255,255,255,0.06)',
                  boxShadow: i < Math.round(substance.harmScore / 10) ? `0 0 4px ${catColor}` : 'none',
                  animationDelay: `${i * 30}ms`
                }}
              />
          ))}
        </div>
      </div>

      {(effects.length > 0 || hasAliases) && (
        <p className="text-[11px] text-[var(--text4)] truncate leading-[18px]">
          {effects.length > 0 ? effects.join(' \u00B7 ') : aliases}
          {!effects.length && aliasOverflow ? ` ${aliasOverflow}` : ''}
        </p>
      )}

      <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text4)] leading-[18px]">
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
          <circle cx="6" cy="6" r="2" fill="currentColor" opacity="0.15" />
        </svg>
        <span className="truncate">{substance.onset}</span>
        <span className="text-[var(--border2)] shrink-0">·</span>
        <span className="truncate">{substance.duration}</span>
        {effects.length > 0 && hasAliases && (
          <span className="truncate text-[var(--text5)] ml-auto">{aliases}{aliasOverflow ? ` ${aliasOverflow}` : ''}</span>
        )}
      </div>
      </div>
    </div>
  )
}

export default memo(SubstanceCardInner)
