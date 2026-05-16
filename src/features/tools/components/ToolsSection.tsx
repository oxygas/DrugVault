'use client'

import { memo } from 'react'
import type { Substance, ComboLevel, SubstanceCombo } from '@/lib/types'
import InteractionChecker from './InteractionChecker'
import CompareTool from './CompareTool'

interface ToolsSectionProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  substanceCombos?: SubstanceCombo[]
  onFindSubstance: (name: string) => Substance | undefined
}

function ToolsSectionInner({ substances, comboRules, substanceCombos, onFindSubstance }: ToolsSectionProps) {
  return (
    <div className="space-y-8 max-w-2xl lg:max-w-3xl mx-auto">
      <InteractionChecker substances={substances} comboRules={comboRules} substanceCombos={substanceCombos} />
      <CompareTool substances={substances} />
    </div>
  )
}

export default memo(ToolsSectionInner)
