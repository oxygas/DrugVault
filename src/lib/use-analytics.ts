'use client'

import { useCallback } from 'react'

type EventType = 'query' | 'substance' | 'page' | 'feedback' | 'visit'

function getBrowserData() {
  if (typeof window === 'undefined') return {}
  return {
    screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    language: navigator.language || '',
    platform: (navigator as any).platform || '',
  }
}

function send(type: EventType, value: string, extra?: Record<string, unknown>) {
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, value, ...getBrowserData(), ...extra }),
    keepalive: true,
  }).catch(() => {})
}

let pageTracked = false

export function useAnalytics() {
  const trackVisit = useCallback((path?: string) => {
    send('visit', path || window.location.pathname)
  }, [])

  const trackQuery = useCallback((q: string) => send('query', q), [])
  const trackSubstance = useCallback((slug: string) => send('substance', slug), [])
  const trackPage = useCallback((path: string) => send('page', path), [])

  const trackFeedback = useCallback((q: string, positive: boolean) => {
    send('feedback', q, { positive })
  }, [])

  const trackPageOnce = useCallback((path: string) => {
    if (pageTracked) return
    pageTracked = true
    send('visit', path)
  }, [])

  return { trackVisit, trackQuery, trackSubstance, trackPage, trackPageOnce, trackFeedback }
}
