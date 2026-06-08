'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

const DigitalRain = dynamic(() => import('@/components/DigitalRain'), { ssr: false })

interface Particle {
  x: number
  y: number
  size: number
  speedY: number
  driftSpeed: number
  driftPhase: number
  colorIndex: number
  isSparkle: boolean
  pulseSpeed: number
  pulsePhase: number
}

function getGlowColor(color: string, opacityHex: string = '20'): string {
  const trimmed = color.trim()
  if (trimmed.startsWith('#')) {
    return trimmed + opacityHex
  }
  if (trimmed.startsWith('rgb')) {
    const matches = trimmed.match(/\d+/g)
    if (matches && matches.length >= 3) {
      const opacityDecimal = parseInt(opacityHex, 16) / 255
      return `rgba(${matches[0]}, ${matches[1]}, ${matches[2]}, ${opacityDecimal})`
    }
  }
  return trimmed
}

export default function VisualEffects() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [isTouch, setIsTouch] = useState(false)
  const [showDeferred, setShowDeferred] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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
    let scrollTimeout: ReturnType<typeof setTimeout>
    const handleScroll = () => {
      if (!document.body.classList.contains('is-scrolling')) {
        document.body.classList.add('is-scrolling')
      }
    }
    const handleScrollEnd = () => {
      document.body.classList.remove('is-scrolling')
    }

    const hasScrollEnd = 'onscrollend' in window

    const fallbackScroll = () => {
      if (hasScrollEnd) return
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        handleScrollEnd()
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('scrollend', handleScrollEnd, { passive: true })
    
    if (!hasScrollEnd) {
      window.addEventListener('scroll', fallbackScroll, { passive: true })
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scrollend', handleScrollEnd)
      if (!hasScrollEnd) {
        window.removeEventListener('scroll', fallbackScroll)
        clearTimeout(scrollTimeout)
      }
    }
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



  // Canvas particle system
  useEffect(() => {
    if (!isHome || isTouch || !showDeferred) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    let lastTime = performance.now()
    const frameInterval = 1000 / 45 // Target 45 fps

    // Resize canvas
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize, { passive: true })
    handleResize()

    // Query theme colors
    let colors: string[] = []
    function refreshColors() {
      const style = getComputedStyle(document.documentElement)
      colors = [
        style.getPropertyValue('--accent').trim() || '#a855f7',
        style.getPropertyValue('--accent2').trim() || '#ec4899',
        style.getPropertyValue('--accent3').trim() || '#3b82f6',
        style.getPropertyValue('--laser-cyan').trim() || '#06b6d4',
        style.getPropertyValue('--amber-glow').trim() || '#f59e0b',
        style.getPropertyValue('--neon-magenta').trim() || '#d946ef',
      ]
    }
    refreshColors()

    // Watch for theme changes dynamically
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-theme') {
          refreshColors()
        }
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    // Generate particles
    const particleCount = 45
    const particles: Particle[] = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 1.2 + Math.random() * 2.8,
        speedY: -(0.3 + Math.random() * 0.7), // floating upwards
        driftSpeed: 0.12 + Math.random() * 0.28,
        driftPhase: Math.random() * Math.PI * 2,
        colorIndex: i % 6,
        isSparkle: i >= 35, // top 10 are sparkles
        pulseSpeed: 0.04 + Math.random() * 0.04,
        pulsePhase: Math.random() * Math.PI * 2,
      })
    }

    const drawAndUpdate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        p.y += p.speedY
        p.driftPhase += 0.008
        p.x += Math.sin(p.driftPhase) * p.driftSpeed

        // Wrap boundaries
        if (p.y < -20) {
          p.y = canvas.height + 20
          p.x = Math.random() * canvas.width
        } else if (p.y > canvas.height + 20) {
          p.y = -20
          p.x = Math.random() * canvas.width
        }

        if (p.x < -20) {
          p.x = canvas.width + 20
        } else if (p.x > canvas.width + 20) {
          p.x = -20
        }

        // Draw particle
        let currentSize = p.size
        const baseColor = colors[p.colorIndex]

        if (p.isSparkle) {
          p.pulsePhase += p.pulseSpeed
          currentSize = p.size * (0.6 + Math.abs(Math.sin(p.pulsePhase)) * 0.8)

          // Outer aura glow
          ctx.beginPath()
          ctx.arc(p.x, p.y, currentSize * 2.2, 0, Math.PI * 2)
          ctx.fillStyle = getGlowColor(baseColor, '20')
          ctx.fill()

          // Inner spark
          ctx.beginPath()
          ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2)
          ctx.fillStyle = baseColor
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2)
          ctx.fillStyle = baseColor
          ctx.fill()
        }
      }
    }

    const render = (time: number) => {
      // Pause drawing loop if tab is hidden or Solid State Mode is active
      if (document.hidden || document.documentElement.classList.contains('lo-fi-mode')) {
        animId = requestAnimationFrame(render)
        return
      }

      const elapsed = time - lastTime
      if (elapsed >= frameInterval) {
        lastTime = time - (elapsed % frameInterval)
        drawAndUpdate()
      }
      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      observer.disconnect()
    }
  }, [isHome, isTouch, showDeferred])

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
        <canvas ref={canvasRef} className="particles-canvas particles" aria-hidden="true" />
      )}
      <div className="mouse-glow" />
    </>
  )
}
