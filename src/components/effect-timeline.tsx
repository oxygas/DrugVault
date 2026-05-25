'use client'

import { motion } from 'framer-motion'
import { Clock, Sunrise, Zap, Sunset, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Phase {
  label: string
  time: string
  description: string
  intensity: number
  color: string
}

interface PhaseWithIcon extends Phase {
  iconIndex: number
}

interface TimelineProps {
  substance: string
  roa?: string
  onset: string
  duration: string
  afterEffects?: string
  className?: string
}

const SUBSTANCE_PHASES: Record<string, { onset: string; phases: Omit<Phase, 'color'>[] }> = {
  MDMA: {
    onset: '30–60 min',
    phases: [
      { label: 'Onset', time: '0–45 min', description: 'Mild euphoria, heightened senses, jaw tension begins.', intensity: 15 },
      { label: 'Come-up', time: '45–75 min', description: 'Rising euphoria, increased empathy, mild nausea possible.', intensity: 45 },
      { label: 'Peak', time: '75–150 min', description: 'Intense euphoria, empathy, tactile enhancement, emotional openness.', intensity: 100 },
      { label: 'Plateau', time: '2.5–4 h', description: 'Sustained positive mood. Music appreciation peaks.', intensity: 65 },
      { label: 'Offset', time: '4–5 h', description: 'Gradual decline. Residual empathy and stimulation.', intensity: 25 },
      { label: 'After-effects', time: '5–12 h', description: 'Mild depression, fatigue, brain fog. Serotonin depletion recovery.', intensity: 10 },
    ],
  },
  LSD: {
    onset: '30–90 min',
    phases: [
      { label: 'Onset', time: '0–60 min', description: 'Visual shimmer, altered thinking, subtle body load.', intensity: 10 },
      { label: 'Come-up', time: '1–2 h', description: 'Intensifying visuals, time distortion, introspective thoughts.', intensity: 40 },
      { label: 'Peak', time: '2–5 h', description: 'Full psychedelic state. Intense visuals, ego dissolution possible.', intensity: 100 },
      { label: 'Plateau', time: '5–8 h', description: 'Sustained psychedelic effects. Decreasing intensity.', intensity: 60 },
      { label: 'Offset', time: '8–10 h', description: 'Effects fading. Visuals only with eyes closed.', intensity: 20 },
      { label: 'After-effects', time: '10–24 h', description: 'Afterglow or fatigue. Reflective state.', intensity: 5 },
    ],
  },
  Ketamine: {
    onset: '1–5 min',
    phases: [
      { label: 'Onset', time: '0–2 min', description: 'Rapid onset. Dissociation, numbness, dizziness.', intensity: 30 },
      { label: 'Come-up', time: '2–5 min', description: 'Increasing dissociation. Slurred speech, motor impairment.', intensity: 60 },
      { label: 'Peak', time: '5–15 min', description: 'K-hole possible. Profound dissociation, out-of-body experience.', intensity: 100 },
      { label: 'Plateau', time: '15–30 min', description: 'Dissociation persists. Floating sensation.', intensity: 70 },
      { label: 'Offset', time: '30–60 min', description: 'Returning to baseline. Residual confusion.', intensity: 35 },
      { label: 'After-effects', time: '1–2 h', description: 'Mild dissociation, afterglow, slight confusion.', intensity: 10 },
    ],
  },
}

const PHASE_COLORS = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-amber-500', 'bg-blue-500', 'bg-zinc-500']

function PhaseIcon({ i, className }: { i: number; className?: string }) {
  const icons: React.ElementType[] = [Sunrise, Zap, Sunset, Sunset, Moon, Clock]
  const Icon = icons[i] || Clock
  return <Icon className={className} />
}

export function EffectTimeline({ substance, roa, onset, duration, afterEffects, className }: TimelineProps) {
  const data = SUBSTANCE_PHASES[substance]
  if (!data) return null

  const phases = data.phases.map((p, i) => ({
    ...p,
    color: PHASE_COLORS[i],
    iconIndex: i,
  }))

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Clock className="h-3 w-3" />
        <span>Onset: {data.onset}</span>
        {duration && <><span className="text-zinc-700">·</span><span>Duration: {duration}</span></>}
        {afterEffects && <><span className="text-zinc-700">·</span><span>After: {afterEffects}</span></>}
      </div>

      <div className="relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-zinc-800 rounded-full" />

        <div className="space-y-1">
          {phases.map((phase, i) => (
            <motion.div
              key={phase.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className="relative flex gap-3 pl-7"
            >
              <div
                className={cn(
                  'absolute left-[6px] top-[6px] h-3 w-3 rounded-full ring-2 ring-zinc-900 flex items-center justify-center p-0.5',
                  phase.color
                )}
              >
                <PhaseIcon i={(phase as PhaseWithIcon).iconIndex} className="h-full w-full text-white" />
              </div>

              <div className="flex-1 pb-2 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-200">{phase.label}</span>
                  <span className="text-[10px] text-zinc-600">{phase.time}</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                  {phase.description}
                </p>
                <div className="mt-1 h-1 rounded-full bg-zinc-800 overflow-hidden w-full max-w-[200px]">
                  <motion.div
                    className={cn('h-full rounded-full', phase.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${phase.intensity}%` }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
