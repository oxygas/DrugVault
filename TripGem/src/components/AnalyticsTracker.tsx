'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useAnalytics } from '@/lib/use-analytics'

export function AnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { trackPageOnce } = useAnalytics()
  const tracked = useRef(false)
  const maxScrollRef = useRef(0)
  const startTimeRef = useRef(0)
  const pathRef = useRef(pathname)

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '')

    if (!tracked.current) {
      tracked.current = true
      startTimeRef.current = Date.now()
      pathRef.current = pathname
      maxScrollRef.current = 0
      trackPageOnce(url)
    }

    const handleScroll = () => {
      const scrollPct = Math.min(
        100,
        Math.round(
          (window.scrollY + window.innerHeight) /
            Math.max(document.documentElement.scrollHeight, 1) *
            100
        )
      )
      if (scrollPct > maxScrollRef.current) {
        maxScrollRef.current = scrollPct
      }
    }

    const throttledScroll = () => requestAnimationFrame(handleScroll)

    window.addEventListener('scroll', throttledScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', throttledScroll)
    }
  }, [pathname, searchParams, trackPageOnce])

  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeOnPage = Math.round((Date.now() - startTimeRef.current) / 1000)
      if (timeOnPage < 2) return

      const payload = JSON.stringify({
        type: 'page',
        value: pathRef.current,
        scrollDepth: String(maxScrollRef.current),
        timeOnPage: String(timeOnPage),
        sessionId:
          typeof window !== 'undefined'
            ? (window as any).__tripgemSessionId || ''
            : '',
        keepalive: true,
      })

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        try {
          const blob = new Blob([payload], { type: 'application/json' })
          navigator.sendBeacon('/api/analytics/event', blob)
        } catch (e) {
          // Ignore beacon throws
        }
        return
      }

      try {
        fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      } catch (e) {
        // Ignore synchronous fetch throws from adblockers
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return null
}
