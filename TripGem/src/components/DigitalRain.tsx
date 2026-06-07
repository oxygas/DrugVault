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
    if (matchMedia('(pointer: coarse)').matches) return

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

    let accentRgb = { r: 255, g: 0, b: 170 }
    let secondaryRgb = { r: 207, g: 10, b: 110 }
    let frameCount = 0

    function updateThemeColors() {
      if (typeof window === 'undefined') return
      const style = getComputedStyle(document.documentElement)
      const aRgb = style.getPropertyValue('--accent2-rgb') || '255, 110, 199'
      const sRgb = style.getPropertyValue('--accent-rgb') || '139, 92, 246'
      
      const [ar, ag, ab] = aRgb.split(',').map(n => parseInt(n.trim(), 10))
      const [sr, sg, sb] = sRgb.split(',').map(n => parseInt(n.trim(), 10))
      
      accentRgb = { r: ar ?? 255, g: ag ?? 110, b: ab ?? 199 }
      secondaryRgb = { r: sr ?? 139, g: sg ?? 92, b: sb ?? 246 }
    }

    updateThemeColors()

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

      if (frameCount % 20 === 0) {
        updateThemeColors()
      }
      frameCount++

      ctx!.clearRect(0, 0, w, h)

      ctx!.font = '11px monospace'
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

          const relativeY = y / h
          let maskFactor = 1
          if (relativeY < 0.08) {
            maskFactor = Math.max(0, relativeY / 0.08)
          } else if (relativeY > 0.85) {
            maskFactor = 0
          } else if (relativeY > 0.35) {
            maskFactor = Math.max(0, 1 - (relativeY - 0.35) / 0.50)
          }

          const char = charPool[ci % charPool.length]
          ci++

          if (maskFactor <= 0) continue

          const isHead = i === 0

          if (isHead) {
            ctx!.fillStyle = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${0.9 * maskFactor})`
            ctx!.shadowColor = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${0.5 * maskFactor})`
            ctx!.shadowBlur = 8
            ctx!.fillText(char, drop.x, y)
            ctx!.shadowBlur = 0
          } else {
            const alpha = 0.15 * (1 - i / drop.length)
            ctx!.fillStyle = `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, ${alpha * maskFactor})`
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
      style={{ opacity: 0.4 }}
      aria-hidden="true"
    />
  )
}
