'use client'

import { useSyncExternalStore } from 'react'
import type { Substance, ComboLevel } from '@/lib/types'
import ComboMatrixPC from './ComboMatrixPC'
import ComboMatrixPhone from './ComboMatrixPhone'

interface ComboMatrixProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  onSelectSubstance?: (substance: Substance) => void
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  const mql = window.matchMedia('(min-width: 640px)')
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(min-width: 640px)').matches
}

function getServerSnapshot() {
  return true // Default to PC view on server/SSG build
}

export default function ComboMatrix({ substances, comboRules, onSelectSubstance }: ComboMatrixProps) {
  const isDesktop = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (isDesktop) {
    return <ComboMatrixPC substances={substances} comboRules={comboRules} onSelectSubstance={onSelectSubstance} />
  }

  return <ComboMatrixPhone substances={substances} comboRules={comboRules} onSelectSubstance={onSelectSubstance} />
}
