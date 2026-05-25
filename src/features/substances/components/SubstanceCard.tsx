'use client'

import { memo } from 'react'
import Link from 'next/link'
import type { Substance } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/types'
import { slugify } from '@/lib/data'

interface SubstanceCardProps {
  substance: Substance
  onClick: (substance: Substance) => void
}

function SubstanceCardInner({ substance, onClick }: SubstanceCardProps) {
  const catColor = CATEGORY_COLORS[substance.category]
  const slug = slugify(substance.name)

  const allEffects = substance.subjectiveEffects?.allEffects?.slice(0, 3).map(e => e.name)
  const mostLoved = substance.subjectiveEffects?.mostLoved?.slice(0, 3)
  const effects = allEffects?.length ? allEffects : mostLoved?.length ? mostLoved : []

  const aliases = substance.aliases.slice(0, 3).join(', ')
  const aliasOverflow = substance.aliases.length > 3 ? `+${substance.aliases.length - 3}` : ''
  const hasAliases = aliases.length > 0

  return (
    <Link
      href={`/substances/${slug}`}
      onClick={(e) => { e.preventDefault(); onClick(substance) }}
      className="vaporwave-card w-full"
      style={{ '--tube-c': catColor } as React.CSSProperties}
      aria-label={`View ${substance.name}`}
    >
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
              className="harm-dot"
              style={{
                background: i < Math.round(substance.harmScore / 10) ? catColor : 'rgba(255,255,255,0.06)',
                boxShadow: i < Math.round(substance.harmScore / 10) ? `0 0 4px ${catColor}` : 'none',
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
        <span className="shrink-0">
          <span className="text-[var(--green2)]">╱</span>
          <span className="text-[var(--yellow)]">╲</span>
          <span className="text-[var(--orange2)]">╱</span>
        </span>
        <span className="truncate">{substance.onset} · {substance.duration}</span>
        {effects.length > 0 && hasAliases && (
          <span className="truncate text-[var(--text5)] ml-auto">{aliases}{aliasOverflow ? ` ${aliasOverflow}` : ''}</span>
        )}
      </div>
      </div>
    </Link>
  )
}

export default memo(SubstanceCardInner)
