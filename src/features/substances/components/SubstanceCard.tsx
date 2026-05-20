'use client'

import { memo, useCallback, useState, useEffect } from 'react'
import Link from 'next/link'
import type { Substance } from '@/lib/types'
import { CATEGORY_COLORS, HARM_LEVEL_COLORS } from '@/lib/types'
import { slugify } from '@/lib/data'
import { isTouchDevice } from '@/lib/device'

interface SubstanceCardProps {
  substance: Substance
  onClick: (substance: Substance) => void
}

function SubstanceCardInner({ substance, onClick }: SubstanceCardProps) {
  const [touchDevice, setTouchDevice] = useState(false)
  const catColor = CATEGORY_COLORS[substance.category]
  const harmColor = HARM_LEVEL_COLORS[substance.harmLevel]
  const slug = slugify(substance.name)

  useEffect(() => {
    setTouchDevice(isTouchDevice())
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (touchDevice) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    e.currentTarget.style.setProperty('--mouse-x', `${x}%`)
    e.currentTarget.style.setProperty('--mouse-y', `${y}%`)
  }, [touchDevice])

  const aliasCount = substance.aliases.length
  const brandCount = substance.brandNames.length
  const streetCount = substance.streetNames.length
  const showNames = brandCount > 0 || streetCount > 0

  return (
    <Link
      href={`/substances/${slug}`}
      onClick={(e) => {
        e.preventDefault()
        onClick(substance)
      }}
      onMouseMove={handleMouseMove}
      className="substance-card w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
      style={{ '--card-accent': catColor } as React.CSSProperties}
      aria-label={`View ${substance.name} details`}
    >
      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-sm sm:text-base lg:text-lg text-white leading-tight truncate group-hover:text-[var(--accent3)] transition-colors">
            {substance.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full flex-shrink-0"
              style={{ background: catColor, boxShadow: `0 0 8px ${catColor}40` }}
            />
            <span className="text-[11px] sm:text-xs text-[var(--text3)] truncate">{substance.category}</span>
          </div>
        </div>
        <span
          className="flex-shrink-0 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider font-mono"
          style={{
            background: `${harmColor}12`,
            color: harmColor,
            border: `1px solid ${harmColor}20`,
            boxShadow: `0 0 12px ${harmColor}08`,
          }}
        >
          {substance.harmLevel}
        </span>
      </div>

      <div className="space-y-1 sm:space-y-1.5 mb-2 sm:mb-3">
        <MetricBar label="Harm" value={substance.harmScore} max={100} color={harmColor} touchDevice={touchDevice} />
        <MetricBar label="Addict" value={substance.addictionScore} max={100} color={harmColor} touchDevice={touchDevice} />
      </div>

      <div className="flex items-center justify-between text-[10px] sm:text-xs text-[var(--text4)]">
        <span className="font-mono">{substance.onset} onset</span>
        <span className="font-mono">{substance.duration}</span>
      </div>

      {aliasCount > 0 && (
        <div className="mt-2 pt-2 border-t border-[var(--border)] flex flex-wrap gap-1">
          {substance.aliases.slice(0, touchDevice ? 2 : 3).map(a => (
            <span key={a} className="text-[10px] sm:text-[11px] px-1 sm:px-1.5 py-0.5 rounded-md bg-[rgba(255,255,255,0.03)] text-[var(--text4)] truncate max-w-[50px] sm:max-w-[80px] font-mono border border-[var(--border)]">{a}</span>
          ))}
          {aliasCount > (touchDevice ? 2 : 3) && (
            <span className="text-[10px] sm:text-[11px] text-[var(--text4)] font-mono">+{aliasCount - (touchDevice ? 2 : 3)}</span>
          )}
        </div>
      )}

      {showNames && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {substance.brandNames.slice(0, 1).map(b => (
            <span key={b} className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">🏥 {b}</span>
          ))}
          {substance.streetNames.slice(0, touchDevice ? 1 : 2).map(s => (
            <span key={s} className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.04)] text-[var(--text4)] border border-[var(--border)] font-mono">⚡ {s}</span>
          ))}
          {streetCount > (touchDevice ? 1 : 2) && (
            <span className="text-[9px] sm:text-[10px] text-[var(--text4)] font-mono">+{streetCount - (touchDevice ? 1 : 2)}</span>
          )}
        </div>
      )}
    </Link>
  )
}

function MetricBar({ label, value, max, color, touchDevice }: { label: string; value: number; max: number; color: string; touchDevice: boolean }) {
  const pct = Math.min((value / max) * 100, 100)
  const w = touchDevice ? 7 : 9
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <span className="text-[9px] sm:text-[10px] text-[var(--text4)] w-[18px] sm:w-[28px] text-right flex-shrink-0 font-mono">{label}</span>
      <div className="flex-1 h-1 sm:h-1.5 bg-[rgba(255,255,255,0.03)] rounded-full overflow-hidden border border-[rgba(255,255,255,0.02)]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}44, ${color})`,
            boxShadow: `0 0 8px ${color}30`,
          }}
        />
      </div>
      <span className="text-[9px] sm:text-[10px] text-[var(--text3)] w-[16px] sm:w-[18px] text-right flex-shrink-0 font-mono">{value}</span>
    </div>
  )
}

export default memo(SubstanceCardInner)
