'use client'

import { useState, useMemo } from 'react'

type DXMForm = 'hbr' | 'freebase'

interface PlateauInfo {
  plateau: number
  label: string
  range: string
  color: string
  effects: string
  risk: string
}

const PLATEAUS: PlateauInfo[] = [
  { plateau: 1, label: '1st Plateau', range: '1.5 - 2.5 mg/kg', color: '#22c55e', effects: 'Mild stimulation, music enhancement, light euphoria', risk: 'Low' },
  { plateau: 2, label: '2nd Plateau', range: '2.5 - 7.5 mg/kg', color: '#eab308', effects: 'Euphoria, introspection, mild dissociation', risk: 'Moderate' },
  { plateau: 3, label: '3rd Plateau', range: '7.5 - 15 mg/kg', color: '#f97316', effects: 'Significant dissociation, out-of-body experiences', risk: 'High' },
  { plateau: 4, label: '4th Plateau', range: '15+ mg/kg', color: '#ef4444', effects: 'Near-complete dissociation, ego dissolution', risk: 'Extreme' },
]

const HBR_FACTOR = 1.37

export default function DXMCalculator() {
  const [weight, setWeight] = useState('')
  const [dosage, setDosage] = useState('')
  const [form, setForm] = useState<DXMForm>('hbr')

  const result = useMemo(() => {
    const w = parseFloat(weight)
    const d = parseFloat(dosage)
    if (!w || !d || w <= 0 || d <= 0) return null

    const hbrEq = form === 'freebase' ? d * HBR_FACTOR : d
    const mgkg = hbrEq / w

    let plateau: PlateauInfo
    if (mgkg < 1.5) {
      return { mgkg, hbrEq, plateau: null, belowThreshold: true, hbrDosage: hbrEq }
    } else if (mgkg < 2.5) {
      plateau = PLATEAUS[0]
    } else if (mgkg < 7.5) {
      plateau = PLATEAUS[1]
    } else if (mgkg < 15) {
      plateau = PLATEAUS[2]
    } else {
      plateau = PLATEAUS[3]
    }

    return { mgkg, hbrEq, plateau, belowThreshold: false, hbrDosage: hbrEq }
  }, [weight, dosage, form])

  const plateauPercent = useMemo(() => {
    if (!result?.plateau) return 0
    if (result.plateau.plateau === 1) return ((result.mgkg - 1.5) / 1) * 25
    if (result.plateau.plateau === 2) return 25 + ((result.mgkg - 2.5) / 5) * 25
    if (result.plateau.plateau === 3) return 50 + ((result.mgkg - 7.5) / 7.5) * 25
    return 75 + Math.min((result.mgkg - 15) / 15, 1) * 25
  }, [result])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 text-sm text-[var(--text3)]">
        <div className="w-8 h-8 rounded-xl bg-[rgba(59,130,246,0.08)] flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        </div>
        <span>Calculate DXM dosage based on body weight and determine plateau</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-[var(--text4)] uppercase tracking-wider">Body Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="e.g. 70"
            min="1"
            className="w-full px-3 py-3 rounded-xl glass border border-[var(--border2)] text-sm text-white placeholder:text-[var(--text4)] focus:outline-none focus:border-blue-400/40 transition-all bg-transparent"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-[var(--text4)] uppercase tracking-wider">Dosage (mg)</label>
          <input
            type="number"
            value={dosage}
            onChange={e => setDosage(e.target.value)}
            placeholder="e.g. 300"
            min="1"
            className="w-full px-3 py-3 rounded-xl glass border border-[var(--border2)] text-sm text-white placeholder:text-[var(--text4)] focus:outline-none focus:border-blue-400/40 transition-all bg-transparent"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-[var(--text4)] uppercase tracking-wider">DXM Form</label>
          <div className="flex gap-2">
            <button
              onClick={() => setForm('hbr')}
              className={`flex-1 px-3 py-3 rounded-xl text-sm font-display transition-all ${
                form === 'hbr'
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-400/25'
                  : 'glass border border-[var(--border2)] text-[var(--text4)] hover:text-white'
              }`}
            >
              HBR
            </button>
            <button
              onClick={() => setForm('freebase')}
              className={`flex-1 px-3 py-3 rounded-xl text-sm font-display transition-all ${
                form === 'freebase'
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-400/25'
                  : 'glass border border-[var(--border2)] text-[var(--text4)] hover:text-white'
              }`}
            >
              Freebase
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-4" style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
          <div className="glass rounded-xl p-4 border border-[var(--border)]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div>
                <div className="text-[10px] font-mono text-[var(--text4)] uppercase tracking-wider mb-1">Dosage (HBR eq.)</div>
                <div className="text-lg font-display font-bold text-white">{result.hbrDosage.toFixed(0)} mg</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-[var(--text4)] uppercase tracking-wider mb-1">mg / kg</div>
                <div className="text-lg font-display font-bold text-white">{result.mgkg.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-[var(--text4)] uppercase tracking-wider mb-1">Form</div>
                <div className="text-lg font-display font-bold text-white">{form === 'hbr' ? 'HBR' : 'Freebase'}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-[var(--text4)] uppercase tracking-wider mb-1">Weight</div>
                <div className="text-lg font-display font-bold text-white">{weight} kg</div>
              </div>
            </div>

            {result.belowThreshold && (
              <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
                Below 1st plateau threshold — {((1.5 - (result.mgkg as number)) * parseFloat(weight) / (form === 'freebase' ? HBR_FACTOR : 1)).toFixed(0)} more mg needed to reach 1st plateau.
              </div>
            )}
          </div>

          {result.plateau && (
            <>
              <div className="relative pt-8 pb-4">
                <div className="absolute top-0 left-0 right-0 h-2 rounded-full overflow-hidden glass border border-[var(--border)]">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(plateauPercent, 100)}%`,
                      background: `linear-gradient(90deg, ${PLATEAUS.map((p, i) =>
                        `${p.color} ${i * 25}%, ${p.color} ${(i + 1) * 25}%`
                      ).join(', ')})`,
                      boxShadow: `0 0 12px ${result.plateau.color}40`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  {PLATEAUS.map(p => (
                    <div key={p.plateau} className="text-center" style={{ width: '25%' }}>
                      <div
                        className={`text-[10px] font-mono font-semibold transition-colors ${
                          result.plateau && result.plateau.plateau >= p.plateau ? '' : 'text-[var(--text5)]'
                        }`}
                        style={{ color: result.plateau && result.plateau.plateau >= p.plateau ? p.color : undefined }}
                      >
                        {p.label}
                      </div>
                      <div className="text-[9px] text-[var(--text4)] mt-0.5">{p.range}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="rounded-xl p-4 border transition-all"
                style={{
                  background: `${result.plateau.color}08`,
                  borderColor: `${result.plateau.color}20`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-display font-semibold" style={{ color: result.plateau.color }}>
                    {result.plateau.label}
                  </h4>
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase"
                    style={{
                      background: `${result.plateau.color}15`,
                      color: result.plateau.color,
                      border: `1px solid ${result.plateau.color}25`,
                    }}
                  >
                    Risk: {result.plateau.risk}
                  </span>
                </div>
                <p className="text-sm text-[var(--text3)] leading-relaxed">{result.plateau.effects}</p>
              </div>

              {result.plateau.plateau >= 3 && (
                <div className="rounded-xl p-3 bg-red-500/5 border border-red-500/15 text-xs text-red-300/70 leading-relaxed">
                  ⚠ High-dose DXM carries risks of psychosis, serotonin syndrome, and physical harm.
                  Ensure a safe set and setting. Never combine with other substances.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!result && (weight || dosage) && (
        <div className="text-center py-8 glass rounded-xl border border-[var(--border)]">
          <p className="text-xs text-[var(--text4)]">Enter weight and dosage to see results</p>
        </div>
      )}
    </div>
  )
}
