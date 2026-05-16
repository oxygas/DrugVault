'use client'

import { useRef, useEffect, memo } from 'react'
import type { Substance } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/types'

interface RadarChartProps {
  substance: Substance
  size?: number
}

export default memo(function RadarChart({ substance, size: propSize }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const size = rect.width
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const r = size * 0.33

    const catColor = CATEGORY_COLORS[substance.category] || '#a855f7'

    const axes = [
      { label: 'Harm', value: substance.harmScore },
      { label: 'Addict', value: substance.addictionScore },
      { label: 'OD Risk', value: substance.odRisk },
      { label: 'Withdrawal', value: substance.withdrawalSeverity },
      { label: 'Interaction', value: substance.interactionDanger },
      { label: 'Dependence', value: substance.dependenceLiability },
    ]
    const n = axes.length
    const angleStep = (Math.PI * 2) / n

    ctx.clearRect(0, 0, size, size)

    for (let ring = 1; ring <= 4; ring++) {
      ctx.beginPath()
      for (let i = 0; i <= n; i++) {
        const angle = i * angleStep - Math.PI / 2
        const rr = (r * ring) / 4
        const x = cx + rr * Math.cos(angle)
        const y = cy + rr * Math.sin(angle)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = ring === 4 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    ctx.beginPath()
    for (let i = 0; i <= n; i++) {
      const idx = i % n
      const angle = idx * angleStep - Math.PI / 2
      const val = axes[idx].value / 100
      const x = cx + r * val * Math.cos(angle)
      const y = cy + r * val * Math.sin(angle)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    grad.addColorStop(0, `${catColor}40`)
    grad.addColorStop(0.7, `${catColor}15`)
    grad.addColorStop(1, `${catColor}05`)
    ctx.fillStyle = grad
    ctx.fill()

    ctx.strokeStyle = `${catColor}90`
    ctx.lineWidth = 1.5
    ctx.shadowColor = catColor
    ctx.shadowBlur = 12
    ctx.stroke()
    ctx.shadowBlur = 0

    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2
      const val = axes[i].value / 100
      const x = cx + r * val * Math.cos(angle)
      const y = cy + r * val * Math.sin(angle)

      ctx.beginPath()
      ctx.arc(x, y, 3.5, 0, Math.PI * 2)
      ctx.fillStyle = catColor
      ctx.shadowColor = catColor
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    const fontSize = Math.max(9, size * 0.036)
    ctx.font = `500 ${fontSize}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2
      const labelR = r + size * 0.09
      const x = cx + labelR * Math.cos(angle)
      const y = cy + labelR * Math.sin(angle)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.fillText(axes[i].label, x, y)
      ctx.font = `600 ${fontSize * 0.85}px 'JetBrains Mono', monospace`
      ctx.fillStyle = `${catColor}cc`
      ctx.fillText(String(axes[i].value), x, y + fontSize + 3)
      ctx.font = `500 ${fontSize}px Inter, system-ui, sans-serif`
    }
  }, [substance, propSize])

  return (
    <div className="w-full flex justify-center">
      <canvas
        ref={canvasRef}
        className="w-full max-w-[260px] sm:max-w-[300px] lg:max-w-[340px]"
        style={{ aspectRatio: '1' }}
      />
    </div>
  )
})
