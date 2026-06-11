'use client'

import { memo, forwardRef, useCallback } from 'react'
import { VirtuosoGrid } from 'react-virtuoso'
import type { Substance } from '@/lib/types'
import SubstanceCard from './SubstanceCard'

interface SubstanceGridProps {
  substances: Substance[]
  onSubstanceClick: (substance: Substance) => void
}

interface GridContext {
  substances: Substance[]
  onSubstanceClick: (substance: Substance) => void
}

const List = forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  ({ style, children, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      style={{
        ...style,
      }}
    >
      {children}
    </div>
  )
)
List.displayName = 'VirtuosoGridList'

const Item = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => (
  <div
    {...props}
    className="w-full flex justify-center"
  >
    {children}
  </div>
)
Item.displayName = 'VirtuosoGridItem'

function SubstanceGridInner({ substances, onSubstanceClick }: SubstanceGridProps) {
  const itemContent = useCallback(
    (index: number, _: unknown, context: GridContext) => (
      <SubstanceCard
        substance={context.substances[index]}
        onClick={context.onSubstanceClick}
      />
    ),
    []
  )

  if (substances.length === 0) {
    return (
      <div className="text-center py-16 sm:py-24">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--text4)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <p className="text-[var(--text3)] text-sm">No substances found</p>
        <p className="text-[var(--text4)] text-xs mt-1">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <VirtuosoGrid
      useWindowScroll
      totalCount={substances.length}
      components={{ List, Item }}
      overscan={400}
      context={{ substances, onSubstanceClick }}
      itemContent={itemContent}
    />
  )
}

export default memo(SubstanceGridInner)

