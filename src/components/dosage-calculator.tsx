'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, FlaskConical, Timer, Weight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ROADose {
  roa: string
  threshold: number
  lightMin: number
  lightMax: number
  commonMin: number
  commonMax: number
  strongMin: number
  strongMax: number
  heavyMin: number
  unit: string
  onset: string
  duration: string
  afterEffects: string
}

const SUBSTANCE_DOSES: Record<string, ROADose[]> = {
  MDMA: [
    {
      roa: 'Oral',
      threshold: 30,
      lightMin: 40, lightMax: 75,
      commonMin: 80, commonMax: 120,
      strongMin: 130, strongMax: 170,
      heavyMin: 180,
      unit: 'mg',
      onset: '30–60 min',
      duration: '3–5 h',
      afterEffects: '2–4 h',
    },
    {
      roa: 'Insufflated',
      threshold: 15,
      lightMin: 20, lightMax: 40,
      commonMin: 45, commonMax: 70,
      strongMin: 75, strongMax: 100,
      heavyMin: 110,
      unit: 'mg',
      onset: '5–15 min',
      duration: '2–3 h',
      afterEffects: '1–2 h',
    },
    {
      roa: 'Rectal',
      threshold: 20,
      lightMin: 30, lightMax: 50,
      commonMin: 55, commonMax: 80,
      strongMin: 85, strongMax: 110,
      heavyMin: 120,
      unit: 'mg',
      onset: '5–10 min',
      duration: '3–5 h',
      afterEffects: '2–4 h',
    },
  ],
  LSD: [
    {
      roa: 'Oral',
      threshold: 15,
      lightMin: 25, lightMax: 50,
      commonMin: 60, commonMax: 150,
      strongMin: 175, strongMax: 300,
      heavyMin: 350,
      unit: 'µg',
      onset: '30–90 min',
      duration: '8–12 h',
      afterEffects: '6–12 h',
    },
    {
      roa: 'Sublingual',
      threshold: 15,
      lightMin: 25, lightMax: 50,
      commonMin: 60, commonMax: 150,
      strongMin: 175, strongMax: 300,
      heavyMin: 350,
      unit: 'µg',
      onset: '15–45 min',
      duration: '8–12 h',
      afterEffects: '6–12 h',
    },
  ],
  Ketamine: [
    {
      roa: 'Insufflated',
      threshold: 5,
      lightMin: 10, lightMax: 30,
      commonMin: 35, commonMax: 60,
      strongMin: 65, strongMax: 100,
      heavyMin: 120,
      unit: 'mg',
      onset: '1–5 min',
      duration: '45–90 min',
      afterEffects: '30–60 min',
    },
    {
      roa: 'Intramuscular',
      threshold: 10,
      lightMin: 20, lightMax: 40,
      commonMin: 50, commonMax: 100,
      strongMin: 110, strongMax: 150,
      heavyMin: 200,
      unit: 'mg',
      onset: '1–5 min',
      duration: '45–90 min',
      afterEffects: '30–60 min',
    },
    {
      roa: 'Oral',
      threshold: 20,
      lightMin: 30, lightMax: 50,
      commonMin: 60, commonMax: 100,
      strongMin: 110, strongMax: 150,
      heavyMin: 200,
      unit: 'mg',
      onset: '15–30 min',
      duration: '1–2 h',
      afterEffects: '1–2 h',
    },
  ],
}

const SUBSTANCES = Object.keys(SUBSTANCE_DOSES)

function getDoseLabel(dose: number, roa: ROADose): string {
  if (dose < roa.threshold) return 'Sub-threshold'
  if (dose >= roa.threshold && dose < roa.lightMin) return 'Threshold'
  if (dose <= roa.lightMax) return 'Light'
  if (dose <= roa.commonMax) return 'Common'
  if (dose <= roa.strongMax) return 'Strong'
  return 'Heavy'
}

const DOSE_COLORS: Record<string, string> = {
  'Sub-threshold': 'text-zinc-500',
  'Threshold': 'text-zinc-400',
  'Light': 'text-green-400',
  'Common': 'text-cyan-400',
  'Strong': 'text-amber-400',
  'Heavy': 'text-red-400',
}

const DOSE_BG: Record<string, string> = {
  'Sub-threshold': 'bg-zinc-800',
  'Threshold': 'bg-zinc-700',
  'Light': 'bg-green-500',
  'Common': 'bg-cyan-500',
  'Strong': 'bg-amber-500',
  'Heavy': 'bg-red-500',
}

