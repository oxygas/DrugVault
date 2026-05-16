'use client'

import { memo, useMemo } from 'react'
import type { Substance, Category, ComboLevel } from '@/lib/types'
import SearchBar from '@/components/SearchBar'
import SubstanceGrid from './SubstanceGrid'

interface SubstancesSectionProps {
  substances: Substance[]
  selectedCategories: Category[]
  onCategoryToggle: (cat: Category) => void
  onCategoryClear: () => void
  onSubstanceClick: (substance: Substance) => void
}

function SubstancesSectionInner({
  substances,
  selectedCategories,
  onCategoryToggle,
  onCategoryClear,
  onSubstanceClick,
}: SubstancesSectionProps) {
  const filtered = useMemo(() => {
    if (selectedCategories.length === 0) return substances
    return substances.filter(s => selectedCategories.includes(s.category))
  }, [substances, selectedCategories])

  return (
    <div className="space-y-6">
      <SearchBar
        substances={substances}
        onSelect={onSubstanceClick}
        selectedCategories={selectedCategories}
        onCategoryToggle={onCategoryToggle}
        onCategoryClear={onCategoryClear}
      />
      <div className="flex items-center justify-center">
        <span className="text-xs lg:text-sm text-[var(--text3)] font-mono">
          {selectedCategories.length > 0
            ? `${filtered.length} in ${selectedCategories.join(', ')}`
            : `${substances.length} substances`}
        </span>
      </div>
      <SubstanceGrid
        substances={filtered}
        selectedCategories={selectedCategories}
        onSubstanceClick={onSubstanceClick}
      />
    </div>
  )
}

export default memo(SubstancesSectionInner)
