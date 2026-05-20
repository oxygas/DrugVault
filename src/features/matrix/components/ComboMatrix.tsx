'use client'

import { useState, useMemo } from 'react'
import type { Substance, ComboLevel } from '@/lib/types'
import { CATEGORY_COLORS, COMBO_LEVEL_COLORS, COMBO_LEVEL_LABELS, COMBO_DESCRIPTIONS } from '@/lib/types'

interface ComboMatrixProps {
  substances: Substance[]
  comboRules: Record<string, ComboLevel>
  onSelectSubstance?: (substance: Substance) => void
}

export default function ComboMatrix({ substances, comboRules, onSelectSubstance }: ComboMatrixProps) {
  const categories = useMemo(
    () => [...new Set(substances.map(s => s.category))].sort(),
    [substances]
  )

  const getLevel = (a: string, b: string): ComboLevel => {
    if (a === b) return 'low_risk'
    return comboRules[`${a}+${b}`] || comboRules[`${b}+${a}`] || 'caution'
  }

  return (
    <div className="text-center py-8">
      <p className="text-[var(--text3)]">Drug Matrix Component</p>
      <p className="text-[var(--text4)] text-xs">Categories: {categories.length}</p>
    </div>
  )
}