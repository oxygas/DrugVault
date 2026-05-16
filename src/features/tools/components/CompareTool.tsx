'use client'

import { useState, useMemo } from 'react'
import type { Substance } from '@/lib/types'
import { CATEGORY_COLORS, HARM_LEVEL_COLORS } from '@/lib/types'

interface CompareToolProps {
  substances: Substance[]
}

export default function CompareTool({ substances }: CompareToolProps) {
  const [sub1Name, setSub1Name] = useState('')
  const [sub2Name, setSub2Name] = useState('')
  const [comparing, setComparing] = useState(false)

  const sub1 = useMemo(() => substances.find(s => s.name.toLowerCase() === sub1Name.toLowerCase()), [sub1Name, substances])
  const sub2 = useMemo(() => substances.find(s => s.name.toLowerCase() === sub2Name.toLowerCase()), [sub2Name, substances])

  const filtered1 = useMemo(() =>
    sub1Name.length >= 1 ? substances.filter(s => s.name.toLowerCase().includes(sub1Name.toLowerCase())).slice(0, 6) : [],
    [sub1Name, substances]
  )
  const filtered2 = useMemo(() =>
    sub2Name.length >= 1 ? substances.filter(s => s.name.toLowerCase().includes(sub2Name.toLowerCase())).slice(0, 6) : [],
    [sub2Name, substances]
  )

  const metrics = sub1 && sub2 ? [
    { key: 'harm', label: 'Harm Score', a: sub1.harmScore, b: sub2.harmScore, max: 100, lower: true },
    { key: 'addict', label: 'Addiction', a: sub1.addictionScore, b: sub2.addictionScore, max: 100, lower: true },
    { key: 'od', label: 'OD Risk', a: sub1.odRisk, b: sub2.odRisk, max: 100, lower: true },
    { key: 'wd', label: 'Withdrawal', a: sub1.withdrawalSeverity, b: sub2.withdrawalSeverity, max: 100, lower: true },
  ] : []

  return (
    <div className="space-y-4">
      {!comparing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AutocompleteInput label="Substance A" value={sub1Name} onChange={setSub1Name} items={filtered1} />
          <AutocompleteInput label="Substance B" value={sub2Name} onChange={setSub2Name} items={filtered2} />
          <div className="sm:col-span-2">
            <button
              onClick={() => setComparing(true)}
              disabled={!sub1 || !sub2}
              className="cta-btn w-full disabled:opacity-30 disabled:pointer-events-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              Compare
            </button>
          </div>
        </div>
      ) : sub1 && sub2 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full lg:w-3 lg:h-3" style={{ background: CATEGORY_COLORS[sub1.category] }} />
            <span className="text-sm lg:text-[15px] font-display font-semibold text-white">{sub1.name}</span>
          </div>
          <span className="text-[var(--text4)] text-xs lg:text-sm">vs</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full lg:w-3 lg:h-3" style={{ background: CATEGORY_COLORS[sub2.category] }} />
            <span className="text-sm lg:text-[15px] font-display font-semibold text-white">{sub2.name}</span>
          </div>
        </div>
            <button onClick={() => setComparing(false)} className="text-[var(--text4)] hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="info-card" style={{ '--info-c': CATEGORY_COLORS[sub1.category] } as React.CSSProperties}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full lg:w-2.5 lg:h-2.5" style={{ background: CATEGORY_COLORS[sub1.category] }} />
              <span className="text-xs lg:text-[13px] font-display font-semibold text-white">{sub1.name}</span>
              <span className="text-[10px] lg:text-[11px] px-2 py-0.5 rounded-full font-mono" style={{ background: `${HARM_LEVEL_COLORS[sub1.harmLevel]}12`, color: HARM_LEVEL_COLORS[sub1.harmLevel], border: `1px solid ${HARM_LEVEL_COLORS[sub1.harmLevel]}20` }}>
                {sub1.harmLevel}
              </span>
            </div>
            <div className="text-[11px] lg:text-[13px] text-[var(--text4)] space-y-1">
              <p><span className="text-[var(--text3)]">Category:</span> {sub1.category}</p>
              <p><span className="text-[var(--text3)]">Onset:</span> {sub1.onset}</p>
              <p><span className="text-[var(--text3)]">Duration:</span> {sub1.duration}</p>
              <p><span className="text-[var(--text3)]">Harm Score:</span> {sub1.harmScore}/100</p>
            </div>
          </div>
          <div className="info-card" style={{ '--info-c': CATEGORY_COLORS[sub2.category] } as React.CSSProperties}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full lg:w-2.5 lg:h-2.5" style={{ background: CATEGORY_COLORS[sub2.category] }} />
              <span className="text-xs lg:text-[13px] font-display font-semibold text-white">{sub2.name}</span>
              <span className="text-[10px] lg:text-[11px] px-2 py-0.5 rounded-full font-mono" style={{ background: `${HARM_LEVEL_COLORS[sub2.harmLevel]}12`, color: HARM_LEVEL_COLORS[sub2.harmLevel], border: `1px solid ${HARM_LEVEL_COLORS[sub2.harmLevel]}20` }}>
                {sub2.harmLevel}
              </span>
            </div>
            <div className="text-[11px] lg:text-[13px] text-[var(--text4)] space-y-1">
              <p><span className="text-[var(--text3)]">Category:</span> {sub2.category}</p>
              <p><span className="text-[var(--text3)]">Onset:</span> {sub2.onset}</p>
              <p><span className="text-[var(--text3)]">Duration:</span> {sub2.duration}</p>
              <p><span className="text-[var(--text3)]">Harm Score:</span> {sub2.harmScore}/100</p>
            </div>
          </div>
          </div>

          <div className="space-y-2.5">
            {metrics.map(m => {
              const aPct = Math.round((m.a / m.max) * 100)
              const bPct = Math.round((m.b / m.max) * 100)
              const winner = m.lower ? (m.a < m.b ? 'a' : m.a > m.b ? 'b' : 'tie') : (m.a > m.b ? 'a' : m.a < m.b ? 'b' : 'tie')
              return (
            <div key={m.key} className="glass rounded-lg p-3 lg:p-4">
              <div className="text-[11px] lg:text-[13px] font-display font-medium text-[var(--text3)] mb-2">{m.label}</div>
              <div className="flex items-center gap-2">
                <span className={`text-xs lg:text-sm font-mono font-semibold w-7 lg:w-9 text-right ${winner === 'a' ? 'text-green-400' : ''}`}>
                  {m.a}
                </span>
                <div className="flex-1 flex gap-0.5 h-2.5 lg:h-3 items-center">
                      <div className="flex-1 flex justify-end">
                        <div
                          className="h-full rounded-l-full transition-all"
                          style={{
                            width: `${aPct}%`,
                            background: winner === 'a' ? 'var(--green)' : CATEGORY_COLORS[sub1.category],
                            boxShadow: winner === 'a' ? '0 0 8px var(--green)40' : undefined,
                          }}
                        />
                      </div>
                      <div className="w-[2px] h-full bg-[var(--border2)]" />
                      <div className="flex-1">
                        <div
                          className="h-full rounded-r-full transition-all"
                          style={{
                            width: `${bPct}%`,
                            background: winner === 'b' ? 'var(--green)' : CATEGORY_COLORS[sub2.category],
                            boxShadow: winner === 'b' ? '0 0 8px var(--green)40' : undefined,
                          }}
                        />
                      </div>
                    </div>
                    <span className={`text-xs lg:text-sm font-mono font-semibold w-7 lg:w-9 ${winner === 'b' ? 'text-green-400' : ''}`}>
                      {m.b}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AutocompleteInput({
  label,
  value,
  onChange,
  items,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  items: Substance[]
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="relative">
      <label className="text-[11px] lg:text-[13px] font-display font-medium text-[var(--text4)] mb-1.5 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Type a substance..."
        className="w-full px-3.5 py-2.5 lg:px-4 lg:py-3 rounded-xl glass border border-[var(--border2)] text-sm lg:text-[15px] text-white placeholder:text-[var(--text4)] focus:outline-none focus:border-[var(--accent)]/40 transition-colors bg-transparent"
      />
      {focused && items.length > 0 && (
        <div className="absolute z-20 w-full mt-1 glass-strong rounded-xl overflow-hidden shadow-xl border border-[var(--border2)] max-h-48 overflow-y-auto">
          {items.map(s => (
            <button
              key={s.name}
              onMouseDown={() => { onChange(s.name); setFocused(false) }}
          className="w-full px-3.5 py-2.5 lg:px-4 lg:py-3 flex items-center gap-2.5 hover:bg-[rgba(255,255,255,0.04)] transition-colors text-left"
        >
          <span className="w-2 h-2 rounded-full lg:w-2.5 lg:h-2.5 flex-shrink-0" style={{ background: CATEGORY_COLORS[s.category] }} />
          <span className="text-sm lg:text-[15px] text-white font-display truncate">{s.name}</span>
          <span className="text-[10px] lg:text-[11px] text-[var(--text4)] ml-auto font-mono">{s.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
