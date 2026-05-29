'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

const DigitalRain = dynamic(() => import('@/components/DigitalRain'), { ssr: false })

export default function VisualEffects() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [showDeferred, setShowDeferred] = useState(false)

  useEffect(() => {
    if (!isHome) return
    const id = requestAnimationFrame(() => setShowDeferred(true))
    return () => cancelAnimationFrame(id)
  }, [isHome])

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>
      <div className="grid-noise" />
      <div className="cyber-grid" aria-hidden="true" />
      <div className="vaporwave-horizon" aria-hidden="true" />
      {isHome && <DigitalRain />}
      {isHome && showDeferred && (
        <div className="chromatic-overlay" aria-hidden="true" />
      )}
      {isHome && showDeferred && (
        <div className="particles" aria-hidden="true">
          {Array.from({ length: 25 }).map((_, i) => {
            const seed = i * 137.5
            const frac = (s: number) => Math.abs(Math.sin(seed * (s + 1)))
            const isSparkle = i >= 20
            const colors = [
              'rgba(207, 10, 110, 0.6)',
              'rgba(255, 0, 170, 0.6)',
              'rgba(229, 0, 75, 0.6)',
              'rgba(139, 0, 51, 0.5)',
              'rgba(168, 85, 247, 0.5)',
              'rgba(0, 240, 255, 0.4)',
            ]
            if (isSparkle) {
              return (
                <div
                  key={i}
                  className="particle-sparkle"
                  style={{
                    '--x': `${5 + frac(1) * 90}%`,
                    '--d': `${14 + frac(2) * 16}s`,
                    '--delay': `${frac(3) * 25}s`,
                    '--s': `${3 + frac(4) * 3}px`,
                    '--drift': `${-80 + frac(5) * 160}px`,
                    '--c': colors[i % 6],
                  } as React.CSSProperties}
                />
              )
            }
            return (
              <div
                key={i}
                className="particle"
                style={{
                  '--x': `${5 + frac(1) * 90}%`,
                  '--d': `${8 + frac(2) * 16}s`,
                  '--delay': `${frac(3) * 22}s`,
                  '--s': `${1.5 + frac(4) * 4}px`,
                  '--drift': `${-70 + frac(5) * 140}px`,
                  '--glow-blur': `${4 + frac(6) * 6}px`,
                  '--c': colors[i % 6],
                } as React.CSSProperties}
              />
            )
          })}
        </div>
      )}
      <div className="mouse-glow" />
    </>
  )
}
