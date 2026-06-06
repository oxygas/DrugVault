'use client'

import { useCallback, useEffect, useRef } from 'react'

type EventType = 'query' | 'substance' | 'page' | 'feedback' | 'visit'

let sessionId = ''
let pageLoadTime = 0
const utmParams: Record<string, string> = {}

if (typeof window !== 'undefined') {
  sessionId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  pageLoadTime = Date.now()
  const sp = new URLSearchParams(window.location.search)
  if (sp.get('utm_source')) utmParams.utm_source = sp.get('utm_source')!
  if (sp.get('utm_medium')) utmParams.utm_medium = sp.get('utm_medium')!
  if (sp.get('utm_campaign')) utmParams.utm_campaign = sp.get('utm_campaign')!
  if (sp.get('utm_content')) utmParams.utm_content = sp.get('utm_content')!
  if (sp.get('utm_term')) utmParams.utm_term = sp.get('utm_term')!
}

function getBrowserData() {
  if (typeof window === 'undefined') return {}
  return {
    screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    language: navigator.language || '',
    platform: (navigator as any).platform || '',
  }
}

function getConnectionInfo() {
  if (typeof window === 'undefined') return {}
  const conn = (navigator as any).connection
  if (!conn) return {}
  return {
    connType: conn.effectiveType || '',
    connRtt: String(conn.rtt || ''),
    connDownlink: String(conn.downlink || ''),
  }
}

function getHardwareInfo() {
  if (typeof window === 'undefined') return {}
  return {
    deviceMemory: String((navigator as any).deviceMemory || ''),
    hardwareConcurrency: String(navigator.hardwareConcurrency || ''),
  }
}

let canvasFingerprint = ''
let audioFingerprint = ''
let webglVendor = ''
let fingerprintDone = false

async function computeFingerprint() {
  if (fingerprintDone) return { canvasFingerprint, audioFingerprint, webglVendor }

  try {
    const c = document.createElement('canvas')
    c.width = 200
    c.height = 50
    const ctx = c.getContext('2d')!
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(100, 0, 100, 50)
    ctx.fillStyle = '#069'
    ctx.fillText('TripGem🖌️', 2, 15)
    canvasFingerprint = c.toDataURL().slice(0, 200)
  } catch { /* skip */ }

  try {
    const gl = document.createElement('canvas').getContext('webgl')
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      if (ext) {
        webglVendor = (gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || '') + '|' +
          (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '')
        webglVendor = webglVendor.slice(0, 100)
      }
    }
  } catch { /* skip */ }

  try {
    const actx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = actx.createOscillator()
    const dst = actx.createDynamicsCompressor()
    osc.type = 'sawtooth'
    osc.connect(dst)
    dst.connect(actx.destination)
    osc.start(0)
    osc.stop(0.001)
    audioFingerprint = `audio:${actx.sampleRate}`
    actx.close()
  } catch { /* skip */ }

  fingerprintDone = true
  return { canvasFingerprint, audioFingerprint, webglVendor }
}

function send(type: EventType, value: string, extra?: Record<string, unknown>) {
  try {
    const payload = JSON.stringify({
      type,
      value,
      ...getBrowserData(),
      ...getConnectionInfo(),
      ...getHardwareInfo(),
      sessionId,
      ...utmParams,
      referrer: typeof document !== 'undefined' ? (document.referrer || '') : '',
      ...extra,
    });

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/event', blob);
      } catch (e) {
        // Ignore beacon throws
      }
      return;
    }

    try {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    } catch (e) {
      // Ignore synchronous fetch throws from adblockers
    }
  } catch (err) {
    // Ignore any global analytics serialization throws
  }
}

let pageTracked = false

export function useAnalytics() {
  const trackVisit = useCallback((path?: string) => {
    send('visit', path || window.location.pathname, {})
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
    const fpPromise = computeFingerprint()
    fpPromise.then((fp) => {
      send('visit', path, {
        ...fp,
        referrer: document.referrer || '',
        sessionId,
        ...utmParams,
        ...getConnectionInfo(),
        ...getHardwareInfo(),
      })
    }).catch(() => {})
  }, [])

  return { trackVisit, trackQuery, trackSubstance, trackPage, trackPageOnce, trackFeedback }
}
