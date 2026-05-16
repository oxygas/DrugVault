'use client'

import { memo, useCallback } from 'react'
import type { Substance } from '@/lib/types'
import { CATEGORY_COLORS, HARM_LEVEL_COLORS } from '@/lib/types'

interface SubstanceCardProps {
  substance: Substance
  onClick: (substance: Substance) => void
}

function SubstanceCardInner({ substance, onClick }: SubstanceCardProps) {
  const catColor = CATEGORY_COLORS[substance.category]
  const harmColor = HARM_LEVEL_COLORS[substance.harmLevel]

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    e.currentTarget.style.setProperty('--mouse-x', `${x}%`)
    e.currentTarget.style.setProperty('--mouse-y', `${y}%`)
  }, [])

  return (
    <button
      onClick={() => onClick(substance)}
      onMouseMove={handleMouseMove}
      className="substance-card w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
      style={{ '--card-accent': catColor } as React.CSSProperties}
      aria-label={`View ${substance.name} details`}
    >
    <div className="flex items-start justify-between gap-2 mb-4">
      <div className="min-w-0 flex-1">
        <h3 className="font-display font-semibold text-base lg:text-lg text-white leading-tight truncate group-hover:text-[var(--accent3)] transition-colors duration-200">
          {substance.name}
        </h3>
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full flex-shrink-0"
            style={{ background: catColor, boxShadow: `0 0 8px ${catColor}40` }}
          />
          <span className="text-xs lg:text-sm text-[var(--text3)] truncate">{substance.category}</span>
        </div>
      </div>
      <span
        className="flex-shrink-0 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-full text-[11px] lg:text-xs font-semibold uppercase tracking-wider font-mono"
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

    <div className="space-y-2.5 mb-4">
      <MetricBar label="Harm" value={substance.harmScore} max={100} color={harmColor} />
      <MetricBar label="Addict" value={substance.addictionScore} max={100} color={harmColor} />
    </div>

    <div className="flex items-center justify-between text-xs lg:text-sm text-[var(--text4)]">
      <span className="font-mono">{substance.onset} onset</span>
      <span className="font-mono">{substance.duration}</span>
    </div>

    {substance.aliases.length > 0 && (
      <div className="mt-3.5 pt-3.5 border-t border-[var(--border)] flex flex-wrap gap-1 overflow-hidden" style={{ maxHeight: '1.75rem' }}>
        {substance.aliases.slice(0, 3).map(a => (
          <span key={a} className="text-[11px] lg:text-xs px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.03)] text-[var(--text4)] truncate max-w-[80px] font-mono border border-[var(--border)]">{a}</span>
        ))}
        {substance.aliases.length > 3 && (
          <span className="text-[11px] lg:text-xs text-[var(--text4)] font-mono">+{substance.aliases.length - 3}</span>
        )}
      </div>
    )}
    </button>
  )
}

function MetricBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] lg:text-xs text-[var(--text4)] w-11 lg:w-12 text-right flex-shrink-0 font-mono">{label}</span>
      <div className="flex-1 h-2 lg:h-2.5 bg-[rgba(255,255,255,0.03)] rounded-full overflow-hidden border border-[rgba(255,255,255,0.02)]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}44, ${color})`,
            boxShadow: `0 0 8px ${color}30`,
          }}
        />
      </div>
      <span className="text-[11px] lg:text-xs text-[var(--text3)] w-6 text-right flex-shrink-0 font-mono">{value}</span>
    </div>
  )
}

export default memo(SubstanceCardInner)
