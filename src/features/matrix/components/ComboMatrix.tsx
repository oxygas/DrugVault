'use client'

import type { Substance, ComboLevel } from '@/lib/types'
import ComboMatrixPC from './ComboMatrixPC'
import ComboMatrixPhone from './ComboMatrixPhone'

interface ComboMatrixProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  onSelectSubstance?: (substance: Substance) => void
  isMobile?: boolean
}

export default function ComboMatrix({ substances, comboRules, onSelectSubstance, isMobile }: ComboMatrixProps) {
  return (
    <>
      <div className="hidden sm:block">
        <ComboMatrixPC substances={substances} comboRules={comboRules} onSelectSubstance={onSelectSubstance} />
      </div>
      <div className="block sm:hidden">
        <ComboMatrixPhone substances={substances} comboRules={comboRules} onSelectSubstance={onSelectSubstance} />
      </div>
    </>
  )
}
