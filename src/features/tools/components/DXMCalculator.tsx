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

  const isWaiting = result && 'waiting' in result

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border p-8 sm:p-10" style={{ background: 'rgba(8,8,24,0.4)', borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-sm font-mono text-[var(--text4)] uppercase tracking-wider flex items-center gap-2.5">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
              Body Weight
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder={weightUnit === 'kg' ? 'e.g. 70' : 'e.g. 154'}
                min="1"
                className="flex-1 min-w-0 px-6 py-5 rounded-xl text-lg text-white placeholder:text-[var(--text4)] focus:outline-none transition-all border focus:border-blue-400/40"
                style={{
                  background: 'rgba(10,10,30,0.5)',
                  borderColor: 'var(--border2)',
                }}
              />
              <div className="flex rounded-xl overflow-hidden flex-shrink-0 border" style={{ background: 'rgba(10,10,30,0.5)', borderColor: 'var(--border2)' }}>
                <button
                  onClick={() => setWeightUnit('kg')}
                  className={`px-5 text-base font-mono font-semibold transition-all ${weightUnit === 'kg' ? 'text-blue-400' : 'text-[var(--text4)] hover:text-white'}`}
                  style={weightUnit === 'kg' ? { background: 'rgba(59,130,246,0.12)' } : {}}
                >
                  KG
                </button>
                <button
                  onClick={() => setWeightUnit('lb')}
                  className={`px-5 text-base font-mono font-semibold transition-all ${weightUnit === 'lb' ? 'text-blue-400' : 'text-[var(--text4)] hover:text-white'}`}
                  style={weightUnit === 'lb' ? { background: 'rgba(59,130,246,0.12)' } : {}}
                >
                  LB
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-mono text-[var(--text4)] uppercase tracking-wider flex items-center gap-2.5">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Dosage (mg)
            </label>
            <input
              type="number"
              value={dosage}
              onChange={e => setDosage(e.target.value)}
              placeholder="e.g. 300"
              min="1"
              className="w-full px-6 py-5 rounded-xl text-lg text-white placeholder:text-[var(--text4)] focus:outline-none transition-all border focus:border-blue-400/40"
              style={{
                background: 'rgba(10,10,30,0.5)',
                borderColor: 'var(--border2)',
              }}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-mono text-[var(--text4)] uppercase tracking-wider flex items-center gap-2.5">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
              DXM Form
            </label>
            <div className="flex rounded-xl overflow-hidden border" style={{ background: 'rgba(10,10,30,0.5)', borderColor: 'var(--border2)' }}>
              <button
                onClick={() => setForm('hbr')}
                className="flex-1 py-5 text-lg font-display font-semibold transition-all"
                style={form === 'hbr' ? { background: 'rgba(59,130,246,0.12)', color: '#60a5fa' } : { color: 'var(--text4)' }}
              >
                HBR
              </button>
              <button
                onClick={() => setForm('freebase')}
                className="flex-1 py-5 text-lg font-display font-semibold transition-all"
                style={form === 'freebase' ? { background: 'rgba(168,85,247,0.12)', color: '#c084fc' } : { color: 'var(--text4)' }}
              >
                Freebase
              </button>
            </div>
          </div>
        </div>
      </div>

      {isWaiting && (
        <div className="text-center py-16 rounded-2xl border border-[var(--border)]" style={{ background: 'rgba(8,8,24,0.4)' }}>
          <p className="text-base text-[var(--text4)]">Enter body weight to calculate plateau</p>
        </div>
      )}

      {result && !isWaiting && (
        <div className="space-y-8" style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
          <div
            className="rounded-2xl border p-8 transition-all duration-500"
            style={{
              background: result.plateau ? `${result.plateau.color}06` : 'rgba(8,8,24,0.4)',
              borderColor: result.plateau ? `${result.plateau.color}20` : 'var(--border)',
            }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div>
                <div className="text-sm font-mono text-[var(--text4)] uppercase tracking-wider mb-3">HBR Equivalent</div>
                <div className="text-2xl font-display font-bold text-white">{result.hbrDosage.toFixed(0)} <span className="text-base font-mono text-[var(--text3)] font-normal">mg</span></div>
              </div>
              <div>
                <div className="text-sm font-mono text-[var(--text4)] uppercase tracking-wider mb-3">Dosage / kg</div>
                <div className="text-2xl font-display font-bold text-white">{result.mgkg.toFixed(2)} <span className="text-base font-mono text-[var(--text3)] font-normal">mg/kg</span></div>
              </div>
              <div>
                <div className="text-sm font-mono text-[var(--text4)] uppercase tracking-wider mb-3">Weight</div>
                <div className="text-2xl font-display font-bold text-white">
                  {result.weightKg.toFixed(1)} kg
                  {weightUnit === 'lb' && (
                    <span className="text-base font-mono text-[var(--text4)] font-normal ml-2">({weight} lb)</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-mono text-[var(--text4)] uppercase tracking-wider mb-3">Form</div>
                <div className="text-2xl font-display font-bold text-white">{form === 'hbr' ? 'HBR' : 'Freebase'}</div>
              </div>
            </div>

            {result.belowThreshold && result.plateau === null && (
              <div className="mt-6 rounded-xl p-5 flex items-start gap-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <svg className="w-6 h-6 mt-0.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-base text-amber-300/90">
                  Below 1st plateau threshold. Take ~{result.needMore.toFixed(0)} more mg to reach 1st plateau.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 pb-8 px-3">
            <div className="relative h-14 sm:h-16 rounded-full overflow-hidden border" style={{ borderColor: 'var(--border2)', background: 'rgba(255,255,255,0.02)' }}>
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
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 transition-all duration-500"
                      style={{
                        background: result.plateau ? result.plateau.color : 'var(--text4)',
                        borderColor: result.plateau ? result.plateau.color : 'var(--border3)',
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

            <div className="relative mt-4">
              <div className="flex justify-between">
                {PLATEAUS.map((p, i) => {
                  const active = result.plateau && result.plateau.plateau >= p.plateau
                  return (
                    <div key={p.plateau} className="flex flex-col items-center" style={{ width: '25%' }}>
                      <div
                        className="text-sm sm:text-base font-mono font-semibold transition-all duration-300"
                        style={{ color: active ? p.color : 'var(--text4)' }}
                      >
                        {p.label}
                      </div>
                      <div className="text-xs sm:text-sm text-[var(--text4)] font-mono mt-1.5 opacity-60">
                        {p.range}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {(result.plateau || result.belowThreshold) && (
            <div
              className="rounded-2xl border p-8 sm:p-10 transition-all duration-500"
              style={{
                background: result.plateau ? `${result.plateau.color}06` : 'rgba(245,158,11,0.06)',
                borderColor: result.plateau ? `${result.plateau.color}20` : 'rgba(245,158,11,0.15)',
                animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.15s both',
              }}
            >
              <div className="flex items-start justify-between gap-8 mb-5">
                <div>
                  <div className="text-sm font-mono text-[var(--text4)] uppercase tracking-wider mb-3">Current Plateau</div>
                  <h4
                    className="text-3xl sm:text-4xl font-display font-bold transition-colors duration-500"
                    style={{ color: result.plateau?.color ?? '#f59e0b' }}
                  >
                    {result.plateau ? `${result.plateau.label} Plateau` : 'Below Threshold'}
                  </h4>
                </div>
                {result.plateau && (
                  <span
                    className="px-5 py-2 rounded-full text-sm font-mono font-semibold uppercase flex-shrink-0"
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
                <p className="text-lg text-[var(--text3)] leading-relaxed">{result.plateau.effects}</p>
              )}
            </div>
          )}

          {result.plateau && result.plateau.plateau >= 3 && (
            <div
              className="rounded-2xl p-6 border text-base leading-relaxed flex items-start gap-5"
              style={{
                background: `${result.plateau.color}06`,
                borderColor: `${result.plateau.color}20`,
                color: `${result.plateau.color}bb`,
                animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.25s both',
              }}
            >
              <svg className="w-7 h-7 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <div>
                <strong style={{ color: result.plateau.color }}>High-dose warning:</strong> DXM at this level carries risks of psychosis, serotonin syndrome, and physical harm. Ensure safe set and setting. Never combine with other substances.
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !isWaiting && (weight || dosage) && (
        <div className="text-center py-16 rounded-2xl border border-[var(--border)]" style={{ background: 'rgba(8,8,24,0.4)' }}>
          <p className="text-base text-[var(--text4)]">Enter both weight and dosage to calculate</p>
        </div>
      )}
    </div>
  )
}