export function DosageCalculator() {
  const [substance, setSubstance] = useState('MDMA')
  const [roaIndex, setRoaIndex] = useState(0)
  const [dose, setDose] = useState(80)
  const [tolerance, setTolerance] = useState(0)
  const [bodyWeight, setBodyWeight] = useState(70)

  const roas = SUBSTANCE_DOSES[substance] ?? []
  const currentRoa = roas[roaIndex] ?? roas[0]
  const maxDose = currentRoa.heavyMin * 2

  const adjustedDose = useMemo(() => {
    let d = dose
    if (tolerance > 0) d += d * (tolerance * 0.05)
    return Math.round(d)
  }, [dose, tolerance])

  const doseLabel = getDoseLabel(adjustedDose, currentRoa)
  const dosePct = currentRoa
    ? Math.min(100, (adjustedDose / (currentRoa.heavyMin * 1.5)) * 100)
    : 0

  const isRisky = doseLabel === 'Heavy' || (doseLabel === 'Strong' && tolerance > 3)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Substance</label>
          <select
            value={substance}
            onChange={(e) => { setSubstance(e.target.value); setRoaIndex(0); setDose(80) }}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            {SUBSTANCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Route</label>
          <select
            value={roaIndex}
            onChange={(e) => { setRoaIndex(Number(e.target.value)); setDose(80) }}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            {roas.map((r, i) => (
              <option key={r.roa} value={i}>{r.roa}</option>
            ))}
          </select>
        </div>
      </div>

      {currentRoa && (
        <>
          <Card className="p-4 bg-zinc-900/50 border-zinc-800 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-zinc-400">Dose</label>
                <span className={cn('text-sm font-semibold tabular-nums', DOSE_COLORS[doseLabel])}>
                  {adjustedDose} {currentRoa.unit}
                </span>
              </div>
              <Slider
                value={[dose]}
                onValueChange={(v) => { const val = Array.isArray(v) ? v[0] : v; setDose(val) }}
                min={currentRoa.threshold * 0.5}
                max={maxDose}
                step={currentRoa.unit === 'µg' ? 5 : 1}
                className="w-full"
              />
              <div className="mt-1.5 flex justify-between text-[10px] text-zinc-600">
                <span>{Math.round(currentRoa.threshold * 0.5)}{currentRoa.unit}</span>
                <span>{maxDose}{currentRoa.unit}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                  <Weight className="h-3 w-3" />
                  Tolerance
                </label>
                <span className="text-xs text-zinc-500 tabular-nums">{tolerance}/10</span>
              </div>
              <Slider
                value={[tolerance]}
                onValueChange={(v) => { const val = Array.isArray(v) ? v[0] : v; setTolerance(val) }}
                min={0}
                max={10}
                step={1}
              />
            </div>

            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full transition-colors', DOSE_BG[doseLabel])}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, dosePct)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="text-center p-2 rounded-lg bg-zinc-800/50">
                <div className={cn('text-sm font-semibold', DOSE_COLORS[doseLabel])}>{doseLabel}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Level</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-zinc-800/50">
                <div className="text-sm font-semibold text-zinc-200">{adjustedDose}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{currentRoa.unit}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-zinc-800/50">
                <div className="text-xs font-semibold text-zinc-300">{currentRoa.onset}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Onset</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-zinc-800/50">
                <div className="text-xs font-semibold text-zinc-300">{currentRoa.duration}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Duration</div>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-1.5">
            {(['Light', 'Common', 'Strong', 'Heavy'] as const).map((level) => {
              let min: number, max: number
              switch (level) {
                case 'Light': min = currentRoa.lightMin; max = currentRoa.lightMax; break
                case 'Common': min = currentRoa.commonMin; max = currentRoa.commonMax; break
                case 'Strong': min = currentRoa.strongMin; max = currentRoa.strongMax; break
                case 'Heavy': min = currentRoa.heavyMin; max = maxDose; break
              }
              return (
                <button
                  key={level}
                  onClick={() => setDose(Math.round((min + max) / 2))}
                  className={cn(
                    'text-[10px] px-2 py-1 rounded-full border transition-colors',
                    doseLabel === level
                      ? `${DOSE_BG[level]}/20 border-${DOSE_BG[level].replace('bg-', '')}/30 ${DOSE_COLORS[level]}`
                      : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                  )}
                >
                  {level} {min}–{max}{currentRoa.unit}
                </button>
              )
            })}
          </div>

          <AnimatePresence>
            {isRisky && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert variant="destructive" className="border-red-500/30 bg-red-950/20">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200/80 text-xs">
                    {adjustedDose >= currentRoa.heavyMin
                      ? 'This dose is in the heavy range. High risk of negative physical and psychological effects. Ensure a safe environment and a sitter.'
                      : 'Tolerance-adjusted dose enters strong/heavy territory. Higher risk with elevated tolerance.'}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
