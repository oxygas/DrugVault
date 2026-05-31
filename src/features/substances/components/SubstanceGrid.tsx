'use client'

import { memo, useSyncExternalStore } from 'react'
import type { Substance } from '@/lib/types'
import SubstanceGridPC from './SubstanceGridPC'
import SubstanceGridMobile from './SubstanceGridMobile'

interface SubstanceGridProps {
  substances: Substance[]
  onSubstanceClick: (substance: Substance) => void
}

function subscribeToMobile(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  const mq = window.matchMedia('(max-width: 639px)')
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getIsMobile() {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 640
}

function SubstanceGridInner(props: SubstanceGridProps) {
  const isMobile = useSyncExternalStore(subscribeToMobile, getIsMobile, () => false)

  return isMobile ? <SubstanceGridMobile {...props} /> : <SubstanceGridPC {...props} />
}

export default memo(SubstanceGridInner)
