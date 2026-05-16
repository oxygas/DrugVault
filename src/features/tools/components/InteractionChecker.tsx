'use client'

import { useState, useMemo } from 'react'
import type { Substance, Category, ComboLevel, SubstanceCombo } from '@/lib/types'
import { CATEGORY_COLORS, COMBO_LEVEL_COLORS, COMBO_LEVEL_LABELS, COMBO_DESCRIPTIONS } from '@/lib/types'

interface InteractionCheckerProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  substanceCombos?: SubstanceCombo[]
}

export default function InteractionChecker({ substances, comboRules, substanceCombos }: InteractionCheckerProps) {
  const [sub1, setSub1] = useState('')
  const [sub2, setSub2] = useState('')
  const [result, setResult] = useState<{ level: ComboLevel; sub1: Substance; sub2: Substance; description: string; note?: string | null } | null>(null)
  const [error, setError] = useState('')

  const subComboMap = useMemo(() => {
    const m = new Map<string, SubstanceCombo>()
    if (!substanceCombos) return m
    const aliasMap = new Map<string, string>()
    for (const s of substances) {
      const key = s.name.toLowerCase()
      aliasMap.set(key, key)
      for (const a of s.aliases) aliasMap.set(a.toLowerCase(), key)
    }
    for (const c of substanceCombos) {
      const aR = aliasMap.get(c.substanceA.toLowerCase()) ?? c.substanceA.toLowerCase()
      const bR = aliasMap.get(c.substanceB.toLowerCase()) ?? c.substanceB.toLowerCase()
      m.set(`${aR}+${bR}`, c)
      m.set(`${bR}+${aR}`, c)
    }
    return m
  }, [substanceCombos, substances])

  const filtered1 = useMemo(() =>
    sub1.length >= 1 ? substances.filter(s => s.name.toLowerCase().includes(sub1.toLowerCase())).slice(0, 6) : [],
    [sub1, substances]
  )
  const filtered2 = useMemo(() =>
    sub2.length >= 1 ? substances.filter(s => s.name.toLowerCase().includes(sub2.toLowerCase())).slice(0, 6) : [],
    [sub2, substances]
  )

  const getComboLevel = (a: Category, b: Category): ComboLevel => {
    if (a === b) return 'low_risk'
    return comboRules[`${a}+${b}`] || comboRules[`${b}+${a}`] || 'caution'
  }

  const check = () => {
    setError('')
    setResult(null)
    const s1 = substances.find(s => s.name.toLowerCase() === sub1.toLowerCase())
    const s2 = substances.find(s => s.name.toLowerCase() === sub2.toLowerCase())
    if (!s1 || !s2) {
      setError(s1 ? `"${sub2}" not found` : s2 ? `"${sub1}" not found` : `Neither substance found`)
      return
    }
    const scKey = `${s1.name.toLowerCase()}+${s2.name.toLowerCase()}`
    const subCombo = subComboMap.get(scKey)
    if (subCombo) {
      setResult({ level: subCombo.level, sub1: s1, sub2: s2, description: subCombo.note ?? COMBO_DESCRIPTIONS[subCombo.level] ?? '', note: subCombo.note })
    } else {
      const level = getComboLevel(s1.category, s2.category)
      setResult({ level, sub1: s1, sub2: s2, description: COMBO_DESCRIPTIONS[level] ?? '' })
    }
  }

  const levelColor = result ? COMBO_LEVEL_COLORS[result.level] : ''

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AutocompleteInput
          label="Substance A"
          value={sub1}
          onChange={setSub1}
          items={filtered1}
          color={result ? CATEGORY_COLORS[result.sub1.category] : 'var(--accent)'}
        />
        <AutocompleteInput
          label="Substance B"
          value={sub2}
          onChange={setSub2}
          items={filtered2}
          color={result ? CATEGORY_COLORS[result.sub2.category] : 'var(--accent)'}
        />
      </div>

      <button onClick={check} className="cta-btn w-full">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Check Interaction
      </button>

      {error && (
        <div className="info-card" style={{ '--info-c': 'var(--red)' } as React.CSSProperties}>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="info-card" style={{ '--info-c': levelColor } as React.CSSProperties}>
          <div className="flex items-center gap-2.5 mb-3">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[result.sub1.category] }} />
          <span className="text-sm lg:text-[15px] font-display font-medium text-white">{result.sub1.name}</span>
          <span className="text-[var(--text4)]">+</span>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[result.sub2.category] }} />
          <span className="text-sm lg:text-[15px] font-display font-medium text-white">{result.sub2.name}</span>
          </div>
          <div className="flex items-center gap-2.5 mb-2">
          <span
          className={`px-3 py-1 lg:px-3.5 lg:py-1.5 rounded-full text-xs lg:text-sm font-semibold font-mono uppercase ${result.level === 'deadly' ? 'deadly-pulse' : ''}`}
          style={{ background: `${levelColor}15`, color: levelColor, border: `1px solid ${levelColor}25` }}
          >
          {COMBO_LEVEL_LABELS[result.level]}
          </span>
          </div>
      <p className="text-sm lg:text-[15px] text-[var(--text3)] leading-relaxed">
        {result.description}
      </p>
      {result.note && result.note !== result.description && (
        <p className="text-xs lg:text-sm text-[var(--text4)] leading-relaxed mt-2 italic">
          {result.note}
        </p>
      )}
        </div>
      )}
    </div>
  )
}

function AutocompleteInput({
  label,
  value,
  onChange,
  items,
  color,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  items: Substance[]
  color: string
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="relative">
      <label className="text-[11px] font-display font-medium text-[var(--text4)] mb-1.5 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Type a substance..."
        className="w-full px-3.5 py-2.5 rounded-xl glass border border-[var(--border2)] text-sm text-white placeholder:text-[var(--text4)] focus:outline-none focus:border-[var(--accent)]/40 transition-colors bg-transparent"
      />
      {focused && items.length > 0 && (
        <div className="absolute z-20 w-full mt-1 glass-strong rounded-xl overflow-hidden shadow-xl border border-[var(--border2)] max-h-48 overflow-y-auto">
          {items.map(s => (
            <button
              key={s.name}
              onMouseDown={() => { onChange(s.name); setFocused(false) }}
              className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-[rgba(255,255,255,0.04)] transition-colors text-left"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[s.category] }} />
              <span className="text-sm text-white font-display truncate">{s.name}</span>
              <span className="text-[10px] text-[var(--text4)] ml-auto font-mono">{s.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
