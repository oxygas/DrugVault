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

    function resize() {
      w = canvas!.width = window.innerWidth
      h = canvas!.height = window.innerHeight
      const cols = Math.floor(w / 22)
      drops = Array.from({ length: cols }, (_, i) => ({
        x: i * 22,
        y: -(Math.random() * h),
        speed: 0.5 + Math.random() * 1.8,
        length: 10 + Math.floor(Math.random() * 18),
        delay: Math.random() * 80,
      }))
    }

    resize()
    window.addEventListener('resize', resize)

    function draw() {
      ctx!.clearRect(0, 0, w, h)

      for (const drop of drops) {
        if (drop.delay > 0) {
          drop.delay -= 0.3
          continue
        }

        drop.y += drop.speed

        if (drop.y - drop.length * 14 > h) {
          drop.y = -(drop.length * 14)
          drop.speed = 0.5 + Math.random() * 1.8
          drop.length = 10 + Math.floor(Math.random() * 18)
        }

        for (let i = 0; i < drop.length; i++) {
          const y = drop.y - i * 14
          if (y < 0 || y > h) continue

          const char = chars[Math.floor(Math.random() * chars.length)]
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

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="digital-rain-canvas fixed inset-0 pointer-events-none z-[1]"
      style={{ opacity: 0.2, maskImage: 'linear-gradient(to bottom, transparent 8%, black 35%, transparent 85%)' }}
      aria-hidden="true"
    />
  )
}
