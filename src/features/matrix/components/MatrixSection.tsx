'use client'

import { memo } from 'react'
import type { Substance, ComboLevel } from '@/lib/types'
import ComboMatrix from './ComboMatrix'

interface MatrixSectionProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  onSelectSubstance?: (substance: Substance) => void
  isMobile?: boolean
}

function MatrixSectionInner({ substances, comboRules, onSelectSubstance, isMobile }: MatrixSectionProps) {
  return (
    <div className="space-y-6">
      <ComboMatrix
        substances={substances}
        comboRules={comboRules}
        onSelectSubstance={onSelectSubstance}
        isMobile={isMobile}
      />
    </div>
  )
}

export default memo(MatrixSectionInner)