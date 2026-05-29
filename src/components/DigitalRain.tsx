'use client'

import { useEffect, useRef } from 'react'

const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789:;./\'"[]{}!@#$%^&*()'

interface Drop {
  x: number
  y: number
  speed: number
  length: number
  delay: number
}

export default function DigitalRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    let drops: Drop[] = []
    let w = 0
    let h = 0
    let lastFrame = 0
    const FPS = 20
    const frameInterval = 1000 / FPS

    let charPool: string[] = []

    function getVpHeight() {
      return window.visualViewport?.height ?? window.innerHeight
    }

    function resize() {
      w = canvas!.width = window.innerWidth
      h = canvas!.height = getVpHeight()
      const cols = Math.floor(w / 28)
      drops = Array.from({ length: cols }, (_, i) => ({
        x: i * 28,
        y: -(Math.random() * h),
        speed: 0.4 + Math.random() * 0.8,
        length: 6 + Math.floor(Math.random() * 10),
        delay: Math.random() * 120,
      }))
      charPool = Array.from({ length: cols * 18 }, () => chars[Math.floor(Math.random() * chars.length)])
    }

    resize()

    function handleVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(animId)
      } else {
        lastFrame = performance.now()
        animId = requestAnimationFrame(draw)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('resize', resize)
    window.visualViewport?.addEventListener('resize', resize)

    function draw(now: number) {
      animId = requestAnimationFrame(draw)
      if (document.hidden) return
      const elapsed = now - lastFrame
      if (elapsed < frameInterval) return
      lastFrame = now - (elapsed % frameInterval)

      ctx!.clearRect(0, 0, w, h)

      let ci = 0
      for (const drop of drops) {
        if (drop.delay > 0) {
          drop.delay -= 0.15
          ci += drop.length
          continue
        }

        drop.y += drop.speed

        if (drop.y - drop.length * 14 > h) {
          drop.y = -(drop.length * 14)
          drop.speed = 0.4 + Math.random() * 0.8
          drop.length = 6 + Math.floor(Math.random() * 10)
        }

        for (let i = 0; i < drop.length; i++) {
          const y = drop.y - i * 14
          if (y < 0 || y > h) { ci++; continue }

          const char = charPool[ci % charPool.length]
          ci++
          const isHead = i === 0

          if (isHead) {
            ctx!.font = 'bold 12px monospace'
            ctx!.fillStyle = 'rgba(255, 0, 170, 0.9)'
            ctx!.shadowColor = 'rgba(255, 0, 170, 0.5)'
            ctx!.shadowBlur = 8
            ctx!.fillText(char, drop.x, y)
            ctx!.shadowBlur = 0
          } else {
            const alpha = 0.15 * (1 - i / drop.length)
            ctx!.font = '11px monospace'
            ctx!.fillStyle = `rgba(207, 10, 110, ${alpha})`
            ctx!.fillText(char, drop.x, y)
          }
        }
      }
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('resize', resize)
      window.visualViewport?.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={typeof window !== 'undefined' ? window.innerWidth : 1920}
      height={typeof window !== 'undefined' ? window.innerHeight : 1080}
      className="digital-rain-canvas fixed inset-0 pointer-events-none z-[1]"
      style={{ opacity: 0.2, maskImage: 'linear-gradient(to bottom, transparent 8%, black 35%, transparent 85%)' }}
      aria-hidden="true"
    />
  )
}
