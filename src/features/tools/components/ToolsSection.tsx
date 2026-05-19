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

const TOOLS: { key: ToolTab; label: string; desc: string; color: string; icon: string }[] = [
  {
    key: 'checker',
    label: 'Interaction Checker',
    desc: 'Check pairwise interactions between substances',
    color: 'var(--accent)',
    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    key: 'dxm',
    label: 'DXM Calculator',
    desc: 'Calculate DXM plateau based on weight and dosage',
    color: '#3b82f6',
    icon: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5',
  },
]

function ToolsSectionInner({ substances, comboRules, substanceCombos }: ToolsSectionProps) {
  const [activeTool, setActiveTool] = useState<ToolTab>('checker')

  return (
    <div className="-mx-8 sm:-mx-10 lg:-mx-12 space-y-10 sm:space-y-14">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {TOOLS.map(t => {
          const active = activeTool === t.key
          const col = t.color.startsWith('var') ? t.color : t.color
          return (
            <button
              key={t.key}
              onClick={() => setActiveTool(t.key)}
              className="relative w-full text-left rounded-2xl border-2 transition-all duration-300 group"
              style={{
                borderColor: active ? col : 'var(--border)',
                background: active
                  ? `linear-gradient(135deg, color-mix(in srgb, ${col} 8%, transparent), transparent 70%)`
                  : 'rgba(8,8,24,0.3)',
              }}
            >
              {active && (
                <div
                  className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, ${col}, ${col}66, transparent)` }}
                />
              )}
              <div className="px-8 py-8 sm:px-10 sm:py-10 flex items-center gap-6 sm:gap-8">
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={{
                    background: active ? `color-mix(in srgb, ${col} 12%, transparent)` : 'rgba(255,255,255,0.02)',
                    border: `2px solid ${active ? `color-mix(in srgb, ${col} 25%, transparent)` : 'var(--border2)'}`,
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
                    <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-xl sm:text-2xl lg:text-3xl font-display font-bold truncate transition-colors duration-300"
                    style={{ color: active ? col : 'var(--text2)' }}
                  >
                    {t.label}
                  </div>
                  <div className="text-base sm:text-lg text-[var(--text4)] mt-2 leading-relaxed">{t.desc}</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
        {activeTool === 'checker' && (
          <DrugChecker substances={substances} comboRules={comboRules} substanceCombos={substanceCombos} />
        )}
        {activeTool === 'dxm' && <DXMCalculator />}
      </div>
    </div>
  )
}

export default memo(ToolsSectionInner)
