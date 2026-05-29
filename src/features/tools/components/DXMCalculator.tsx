'use client'

import { useState, useMemo, useEffect } from 'react'

type DXMForm = 'hbr' | 'freebase'

interface PlateauInfo {
  level: number
  name: string
  range: string
  color: string
  effects: string
  risks: string[]
}

const PLATEAUS: PlateauInfo[] = [
  {
    level: 1,
    name: 'First Plateau',
    range: '1.5 – 2.5 mg/kg',
    color: '#10b981',
    effects: 'Mild mood lift, increased music appreciation, slight body relaxation, enhanced social connection',
    risks: ['Mild impairment', 'Increased heart rate'],
  },
  {
    level: 2,
    name: 'Second Plateau',
    range: '2.5 – 7.5 mg/kg',
    color: '#f59e0b',
    effects: 'Strong euphoria, dreamlike state, altered time perception, mild visual distortions',
    risks: ['Impaired coordination', 'Nausea', 'Dizziness', 'Confusion'],
  },
  {
    level: 3,
    name: 'Third Plateau',
    range: '7.5 – 15 mg/kg',
    color: '#f97316',
    effects: 'Deep dissociation, out-of-body sensations, vivid closed-eye visuals, loss of self',
    risks: ['Severe impairment', 'Blackout risk', 'Vomiting', 'Unable to stand'],
  },
  {
    level: 4,
    name: 'Fourth Plateau',
    range: '15+ mg/kg',
    color: '#ef4444',
    effects: 'Complete dissociation, ego death, near-total loss of physical form, profound mystical experiences',
    risks: ['Dangerous dissociation', 'Respiratory depression', 'Unconsciousness', 'Medical emergency'],
  },
]

const HBR_FACTOR = 1.37
const LB_TO_KG = 0.453592

