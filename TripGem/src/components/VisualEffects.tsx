'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

const DigitalRain = dynamic(() => import('@/components/DigitalRain'), { ssr: false })

export default function VisualEffects() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [isTouch, setIsTouch] = useState(false)
  const [showDeferred, setShowDeferred] = useState(false)

  useEffect(() => {
    const r = requestAnimationFrame(() => {
      setIsTouch(matchMedia('(pointer: coarse)').matches)
    })
    return () => cancelAnimationFrame(r)
  }, [])

  useEffect(() => {
    function handleVisibility() {
      document.documentElement.classList.toggle('page-hidden', document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    if (isTouch) return

    let ticking = false
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--mx', `${e.clientX}px`)
          document.documentElement.style.setProperty('--my', `${e.clientY}px`)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isTouch])

  useEffect(() => {
    if (!isHome) return
    if (isTouch) return
    const id = requestAnimationFrame(() => setShowDeferred(true))
    return () => cancelAnimationFrame(id)
  }, [isHome, isTouch])

  // Scroll detection to temporarily disable hover styles for scroll performance
  useEffect(() => {
    let scrollTimeout: any = null
    const body = document.body

    const onScrollStart = () => {
      body.classList.add('is-scrolling')
    }

    const onScrollEnd = () => {
      body.classList.remove('is-scrolling')
    }

    const handleScroll = () => {
      if (!body.classList.contains('is-scrolling')) {
        onScrollStart()
      }
      if (scrollTimeout) clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(onScrollEnd, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    if ('onscrollend' in window) {
      window.addEventListener('scrollend', onScrollEnd, { passive: true })
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if ('onscrollend' in window) {
        window.removeEventListener('scrollend', onScrollEnd)
      }
      if (scrollTimeout) clearTimeout(scrollTimeout)
      body.classList.remove('is-scrolling')
    }
  }, [])

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
        <div className="orb orb-5" />
        <div className="orb orb-6" />
      </div>
      <div className="grid-noise" />
      <div className="cyber-grid" aria-hidden="true" />
      <div className="vaporwave-horizon" aria-hidden="true" />
      {isHome && !isTouch && <DigitalRain />}
      {isHome && showDeferred && !isTouch && (
        <div className="chromatic-overlay" aria-hidden="true" />
      )}
      {isHome && showDeferred && !isTouch && (
        <div className="particles" aria-hidden="true">
          {Array.from({ length: 25 }).map((_, i) => {
            const seed = i * 137.5
            const frac = (s: number) => Math.abs(Math.sin(seed * (s + 1)))
            const isSparkle = i >= 20
            const colors = [
              'var(--accent)',
              'var(--accent2)',
              'var(--accent3)',
              'var(--laser-cyan)',
              'var(--amber-glow)',
              'var(--neon-magenta)',
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
