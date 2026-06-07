'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, Shield, Skull, HelpCircle, ChevronRight, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ComboLevel = 'safe' | 'low_risk' | 'caution' | 'unsafe' | 'dangerous' | 'deadly'

interface ComboResult {
  level: ComboLevel
  note: string
  category?: string
}

const LEVEL_META: Record<ComboLevel, {
  label: string
  color: string
  bg: string
  border: string
  icon: React.ReactNode
}> = {
  safe: {
    label: 'Safe',
    color: 'text-green-400',
    bg: 'bg-green-950/30',
    border: 'border-green-500/30',
    icon: <Shield className="h-4 w-4 text-green-400" />,
  },
  low_risk: {
    label: 'Low Risk',
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/30',
    border: 'border-cyan-500/30',
    icon: <Shield className="h-4 w-4 text-cyan-400" />,
  },
  caution: {
    label: 'Caution',
    color: 'text-amber-400',
    bg: 'bg-amber-950/30',
    border: 'border-amber-500/30',
    icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  },
  unsafe: {
    label: 'Unsafe',
    color: 'text-orange-400',
    bg: 'bg-orange-950/30',
    border: 'border-orange-500/30',
    icon: <AlertTriangle className="h-4 w-4 text-orange-400" />,
  },
  dangerous: {
    label: 'Dangerous',
    color: 'text-red-400',
    bg: 'bg-red-950/30',
    border: 'border-red-500/30',
    icon: <Skull className="h-4 w-4 text-red-400" />,
  },
  deadly: {
    label: 'EXTREMELY DANGEROUS',
    color: 'text-red-300',
    bg: 'bg-red-950/50',
    border: 'border-red-500/60',
    icon: <Skull className="h-4 w-4 text-red-300 animate-pulse" />,
  },
}

const MOCK_COMBOS: Record<string, Record<string, ComboResult>> = {
  MDMA: {
    LSD: { level: 'caution', note: 'Risk of excessive physical stimulation and cognitive strain. Can be profound but potentially overwhelming.' },
    Cannabis: { level: 'safe', note: 'Commonly combined to enhance the experience and reduce nausea during come-up.' },
    Alcohol: { level: 'dangerous', note: 'Significantly increases dehydration, overheating, and cardiovascular strain.' },
    Ketamine: { level: 'caution', note: 'Can cause dissociation that may become confusing or frightening, especially at higher doses.' },
    Cocaine: { level: 'dangerous', note: 'Cardiotoxic combination. Severe strain on the heart. Risk of serotonin syndrome.' },
    Amphetamine: { level: 'dangerous', note: 'Extreme cardiovascular strain. High risk of dehydration and hyperthermia.' },
    Caffeine: { level: 'caution', note: 'Increases cardiovascular side effects and jaw tension.' },
    DMT: { level: 'safe', note: 'Short duration interaction. MDMA reduces DMT anxiety, DMT adds depth.' },
  },
  LSD: {
    MDMA: { level: 'caution', note: 'Risk of excessive physical stimulation and cognitive strain. Can be profound but potentially overwhelming.' },
    Cannabis: { level: 'caution', note: 'Greatly potentiates the psychedelic experience. Can lead to extreme anxiety or panic in unprepared users.' },
    Alcohol: { level: 'low_risk', note: 'Alcohol dulls the LSD experience. May reduce anxiety at low doses.' },
    Ketamine: { level: 'caution', note: 'Can produce profound dissociative/psychedelic states. May be disorienting.' },
    Cocaine: { level: 'dangerous', note: 'Cardiovascular strain. Anxiogenic combination with risk of panic attacks.' },
    Amphetamine: { level: 'unsafe', note: 'Excessive stimulation. Risk of thought loops, anxiety, and cardiovascular issues.' },
    Caffeine: { level: 'low_risk', note: 'Mild stimulation increase. Watch for anxiety at higher doses.' },
    DMT: { level: 'safe', note: 'LSD is a long-lasting base; DMT can be used for a peak intensity spike.' },
  },
  Ketamine: {
    MDMA: { level: 'caution', note: 'Can cause dissociation that may become confusing or frightening.' },
    LSD: { level: 'caution', note: 'Can produce profound dissociative/psychedelic states. May be disorienting.' },
    Alcohol: { level: 'dangerous', note: 'Respiratory depression risk. Impaired coordination and judgment.' },
    Cannabis: { level: 'low_risk', note: 'Commonly combined. May increase dissociation and nausea.' },
    Cocaine: { level: 'unsafe', note: 'Opposing mechanisms create unpredictable cardiovascular strain.' },
    Amphetamine: { level: 'unsafe', note: 'Stimulant + dissociative can cause extreme confusion and cardiovascular issues.' },
    Caffeine: { level: 'low_risk', note: 'Mild interaction. Caffeine may reduce sedative effects.' },
    DMT: { level: 'safe', note: 'Can produce unique dissociative-psychedelic states. Generally well-tolerated.' },
    Opioids: { level: 'dangerous', note: 'Significant respiratory depression risk. Potentially fatal.' },
    Benzodiazepines: { level: 'low_risk', note: 'Benzos reduce dissociation and may be used as a trip-killer. No physiological danger.' },
  },
}

