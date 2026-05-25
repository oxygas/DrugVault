'use client'

import { memo, useMemo } from 'react'
import type { Substance, Category } from '@/lib/types'
import SearchBar from '@/components/SearchBar'
import SubstanceGrid from './SubstanceGrid'

interface SubstancesSectionProps {
  substances: Substance[]
  selectedCategories: Category[]
  onCategoryToggle: (cat: Category) => void
  onCategoryClear: () => void
  onSubstanceClick: (substance: Substance) => void
  searchInputRef?: React.RefObject<HTMLInputElement | null>
}

function SubstancesSectionInner({
  substances,
  selectedCategories,
  onCategoryToggle,
  onCategoryClear,
  onSubstanceClick,
  searchInputRef,
}: SubstancesSectionProps) {
  const filtered = useMemo(() => {
    if (selectedCategories.length === 0) return substances
    return substances.filter(s => selectedCategories.includes(s.category))
  }, [substances, selectedCategories])

  return (
    <section className="space-y-6">
      <SearchBar
        substances={substances}
        onSelect={onSubstanceClick}
        selectedCategories={selectedCategories}
        onCategoryToggle={onCategoryToggle}
        onCategoryClear={onCategoryClear}
        externalInputRef={searchInputRef}
      />
      <div className="section-header max-w-2xl mx-auto" aria-live="polite" role="status">
        <span className="bracket">╔══</span>
        <span className="count">
          {selectedCategories.length > 0
            ? `${filtered.length} in ${selectedCategories.join(', ')}`
            : `${substances.length} substances`}
        </span>
        <span className="bracket">══╗</span>
      </div>
      <SubstanceGrid
        substances={filtered}
        onSubstanceClick={onSubstanceClick}
      />
      <div className="vaporwave-scanlines" aria-hidden="true" />
    </section>
  )
}

export default memo(SubstancesSectionInner)
