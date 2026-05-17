'use client'

import { memo, useState } from 'react'
import type { Substance, ComboLevel } from '@/lib/types'
import DrugChecker from './DrugChecker'
import DXMCalculator from './DXMCalculator'

interface ToolsSectionProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  substanceCombos?: { substanceA: string; substanceB: string; level: ComboLevel; note?: string | null }[]
}

type ToolTab = 'checker' | 'dxm'

function ToolsSectionInner({ substances, comboRules, substanceCombos }: ToolsSectionProps) {
  const [activeTool, setActiveTool] = useState<ToolTab>('checker')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex gap-1.5 glass rounded-xl p-1 border border-[var(--border)]">
        <button
          onClick={() => setActiveTool('checker')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-display font-semibold transition-all ${
            activeTool === 'checker'
              ? 'bg-[rgba(168,85,247,0.12)] text-[var(--accent)] shadow-sm'
              : 'text-[var(--text4)] hover:text-white'
          }`}
        >
          Interaction Checker
        </button>
        <button
          onClick={() => setActiveTool('dxm')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-display font-semibold transition-all ${
            activeTool === 'dxm'
              ? 'bg-blue-500/12 text-blue-400 shadow-sm'
              : 'text-[var(--text4)] hover:text-white'
          }`}
        >
          DXM Calculator
        </button>
      </div>

      {activeTool === 'checker' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out both' }}>
          <DrugChecker substances={substances} comboRules={comboRules} substanceCombos={substanceCombos} />
        </div>
      )}

      {activeTool === 'dxm' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out both' }}>
          <DXMCalculator />
        </div>
      )}
    </div>
  )
}

export default memo(ToolsSectionInner)
