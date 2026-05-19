'use client'

import { memo, useState } from 'react'
import type { Substance, ComboLevel } from '@/lib/types'
import DrugChecker from './DrugChecker'
import DXMCalculator from './DXMCalculator'

interface ToolsSectionProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  substanceCombos?: { substanceA: string; substanceB: string; level: ComboLevel; note?: string | null }[]
  onFindSubstance?: (name: string) => Substance | undefined
}

type ToolTab = 'checker' | 'dxm'

const TOOLS = [
  {
    key: 'checker' as ToolTab,
    label: 'Interaction Checker',
    desc: 'Check pairwise interactions between substances',
    color: '--accent',
    svg: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    key: 'dxm' as ToolTab,
    label: 'DXM Calculator',
    desc: 'Calculate DXM plateau based on weight and dosage',
    color: '#3b82f6',
    svg: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5',
  },
]

function ToolsSectionInner({ substances, comboRules, substanceCombos }: ToolsSectionProps) {
  const [activeTool, setActiveTool] = useState<ToolTab>('checker')

  return (
    <div className="w-full space-y-12">
      {/* Tool Tabs */}
      <div className="flex gap-5 sm:gap-8 w-full">
        {TOOLS.map(t => {
          const active = activeTool === t.key
          const col = `var(${t.color})`.includes('--') ? `var(${t.color})` : t.color
          return (
            <button
              key={t.key}
              onClick={() => setActiveTool(t.key)}
              className="flex-1 relative overflow-hidden rounded-2xl border transition-all duration-300 text-left"
              style={{
                borderColor: active ? `${col}` : 'var(--border)',
                background: active
                  ? `linear-gradient(135deg, ${col}12, transparent 80%)`
                  : 'transparent',
              }}
            >
              {active && (
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: `linear-gradient(90deg, ${col}, ${col}44, transparent)` }}
                />
              )}
              <div className="p-8 sm:p-10">
                <div className="flex items-center gap-6">
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all duration-300"
                    style={{
                      background: active ? `${col}15` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? `${col}25` : 'var(--border2)'}`,
                    }}
                  >
                    <svg
                      className={`w-8 h-8 sm:w-10 sm:h-10 transition-all duration-300 ${active ? '' : 'text-[var(--text4)]'}`}
                      style={{ color: active ? col : undefined }}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={t.svg} />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div
                      className="text-xl sm:text-2xl font-display font-semibold truncate transition-colors duration-300"
                      style={{ color: active ? col : 'var(--text2)' }}
                    >
                      {t.label}
                    </div>
                    <div className="text-base sm:text-lg text-[var(--text4)] truncate mt-1">{t.desc}</div>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
        {activeTool === 'checker' && (
          <DrugChecker substances={substances} comboRules={comboRules} substanceCombos={substanceCombos} />
        )}
        {activeTool === 'dxm' && (
          <DXMCalculator />
        )}
      </div>
    </div>
  )
}

export default memo(ToolsSectionInner)