export default function DXMCalculator() {
  const [weight, setWeight] = useState('')
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg')
  const [dosage, setDosage] = useState('')
  const [form, setForm] = useState<DXMForm>('hbr')
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial') // Default to imperial
  const [loading, setLoading] = useState(true)

  // Auto-detect unit system based on IP geolocation on mount
  useEffect(() => {
    const detectUnitSystem = async () => {
      try {
        const response = await fetch('/api/ip-geolocation')
        const data = await response.json()
        setUnitSystem(data.system === 'metric' ? 'metric' : 'imperial')
        // Set the weight unit to match the detected system
        setWeightUnit(data.system === 'metric' ? 'kg' : 'lb')
      } catch (error) {
        console.error('Failed to fetch IP geolocation:', error)
        // Fallback to imperial (lb) for safety with dosage calculations
        setUnitSystem('imperial')
        setWeightUnit('lb')
      } finally {
        setLoading(false)
      }
    }

    detectUnitSystem()
  }, [])

  const weightKg = useMemo(() => {
    const w = parseFloat(weight)
    if (!w || w <= 0 || w > 500) return 0
    return weightUnit === 'lb' ? w * LB_TO_KG : w
  }, [weight, weightUnit])

  const result = useMemo(() => {
    if (!weightKg || weightKg <= 0) {
      const d = parseFloat(dosage)
      if (d && d > 0) {
        const hbrDosage = form === 'freebase' ? d * HBR_FACTOR : d
        return { type: 'waiting', hbrDosage } as const
      }
      return null
    }

    const d = parseFloat(dosage)
    if (!d || d <= 0) return null

    const hbrEq = form === 'freebase' ? d * HBR_FACTOR : d
    const mgPerKg = hbrEq / weightKg

    if (mgPerKg < 1.5) {
      const needMore = ((1.5 - mgPerKg) * weightKg) / (form === 'freebase' ? HBR_FACTOR : 1)
      return { type: 'below', mgPerKg, needMore, hbrDosage: hbrEq, weightKg } as const
    }

    let plateau: PlateauInfo | null = null
    if (mgPerKg < 2.5) plateau = PLATEAUS[0]
    else if (mgPerKg < 7.5) plateau = PLATEAUS[1]
    else if (mgPerKg < 15) plateau = PLATEAUS[2]
    else plateau = PLATEAUS[3]

    return { type: 'plateau', mgPerKg, hbrDosage: hbrEq, weightKg, plateau } as const
  }, [weightKg, dosage, form])

  const gaugePosition = useMemo(() => {
    if (!result || result.type === 'waiting') return 0
    if (result.type === 'below') return Math.min((result.mgPerKg / 1.5) * 15, 15)
    if (result.plateau?.level === 1) return 15 + ((result.mgPerKg - 1.5) / 1) * 20
    if (result.plateau?.level === 2) return 35 + ((result.mgPerKg - 2.5) / 5) * 25
    if (result.plateau?.level === 3) return 60 + ((result.mgPerKg - 7.5) / 7.5) * 25
    return 85 + Math.min((result.mgPerKg - 15) / 15, 1) * 15
  }, [result])

  const isWaiting = result?.type === 'waiting'

  return (
    <div className="w-full space-y-6 sm:space-y-10 lg:space-y-14">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Body Weight Card */}
          <div
            className="rounded-xl sm:rounded-2xl border border-[var(--border)] p-5 sm:p-8 lg:p-10 space-y-4 sm:space-y-6"
            style={{ background: 'rgba(8,8,24,0.4)' }}
          >
            <label className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-sm font-mono text-[var(--text4)] uppercase tracking-[0.2em]">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
              Body Weight
            </label>
             <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder={weightUnit === 'kg' ? 'e.g. 70' : 'e.g. 154'}
                className="flex-1 min-w-0 w-full sm:w-auto px-5 sm:px-8 py-4 sm:py-5 rounded-xl text-base sm:text-xl text-white placeholder:text-[var(--text4)] bg-[rgba(10,10,30,0.5)] border border-[var(--border2)] focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <div className="flex items-center gap-3">
                <div className="flex rounded-xl overflow-hidden border-2 border-[var(--border2)] bg-[rgba(10,10,30,0.5)]">
                  <button
                    onClick={() => setWeightUnit('kg')}
                    className={`px-5 sm:px-8 py-4 sm:py-5 text-base sm:text-lg font-mono font-bold tracking-wider transition-all min-w-[64px] sm:min-w-[72px] ${
                      weightUnit === 'kg' ? 'text-blue-400 bg-blue-500/10' : 'text-[var(--text4)] hover:text-white'
                    }`}
                  >
                    KG
                  </button>
                  <button
                    onClick={() => setWeightUnit('lb')}
                    className={`px-5 sm:px-8 py-4 sm:py-5 text-base sm:text-lg font-mono font-bold tracking-wider transition-all min-w-[64px] sm:min-w-[72px] ${
                      weightUnit === 'lb' ? 'text-blue-400 bg-blue-500/10' : 'text-[var(--text4)] hover:text-white'
                    }`}
                  >
                    LB
                  </button>
                </div>
               {!loading && (
                 <span className="text-xs font-mono text-[var(--text4)]">
                   Detected: {unitSystem === 'metric' ? 'kg' : 'lb'}
                 </span>
               )}
               {loading && (
                 <span className="text-xs font-mono text-[var(--text4)] animate-pulse">
                   Detecting...
                 </span>
               )}
             </div>
           </div>
        </div>

        {/* Dosage + Form Card */}
        <div
          className="rounded-xl sm:rounded-2xl border border-[var(--border)] p-5 sm:p-8 lg:p-10 space-y-5 sm:space-y-8"
          style={{ background: 'rgba(8,8,24,0.4)' }}
        >
          <div className="space-y-3 sm:space-y-6">
            <label className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-sm font-mono text-[var(--text4)] uppercase tracking-[0.2em]">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Total Dosage (mg)
            </label>
            <input
              type="number"
              value={dosage}
              onChange={e => setDosage(e.target.value)}
              placeholder="e.g. 300"
              className="w-full px-5 sm:px-8 py-4 sm:py-5 rounded-xl text-base sm:text-xl text-white placeholder:text-[var(--text4)] bg-[rgba(10,10,30,0.5)] border border-[var(--border2)] focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="space-y-3 sm:space-y-6">
            <label className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-sm font-mono text-[var(--text4)] uppercase tracking-[0.2em]">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
              DXM Form
            </label>
            <div className="flex rounded-xl overflow-hidden border-2 border-[var(--border2)] bg-[rgba(10,10,30,0.5)]">
              {(['hbr', 'freebase'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setForm(f)}
                  className={`flex-1 py-4 sm:py-5 text-base sm:text-lg font-bold tracking-wider transition-all ${
                    form === f
                      ? 'text-white bg-purple-500/15'
                      : 'text-[var(--text4)] hover:text-white'
                  }`}
                >
                  {f === 'hbr' ? 'HBr' : 'Freebase'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Waiting for weight */}
      {isWaiting && (
        <div
          className="rounded-xl sm:rounded-2xl border border-[var(--border)] py-12 sm:py-20 px-5 sm:px-10 text-center"
          style={{ background: 'rgba(8,8,24,0.3)' }}
        >
          <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-5 sm:mb-8 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <svg className="w-7 h-7 sm:w-10 sm:h-10 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          </div>
          <p className="text-base sm:text-xl text-[var(--text3)] leading-relaxed">Enter your body weight to calculate the plateau.</p>
        </div>
      )}

      {/* Results */}
      {result && !isWaiting && (
        <div className="space-y-5 sm:space-y-10" style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
            {[
              { label: 'HBr Equivalent', value: `${result.hbrDosage.toFixed(0)} mg` },
              { label: 'Dosage per kg', value: `${result.mgPerKg.toFixed(2)} mg/kg` },
              { label: 'Body Weight', value: `${result.weightKg.toFixed(1)} kg${weightUnit === 'lb' ? ` (${weight} lb)` : ''}` },
              { label: 'Form', value: form === 'hbr' ? 'HBr' : 'Freebase' },
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-lg sm:rounded-xl border border-[var(--border)] p-4 sm:p-8"
                style={{ background: 'rgba(8,8,24,0.3)' }}
              >
                <div className="text-[10px] sm:text-xs font-mono text-[var(--text4)] uppercase tracking-[0.15em] mb-1 sm:mb-3">{stat.label}</div>
                <div className="text-lg sm:text-2xl lg:text-3xl font-display font-bold text-white">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Below threshold */}
          {result.type === 'below' && (
            <div
              className="rounded-xl sm:rounded-2xl border-2 p-5 sm:p-12 flex flex-col sm:flex-row items-start gap-4 sm:gap-8"
              style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.25)' }}
            >
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.2)' }}
              >
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xl sm:text-2xl font-display font-bold text-amber-300 mb-2 sm:mb-3">Below First Plateau</h4>
                <p className="text-sm sm:text-lg text-[var(--text3)] leading-relaxed">
                  Your dosage of {result.mgPerKg.toFixed(2)} mg/kg is below the 1st plateau threshold.
                  Take approximately <strong className="text-amber-300 text-base sm:text-xl">{result.needMore.toFixed(0)} mg</strong> more
                  ({((result.needMore + parseFloat(dosage || '0')) / (form === 'freebase' ? HBR_FACTOR : 1)).toFixed(0)} mg{' '}
                  {form === 'freebase' ? 'freebase' : 'HBr'} total) to reach the 1st plateau.
                </p>
              </div>
            </div>
          )}

          {/* Plateau Result */}
          {result.plateau && (
            <div
              className="rounded-xl sm:rounded-2xl border-2 p-6 sm:p-10 lg:p-14 space-y-6 sm:space-y-10"
              style={{ background: `${result.plateau.color}05`, borderColor: `${result.plateau.color}22` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6">
                <div>
                  <div className="text-[10px] sm:text-xs font-mono text-[var(--text4)] uppercase tracking-[0.2em] mb-2 sm:mb-4">Current Plateau</div>
                  <h2
                    className="text-2xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-tight"
                    style={{ color: result.plateau.color }}
                  >
                    {result.plateau.name}
                  </h2>
                  <p className="text-xs sm:text-base text-[var(--text4)] font-mono mt-1 sm:mt-3">{result.plateau.range}</p>
                </div>
                <span
                  className="px-5 sm:px-8 py-2 sm:py-3 rounded-full text-xs sm:text-base font-mono font-bold uppercase tracking-wider flex-shrink-0 self-start"
                  style={{ background: `${result.plateau.color}15`, color: result.plateau.color, border: `2px solid ${result.plateau.color}25` }}
                >
                  Level {result.plateau.level}
                </span>
              </div>

              <div className="relative h-2 sm:h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${gaugePosition}%`,
                    background: `linear-gradient(90deg, ${result.plateau.color}, ${result.plateau.color}88)`,
                  }}
                />
              </div>

              <div>
                <h4 className="text-[10px] sm:text-sm font-mono text-[var(--text4)] uppercase tracking-[0.2em] mb-3 sm:mb-5">Expected Effects</h4>
                <p className="text-sm sm:text-lg lg:text-xl text-[var(--text3)] leading-relaxed">{result.plateau.effects}</p>
              </div>

              <div>
                <h4 className="text-[10px] sm:text-sm font-mono text-[var(--text4)] uppercase tracking-[0.2em] mb-3 sm:mb-5">Risks & Side Effects</h4>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {result.plateau.risks.map(risk => (
                    <span
                      key={risk}
                      className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-base font-semibold"
                      style={{ background: `${result.plateau.color}10`, color: result.plateau.color, border: `1px solid ${result.plateau.color}20` }}
                    >
                      {risk}
                    </span>
                  ))}
                </div>
              </div>

              {result.plateau.level >= 3 && (
                <div
                  className="rounded-lg sm:rounded-xl p-4 sm:p-8 flex items-start gap-3 sm:gap-6"
                  style={{ background: `${result.plateau.color}08`, border: `2px solid ${result.plateau.color}20` }}
                >
                  <svg className="w-5 h-5 sm:w-8 sm:h-8 mt-0.5 flex-shrink-0" style={{ color: result.plateau.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <div>
                    <strong className="text-base sm:text-xl" style={{ color: result.plateau.color }}>High-dose warning</strong>
                    <p className="text-sm sm:text-lg text-[var(--text3)] leading-relaxed mt-1 sm:mt-2">
                      DXM at this level carries risks of psychosis, serotonin syndrome, and physical harm.
                      Ensure safe set and setting. Never combine with other substances.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty: partially filled */}
      {!result && !isWaiting && (weight || dosage) && (
        <div
          className="rounded-xl sm:rounded-2xl border border-[var(--border)] py-12 sm:py-20 px-5 sm:px-10 text-center"
          style={{ background: 'rgba(8,8,24,0.3)' }}
        >
          <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-5 sm:mb-8 rounded-xl sm:rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
            <svg className="w-7 h-7 sm:w-10 sm:h-10 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          </div>
          <p className="text-base sm:text-xl text-[var(--text3)] leading-relaxed">Enter both weight and dosage to calculate your plateau.</p>
        </div>
      )}

      {/* Empty: nothing filled */}
      {!result && !weight && !dosage && (
        <div
          className="rounded-xl sm:rounded-2xl border border-[var(--border)] py-16 sm:py-28 px-5 sm:px-10 text-center"
          style={{ background: 'rgba(8,8,24,0.2)' }}
        >
          <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-5 sm:mb-10 rounded-2xl sm:rounded-3xl bg-[var(--accent)]/5 border border-[var(--border)] flex items-center justify-center">
            <svg className="w-8 h-8 sm:w-12 sm:h-12 text-[var(--text4)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <h3 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3 sm:mb-4">DXM Plateau Calculator</h3>
          <p className="text-sm sm:text-lg text-[var(--text4)] max-w-lg mx-auto leading-relaxed px-4 sm:px-0">
            Enter your weight and dosage above to determine your DXM plateau.
            Supports both HBr and Freebase formulations with automatic conversion.
          </p>
        </div>
      )}
    </div>
  )
}
