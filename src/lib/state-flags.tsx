'use client'

import { useState } from 'react'

const COLORS: Record<string, string> = {
  AL: '#AF1E2D', AK: '#0D2651', AZ: '#BF0A30', AR: '#002868',
  CA: '#AB2B1A', CO: '#002868', CT: '#003F87', DE: '#0058A1',
  DC: '#BF0A30', FL: '#002868', GA: '#BF0A30', HI: '#BF0A30',
  ID: '#003F87', IL: '#003F87', IN: '#003F87', IA: '#003F87',
  KS: '#003F87', KY: '#003F87', LA: '#003F87', ME: '#003F87',
  MD: '#AB1A24', MA: '#003F87', MI: '#003F87', MN: '#003F87',
  MS: '#BF0A30', MO: '#BF0A30', MT: '#003F87', NE: '#BF0A30',
  NV: '#003F87', NH: '#003F87', NJ: '#BF0A30', NM: '#BF0A30',
  NY: '#003F87', NC: '#BF0A30', ND: '#003F87', OH: '#BF0A30',
  OK: '#0072C6', OR: '#003F87', PA: '#003F87', RI: '#003F87',
  SC: '#003F87', SD: '#003F87', TN: '#BF0A30', TX: '#BF0A30',
  UT: '#003F87', VT: '#003F87', VA: '#003F87', WA: '#006233',
  WV: '#003F87', WI: '#003F87', WY: '#003F87',
}

export function StateFlagSvg({ code, className }: { code: string; className?: string }): React.ReactElement {
  const key = code.toUpperCase()
  const [errored, setErrored] = useState(false)

  if (errored) {
    const color = COLORS[key] || '#666'
    return (
      <svg viewBox="0 0 80 48" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className}>
        <rect width="80" height="48" fill="var(--bg3, #1a0e3d)" />
        <text x="40" y="30" textAnchor="middle" fontSize="14" fontFamily="var(--font-mono, monospace)" fontWeight="700" fill={color}>{key}</text>
      </svg>
    )
  }

  return (
    <img
      src={`/flags/states/${key.toLowerCase()}.svg`}
      alt=""
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      onError={() => setErrored(true)}
    />
  )
}
