'use client'

import { useState, useMemo } from 'react'

type DXMForm = 'hbr' | 'freebase'
type WeightUnit = 'kg' | 'lb'

interface PlateauInfo {
  plateau: number
  label: string
  range: string
  color: string
  effects: string
  risk: string
}

const PLATEAUS: PlateauInfo[] = [
  { plateau: 1, label: '1st', range: '1.5–2.5', color: '#10b981', effects: 'Mild stimulation, music enhancement, light euphoria', risk: 'Low' },
  { plateau: 2, label: '2nd', range: '2.5–7.5', color: '#f59e0b', effects: 'Euphoria, introspection, mild dissociation', risk: 'Moderate' },
  { plateau: 3, label: '3rd', range: '7.5–15', color: '#f97316', effects: 'Significant dissociation, out-of-body experiences', risk: 'High' },
  { plateau: 4, label: '4th', range: '15+', color: '#ef4444', effects: 'Near-complete dissociation, ego dissolution', risk: 'Extreme' },
]

const HBR_FACTOR = 1.37
const LB_TO_KG = 0.453592

export default function DXMCalculator() {
  const [weight, setWeight] = useState('')
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg')
  const [dosage, setDosage] = useState('')
  const [form, setForm] = useState<DXMForm>('hbr')

  const weightKg = useMemo(() => {
    const w = parseFloat(weight)
    if (!w || w <= 0 || w > 500) return 0
    return weightUnit === 'lb' ? w * LB_TO_KG : w
  }, [weight, weightUnit])

  const result = useMemo(() => {
    if (!weightKg || weightKg <= 0) {
      const d = parseFloat(dosage)
      if (d && d > 0) return { waiting: true, hbrDosage: form === 'freebase' ? d * HBR_FACTOR : d } as const
      return null
    }
    const d = parseFloat(dosage)
    if (!d || d <= 0) return null

    const hbrEq = form === 'freebase' ? d * HBR_FACTOR : d
    const mgkg = hbrEq / weightKg

    let plateau: PlateauInfo | null = null
    if (mgkg < 1.5) {
      return {
        mgkg, hbrEq, plateau: null as PlateauInfo | null,
        belowThreshold: true, hbrDosage: hbrEq, weightKg,
        needMore: ((1.5 - mgkg) * weightKg / (form === 'freebase' ? HBR_FACTOR : 1)),
      } as const
    } else if (mgkg < 2.5) {
      plateau = PLATEAUS[0]
    } else if (mgkg < 7.5) {
      plateau = PLATEAUS[1]
    } else if (mgkg < 15) {
      plateau = PLATEAUS[2]
    } else {
      plateau = PLATEAUS[3]
    }

    return { mgkg, hbrEq, plateau, belowThreshold: false, hbrDosage: hbrEq, weightKg, needMore: 0 } as const
  }, [weightKg, dosage, form])

  const gaugePercent = useMemo(() => {
    if (!result || 'waiting' in result) return 0
    if (!result.plateau) return Math.min((result.mgkg / 1.5) * 12.5, 12.5)
    if (result.plateau.plateau === 1) return 12.5 + ((result.mgkg - 1.5) / 1) * 12.5
    if (result.plateau.plateau === 2) return 25 + ((result.mgkg - 2.5) / 5) * 25
    if (result.plateau.plateau === 3) return 50 + ((result.mgkg - 7.5) / 7.5) * 25
    return 75 + Math.min((result.mgkg - 15) / 15, 1) * 25
  }, [result])

  const inputBg = 'bg-[rgba(10,10,30,0.5)] border border-[var(--border2)] focus:border-blue-400/40 focus:shadow-[0_0_24px_rgba(59,130,246,0.06)]'
  const segmentBg = 'bg-[rgba(10,10,30,0.5)] border border-[var(--border2)]'
  const isWaiting = result && 'waiting' in result

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-sm text-[var(--text3)] p-5 glass-aero rounded-xl border border-[var(--border)]">
        <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.08)] flex items-center justify-center flex-shrink-0 border border-[rgba(59,130,246,0.08)]">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        </div>
        <span>Calculate DXM plateau based on body weight and dosage</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-[var(--text4)] uppercase tracking-wider">Body Weight</label>
          <div className="flex gap-1.5">
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder={weightUnit === 'kg' ? 'e.g. 70' : 'e.g. 154'}
              min="1"
              className={`flex-1 min-w-0 px-4 py-3.5 rounded-xl text-sm text-white placeholder:text-[var(--text4)] focus:outline-none transition-all ${inputBg}`}
            />
            <div className={`flex rounded-xl overflow-hidden flex-shrink-0 ${segmentBg}`}>
              <button
                onClick={() => setWeightUnit('kg')}
                className={`px-3 py-3 text-xs font-mono font-semibold transition-all ${
                  weightUnit === 'kg' ? 'bg-blue-500/15 text-blue-400 shadow-sm' : 'text-[var(--text4)] hover:text-white'
                }`}
              >
                KG
              </button>
              <button
                onClick={() => setWeightUnit('lb')}
                className={`px-3 py-3 text-xs font-mono font-semibold transition-all ${
                  weightUnit === 'lb' ? 'bg-blue-500/15 text-blue-400 shadow-sm' : 'text-[var(--text4)] hover:text-white'
                }`}
              >
                LB
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-[var(--text4)] uppercase tracking-wider">Dosage (mg)</label>
          <input
            type="number"
            value={dosage}
            onChange={e => setDosage(e.target.value)}
            placeholder="e.g. 300"
            min="1"
            className={`w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder:text-[var(--text4)] focus:outline-none transition-all ${inputBg}`}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-[var(--text4)] uppercase tracking-wider">DXM Form</label>
          <div className={`flex rounded-xl overflow-hidden ${segmentBg}`}>
            <button
              onClick={() => setForm('hbr')}
              className={`flex-1 px-3 py-3 text-sm font-display font-semibold transition-all ${
                form === 'hbr' ? 'bg-blue-500/15 text-blue-400 shadow-sm' : 'text-[var(--text4)] hover:text-white'
              }`}
            >
              HBR
            </button>
            <button
              onClick={() => setForm('freebase')}
              className={`flex-1 px-3 py-3 text-sm font-display font-semibold transition-all ${
                form === 'freebase' ? 'bg-purple-500/15 text-purple-400 shadow-sm' : 'text-[var(--text4)] hover:text-white'
              }`}
            >
              Freebase
            </button>
          </div>
        </div>
      </div>

      {isWaiting && (
        <div className="text-center py-8 glass-aero rounded-xl border border-[var(--border)]">
          <p className="text-xs text-[var(--text4)]">Enter weight to see results</p>
        </div>
      )}

      {result && !isWaiting && (
        <div className="space-y-4" style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
          <div
            className="glass-aero rounded-xl p-5 border transition-all duration-500"
            style={{
              background: result.plateau ? `${result.plateau.color}08` : 'var(--surface)',
              borderColor: result.plateau ? `${result.plateau.color}15` : 'var(--border)',
            }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-5">
              <div>
                <div className="text-[10px] font-mono text-[var(--text4)] uppercase tracking-wider mb-1">HBR Equivalent</div>
                <div className="text-lg font-display font-bold text-white">{result.hbrDosage.toFixed(0)} <span className="text-xs font-mono text-[var(--text3)] font-normal">mg</span></div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-[var(--text4)] uppercase tracking-wider mb-1">Dosage / kg</div>
                <div className="text-lg font-display font-bold text-white">{result.mgkg.toFixed(2)} <span className="text-xs font-mono text-[var(--text3)] font-normal">mg/kg</span></div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-[var(--text4)] uppercase tracking-wider mb-1">Weight</div>
                <div className="text-lg font-display font-bold text-white">
                  {result.weightKg.toFixed(1)} kg
                  {weightUnit === 'lb' && (
                    <span className="text-xs font-mono text-[var(--text4)] font-normal ml-1">({weight} lb)</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-[var(--text4)] uppercase tracking-wider mb-1">Form</div>
                <div className="text-lg font-display font-bold text-white">{form === 'hbr' ? 'HBR' : 'Freebase'}</div>
              </div>
            </div>

            {result.belowThreshold && result.plateau === null && (
              <div className="rounded-xl p-3 bg-amber-500/8 border border-amber-500/15 text-sm text-amber-300/90">
                Below 1st plateau threshold — {result.needMore.toFixed(0)} more mg needed to reach 1st plateau.
              </div>
            )}
          </div>

          <div
            className="relative pt-2 pb-6 px-1"
            style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both' }}
          >
            <div className="relative h-8 sm:h-10 rounded-full overflow-hidden border border-[var(--border2)] bg-[rgba(255,255,255,0.02)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out relative"
                style={{
                  width: `${Math.min(gaugePercent, 100)}%`,
                  background: `linear-gradient(90deg,
                    ${PLATEAUS[0].color} 0%,
                    ${PLATEAUS[1].color} 25%,
                    ${PLATEAUS[2].color} 50%,
                    ${PLATEAUS[3].color} 75%,
                    ${PLATEAUS[3].color} 100%
                  )`,
                  boxShadow: result.plateau
                    ? `0 0 20px ${result.plateau.color}40, inset 0 1px 0 rgba(255,255,255,0.15)`
                    : 'none',
                }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                  <div className="relative">
                    <div
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all duration-500"
                      style={{
                        background: result.plateau ? `${result.plateau.color}` : 'var(--text4)',
                        borderColor: result.plateau ? `${result.plateau.color}` : 'var(--border3)',
                        boxShadow: result.plateau
                          ? `0 0 16px ${result.plateau.color}60, 0 0 40px ${result.plateau.color}30, inset 0 2px 4px rgba(255,255,255,0.3)`
                          : '0 2px 4px rgba(0,0,0,0.3)',
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-20"
                      style={{ background: result.plateau?.color ?? 'var(--text4)', animationDuration: '2s' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-1">
              <div className="flex justify-between px-0">
                {PLATEAUS.map((p, i) => {
                  const active = result.plateau && result.plateau.plateau >= p.plateau
                  return (
                    <div key={p.plateau} className="flex flex-col items-center" style={{ width: '25%' }}>
                      <div
                        className="text-[9px] sm:text-[10px] font-mono font-semibold transition-all duration-300"
                        style={{ color: active ? p.color : 'var(--text4)' }}
                      >
                        {p.label}
                      </div>
                      <div className="text-[8px] sm:text-[9px] text-[var(--text4)] font-mono mt-0.5 opacity-60">
                        {p.range}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between px-0 mt-0.5">
                {[0, 1.5, 2.5, 7.5, 15].map((v, i) => (
                  <div
                    key={v}
                    className="flex flex-col items-center"
                    style={{
                      position: 'absolute',
                      left: `${(v / 20) * 100}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div className="w-px h-1.5 bg-[var(--border2)]" />
                    <div className="text-[7px] text-[var(--text5)] font-mono mt-0.5">{v === 0 ? '0' : v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {(result.plateau || result.belowThreshold) && (
            <div
              className="glass-aero rounded-xl p-5 sm:p-6 border transition-all duration-500"
              style={{
                background: result.plateau ? `${result.plateau.color}06` : 'rgba(245,158,11,0.06)',
                borderColor: result.plateau ? `${result.plateau.color}15` : 'rgba(245,158,11,0.15)',
                animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.2s both',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] font-mono text-[var(--text4)] uppercase tracking-wider mb-1">Current Plateau</div>
                  <h4
                    className="text-lg sm:text-xl font-display font-bold transition-colors duration-500"
                    style={{ color: result.plateau?.color ?? '#f59e0b' }}
                  >
                    {result.plateau ? `${result.plateau.label} Plateau` : 'Below Threshold'}
                  </h4>
                </div>
                {result.plateau && (
                  <span
                    className="px-3 py-1.5 rounded-full text-[10px] font-mono font-semibold uppercase"
                    style={{
                      background: `${result.plateau.color}12`,
                      color: result.plateau.color,
                      border: `1px solid ${result.plateau.color}20`,
                    }}
                  >
                    Risk: {result.plateau.risk}
                  </span>
                )}
              </div>
              {result.plateau && (
                <p className="text-sm text-[var(--text3)] leading-relaxed">{result.plateau.effects}</p>
              )}
            </div>
          )}

          {result.plateau && result.plateau.plateau >= 3 && (
            <div
              className="glass-aero rounded-xl p-4 border text-xs leading-relaxed"
              style={{
                background: `${result.plateau.color}06`,
                borderColor: `${result.plateau.color}15`,
                color: `${result.plateau.color}aa`,
                animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.3s both',
              }}
            >
              High-dose DXM carries risks of psychosis, serotonin syndrome, and physical harm.
              Ensure safe set and setting. Never combine with other substances.
            </div>
          )}
        </div>
      )}

      {!result && !isWaiting && (weight || dosage) && (
        <div className="text-center py-10 glass-aero rounded-xl border border-[var(--border)]">
          <p className="text-xs text-[var(--text4)]">Enter weight and dosage to see results</p>
        </div>
      )}
    </div>
  )
}
