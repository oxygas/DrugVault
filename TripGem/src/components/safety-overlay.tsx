'use client'

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'
import { useUIStore } from '@/stores/ui'
import { motion, AnimatePresence } from 'framer-motion'

const DISCLAIMERS: Record<string, { title: string; body: string }> = {
  default: {
    title: 'Read Before Using This Site',
    body: 'TripGem provides educational information only. We are not medical professionals. Substance use carries legal, health, and safety risks. Nothing here constitutes medical advice. Verify all information independently. If you are in crisis, contact emergency services immediately.',
  },
  combos: {
    title: 'Combination Risk Warning',
    body: 'Mixing substances is extremely dangerous and can be fatal. The combination checker provides educational reference only, based on user reports and available research. Actual effects vary by dose, tolerance, purity, and individual physiology. Never combine unfamiliar substances without professional medical guidance.',
  },
  dosage: {
    title: 'Dosage Calculator Warning',
    body: 'All dosage information is for educational reference only. Actual potency varies significantly between batches, routes of administration, and individual tolerances. Always start with the lowest possible dose. The tolerance estimator is an approximation and should not be used as a precise dosing tool.',
  },
}

export function SafetyOverlay({ id = 'default' }: { id?: string }) {
  const dismissed = useUIStore((s) => s.safetyOverlayDismissed[id])
  const dismiss = useUIStore((s) => s.dismissSafetyOverlay)

  if (dismissed) return null

  const info = DISCLAIMERS[id] ?? DISCLAIMERS.default

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="mb-4"
      >
        <Alert variant="destructive" className="border-red-500/30 bg-red-950/20 relative">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <AlertTitle className="text-red-300 text-sm font-semibold">
            {info.title}
          </AlertTitle>
          <AlertDescription className="text-red-200/80 text-xs leading-relaxed mt-1 max-w-prose">
            {info.body}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 text-red-400/60 hover:text-red-300"
            onClick={() => dismiss(id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Alert>
      </motion.div>
    </AnimatePresence>
  )
}
