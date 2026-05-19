'use client'

import { useState, useMemo } from 'react'

type DXMForm = 'hbr' | 'freebase'

interface PlateauInfo {
  level: number
  name: string
  range: string
  color: string
  colorName: string
  effects: string
  risks: string[]
}

const PLATEAUS: PlateauInfo[] = [
  {
    level: 1,
    name: 'First Plateau',
    range: '1.5 - 2.5 mg/kg',
    color: '#10b981',
    colorName: 'green',
    effects: 'Mild mood lift, increased music appreciation, slight body relaxation, enhanced social connection',
    risks: ['Mild impairment', 'Increased heart rate'],
  },
  {
    level: 2,
    name: 'Second Plateau',
    range: '2.5 - 7.5 mg/kg',
    color: '#f59e0b',
    colorName: 'amber',
    effects: 'Strong euphoria, dreamlike state, altered perception of time, mild visual distortions',
    risks: ['Impaired coordination', 'Nausea', 'Dizziness', 'Confusion'],
  },
  {
    level: 3,
    name: 'Third Plateau',
    range: '7.5 - 15 mg/kg',
    color: '#f97316',
    colorName: 'orange',
    effects: 'Deep dissociation, out-of-body sensations, vivid closed-eye visuals, loss of self',
    risks: ['Severe impairment', 'Blackout risk', 'Vomiting', 'Unable to stand'],
  },
  {
    level: 4,
    name: 'Fourth Plateau',
    range: '15+ mg/kg',
    color: '#ef4444',
    colorName: 'red',
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
    if (mgPerKg >= 1.5 && mgPerKg < 2.5) plateau = PLATEAUS[0]
    else if (mgPerKg >= 2.5 && mgPerKg < 7.5) plateau = PLATEAUS[1]
    else if (mgPerKg >= 7.5 && mgPerKg < 15) plateau = PLATEAUS[2]
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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Input Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Weight */}
          <div>
            <label className="flex items-center gap-2 text-base font-medium text-gray-300 mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 17l3-1m0 0l-3-9m0 0a5.002 5.002 0 006.001 0M15 7a2 2 0 114 0m-4 0a2 2 0 114 0m7 0a2 2 0 11-4 0m-4 0a2 2 0 114 0" />
              </svg>
              Body Weight
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={weightUnit === 'kg' ? '70' : '154'}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
              <div className="flex rounded-lg overflow-hidden border border-white/10">
                <button
                  onClick={() => setWeightUnit('kg')}
                  className={`px-5 py-3 text-base font-medium transition-colors ${
                    weightUnit === 'kg' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  kg
                </button>
                <button
                  onClick={() => setWeightUnit('lb')}
                  className={`px-5 py-3 text-base font-medium transition-colors ${
                    weightUnit === 'lb' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  lb
                </button>
              </div>
            </div>
          </div>

          {/* Dosage */}
          <div>
            <label className="flex items-center gap-2 text-base font-medium text-gray-300 mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-5.338 0l-.318-.158a6 6 0 00-3.86-.517L2.572 14.88a2 2 0 01-1.022.547" />
              </svg>
              Dosage (mg)
            </label>
            <input
              type="number"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="300"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          {/* Form */}
          <div>
            <label className="flex items-center gap-2 text-base font-medium text-gray-300 mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              DXM Form
            </label>
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              <button
                onClick={() => setForm('hbr')}
                className={`flex-1 py-3.5 text-base font-medium transition-all ${
                  form === 'hbr' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                HBr
              </button>
              <button
                onClick={() => setForm('freebase')}
                className={`flex-1 py-3.5 text-base font-medium transition-all ${
                  form === 'freebase' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                Freebase
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && result.type !== 'waiting' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2">HBr Equivalent</div>
              <div className="text-3xl font-bold text-white">{result.hbrDosage.toFixed(0)} <span className="text-base font-normal text-gray-400">mg</span></div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2">mg / kg</div>
              <div className="text-3xl font-bold text-white">{result.mgPerKg.toFixed(2)}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2">Weight</div>
              <div className="text-3xl font-bold text-white">{result.weightKg.toFixed(1)} <span className="text-base font-normal text-gray-400">kg</span></div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2">Form</div>
              <div className="text-3xl font-bold text-white">{form === 'hbr' ? 'HBr' : 'Freebase'}</div>
            </div>
          </div>

          {/* Below threshold */}
          {result.type === 'below' && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 flex items-start gap-4">
              <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-amber-400 font-medium mb-2 text-lg">Below threshold</div>
                <p className="text-base text-gray-300">
                  This dose is below the first plateau. Add approximately <strong className="text-white text-lg">{result.needMore.toFixed(0)} mg</strong> more to reach the first plateau.
                </p>
              </div>
            </div>
          )}

          {/* Gauge */}
          {result.type === 'plateau' && (
            <>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="relative h-6 rounded-full overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${gaugePosition}%`,
                      background: 'linear-gradient(90deg, #10b981 0%, #f59e0b 25%, #f97316 50%, #ef4444 100%)',
                    }}
                  />
                </div>
                <div className="flex justify-between text-base text-gray-400">
                  <span>1st</span>
                  <span>2nd</span>
                  <span>3rd</span>
                  <span>4th</span>
                </div>
              </div>

              {/* Plateau Card */}
              {result.plateau && (
                <div className="space-y-6">
                  <div
                    className="rounded-2xl p-8 border-2"
                    style={{ borderColor: result.plateau.color, background: result.plateau.color + '10' }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-3xl font-bold text-white">{result.plateau.name}</h3>
                        <p className="text-base text-gray-400 mt-2">{result.plateau.range}</p>
                      </div>
                      <span
                        className="px-5 py-2.5 rounded-full text-base font-bold uppercase"
                        style={{ background: result.plateau.color + '20', color: result.plateau.color }}
                      >
                        Plateau {result.plateau.level}
                      </span>
                    </div>
                    <p className="text-lg text-gray-300 mb-6">{result.plateau.effects}</p>
                    <div>
                      <div className="text-base font-medium text-gray-400 mb-3">Effects & Risks:</div>
                      <div className="flex flex-wrap gap-3">
                        {result.plateau.risks.map((risk) => (
                          <span
                            key={risk}
                            className="px-4 py-2 rounded-full text-sm font-medium"
                            style={{ background: result.plateau.color + '20', color: result.plateau.color }}
                          >
                            {risk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Safety Warning */}
                  {result.plateau.level >= 3 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start gap-4">
                      <svg className="w-7 h-7 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <div className="text-red-400 font-bold mb-2 text-lg">High-Dose Warning</div>
                        <p className="text-base text-gray-300">
                          Doses at this level carry serious risks including psychosis, serotonin syndrome, and physical harm. Ensure safe set and setting. Never combine with other substances. Have a sober sitter present.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Waiting for input */}
      {result?.type === 'waiting' && (
        <div className="text-center py-16 text-gray-400 text-lg">
          Enter your body weight to see results
        </div>
      )}

      {!result && !weight && !dosage && (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg text-gray-400">Enter your weight and dosage to calculate</p>
        </div>
      )}
    </div>
  )
}
