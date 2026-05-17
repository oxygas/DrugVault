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
    <div className="w-full space-y-6">
      <div className="aero-top" />

      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex gap-1 p-1 rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)]">
          <button
            onClick={() => setActiveTool('checker')}
            className={`px-6 py-3 rounded-xl text-sm font-display font-semibold transition-all duration-300 ${
              activeTool === 'checker'
                ? 'bg-[rgba(168,85,247,0.12)] text-[var(--accent2)] shadow-[0_0_20px_rgba(168,85,247,0.06)]'
                : 'text-[var(--text4)] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Interaction Checker
            </span>
          </button>
          <button
            onClick={() => setActiveTool('dxm')}
            className={`px-6 py-3 rounded-xl text-sm font-display font-semibold transition-all duration-300 ${
              activeTool === 'dxm'
                ? 'bg-blue-500/12 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.06)]'
                : 'text-[var(--text4)] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
              DXM Calculator
            </span>
          </button>
        </div>
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
