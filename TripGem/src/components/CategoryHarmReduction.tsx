'use client'

import { CATEGORY_HARM_REDUCTION } from '@/lib/category-harm-reduction'
import { CATEGORY_COLORS } from '@/lib/types'

export default function CategoryHarmReduction({ category }: { category: string }) {
  const info = CATEGORY_HARM_REDUCTION[category]
  if (!info) return null

  const catColor = CATEGORY_COLORS[category] || '#8b5cf6'

  return (
    <div
      className="rounded-xl p-4 sm:p-5"
      style={{
        background: 'color-mix(in srgb, var(--bg2) 100%, transparent)',
        borderLeft: `3px solid ${catColor}`,
      }}
    >
      <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: catColor }}>
        {category} — Harm Reduction
      </h4>
      <p className="text-sm text-[var(--text2)] leading-relaxed mb-4">
        {info.description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text3)] mb-2">Key Risks</h5>
          <ul className="space-y-1">
            {info.risks.map((risk, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-[var(--text2)]">
                <span className="text-red-400 shrink-0 mt-px">&#x2022;</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text3)] mb-2">Best Practices</h5>
          <ul className="space-y-1">
            {info.practices.map((p, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-[var(--text2)]">
                <span className="text-emerald-400 shrink-0 mt-px">&#x2022;</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className="mt-4 p-3 rounded-lg text-xs font-medium leading-relaxed"
        style={{
          background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
          color: 'var(--text2)',
        }}
      >
        <span className="text-[var(--danger)] font-bold uppercase text-[10px] tracking-wider">&#x26A0; Critical: </span>
        {info.avoid}
      </div>
    </div>
  )
}
