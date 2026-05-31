'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useAnalytics } from '@/lib/use-analytics'

export function AnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { trackPageOnce } = useAnalytics()
  const tracked = useRef(false)

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '')
    if (!tracked.current) {
      tracked.current = true
      trackPageOnce(url)
    }
  }, [pathname, searchParams, trackPageOnce])

  return null
}
