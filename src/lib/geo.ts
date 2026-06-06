'use client'

import { useState, useEffect } from 'react'

export interface GeoResult {
  countryCode: string
  stateCode?: string
  loading: boolean
}

export function useGeo(): GeoResult {
  const [result, setResult] = useState<GeoResult>({ countryCode: '', loading: true })

  useEffect(() => {
    let cancelled = false

    const cached = sessionStorage.getItem('tripgem_geo')
    if (cached) {
      try {
        const data = JSON.parse(cached)
        if (data.countryCode) {
          const t = setTimeout(() => {
            if (!cancelled) setResult({ countryCode: data.countryCode, stateCode: data.stateCode || undefined, loading: false })
          }, 0)
          return () => { cancelled = true; clearTimeout(t) }
        }
      } catch {}
    }

    fetch('https://ip-api.com/json/?fields=status,countryCode,region')
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.status === 'success') {
          const cc = data.countryCode || ''
          const region = data.region || undefined
          sessionStorage.setItem('tripgem_geo', JSON.stringify({ countryCode: cc, stateCode: region }))
          setResult({ countryCode: cc, stateCode: region, loading: false })
        } else if (!cancelled) {
          setResult({ countryCode: '', loading: false })
        }
      })
      .catch(() => {
        if (!cancelled) setResult({ countryCode: '', loading: false })
      })

    return () => { cancelled = true }
  }, [])

  return result
}