const ALL_SUBSTANCES = [
  'MDMA', 'LSD', 'Ketamine', 'Cannabis', 'Alcohol', 'Cocaine',
  'Amphetamine', 'Caffeine', 'DMT', 'Opioids', 'Benzodiazepines',
  'Psilocybin', 'Mescaline', '2C-B', 'Nitrous Oxide',
]

const LEVEL_ORDER: ComboLevel[] = ['safe', 'low_risk', 'caution', 'unsafe', 'dangerous', 'deadly']

export function ComboChecker() {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [filter, setFilter] = useState<ComboLevel | 'all'>('all')

  const result = useMemo<ComboResult | null>(() => {
    if (!a || !b) return null
    const combo = MOCK_COMBOS[a]?.[b] ?? MOCK_COMBOS[b]?.[a]
    return combo ?? { level: 'caution', note: 'No specific interaction data available. Exercise caution.', category: 'unknown' }
  }, [a, b])

  const safeSubstancesForA = useMemo(() => {
    if (!a) return []
    const combos = MOCK_COMBOS[a] ?? {}
    return Object.entries(combos)
      .filter(([, v]) => LEVEL_ORDER.indexOf(v.level) <= LEVEL_ORDER.indexOf('low_risk'))
      .map(([k]) => k)
  }, [a])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Substance A</label>
          <div className="relative">
            <select
              value={a}
              onChange={(e) => setA(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="">Select substance...</option>
              {ALL_SUBSTANCES.filter((s) => s !== b).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 rotate-90 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Substance B</label>
          <div className="relative">
            <select
              value={b}
              onChange={(e) => setB(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="">Select substance...</option>
              {ALL_SUBSTANCES.filter((s) => s !== a).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {result && a && b && (
          <motion.div
            key={`${a}-${b}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className={cn('p-4', LEVEL_META[result.level].bg, LEVEL_META[result.level].border)}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{LEVEL_META[result.level].icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn('border-current text-[10px] font-semibold uppercase tracking-wider', LEVEL_META[result.level].color)}
                    >
                      {LEVEL_META[result.level].label}
                    </Badge>
                    <span className="text-sm font-medium text-zinc-200">
                      {a} + {b}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    {result.note}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {a && safeSubstancesForA.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-green-400" />
            Known safe / low-risk combinations with <span className="font-medium text-zinc-300">{a}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {safeSubstancesForA.map((s) => (
              <button
                key={s}
                onClick={() => setB(s)}
                className="text-xs px-2 py-1 rounded-full bg-green-950/30 border border-green-500/20 text-green-300 hover:bg-green-950/50 transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {a && b && result && LEVEL_ORDER.indexOf(result.level) >= LEVEL_ORDER.indexOf('unsafe') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive" className="border-red-500/30 bg-red-950/20">
              <Info className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200/80 text-xs">
                This combination is classified as {result.level}. Consider safer alternatives. Never combine unfamiliar substances in isolation.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-1.5">
        {LEVEL_META && (Object.entries(LEVEL_META) as [ComboLevel, typeof LEVEL_META[ComboLevel]][]).map(([level, meta]) => (
          <button
            key={level}
            onClick={() => setFilter(prev => prev === level ? 'all' : level)}
            className={cn(
              'text-[10px] px-2 py-1 rounded-full border transition-colors',
              filter === level
                ? `${meta.bg} ${meta.border} ${meta.color}`
                : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
            )}
          >
            {meta.label}
          </button>
        ))}
      </div>
    </div>
  )
}
