'use client'

import React from 'react'

interface StatsBarProps {
  stats: {
    total: number
    categories: number
    extremeCount: number
    highHarmCount: number
    highAddictionCount: number
    highOdRiskCount: number
    totalCombos: number
    dangerousCombos: number
    safeCombos: number
  }
  categories: { name: string; color: string; count: number }[]
  onStatClick?: (label: string) => void
}

const items = [
  { 
    valueKey: 'total' as const, label: 'Substances', color: 'var(--pink)', 
    Svg: ({ color }: { color: string }) => (
      <svg viewBox="0 0 24 24" className="w-8 h-8 lg:w-10 lg:h-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_12px_var(--svg-color)]" style={{ '--svg-color': color } as React.CSSProperties}>
        <path fill={color} opacity="0.15" d="M12 2L2 9l10 13 10-13-10-7z" />
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 9l10 13 10-13-10-7z" />
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M2 9h20M12 22V9M7 2l5 7M17 2l-5 7" />
      </svg>
    )
  },
  { 
    valueKey: 'categories' as const, label: 'Categories', color: 'var(--cyan)', 
    Svg: ({ color }: { color: string }) => (
      <svg viewBox="0 0 24 24" className="w-8 h-8 lg:w-10 lg:h-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_12px_var(--svg-color)]" style={{ '--svg-color': color } as React.CSSProperties}>
        <path fill={color} opacity="0.15" d="M12 3l10 5-10 5-10-5 10-5z" />
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M12 3l10 5-10 5-10-5z" />
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M2 14l10 5 10-5M2 19l10 5 10-5" />
      </svg>
    )
  },
  { 
    valueKey: 'safeCombos' as const, label: 'Safe Synergies', color: 'var(--green)', 
    Svg: ({ color }: { color: string }) => (
      <svg viewBox="0 0 24 24" className="w-8 h-8 lg:w-10 lg:h-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_12px_var(--svg-color)]" style={{ '--svg-color': color } as React.CSSProperties}>
        <path fill={color} opacity="0.15" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    )
  },
  { 
    valueKey: 'dangerousCombos' as const, label: 'Deadly Combos', color: 'var(--red)', 
    Svg: ({ color }: { color: string }) => (
      <svg viewBox="0 0 24 24" className="w-8 h-8 lg:w-10 lg:h-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_12px_var(--svg-color)]" style={{ '--svg-color': color } as React.CSSProperties}>
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        <path fill={color} opacity="0.15" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    )
  },
  { 
    valueKey: 'extremeCount' as const, label: 'Extreme Danger', color: 'var(--orange)', 
    Svg: ({ color }: { color: string }) => (
      <svg viewBox="0 0 24 24" className="w-8 h-8 lg:w-10 lg:h-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_12px_var(--svg-color)]" style={{ '--svg-color': color } as React.CSSProperties}>
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M12 2v4" />
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M12 18v4" />
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M4.93 4.93l2.83 2.83" />
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M16.24 16.24l2.83 2.83" />
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M2 12h4" />
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M18 12h4" />
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M4.93 19.07l2.83-2.83" />
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M16.24 7.76l2.83-2.83" />
        <circle fill={color} opacity="0.3" cx="12" cy="12" r="4" />
        <circle fill="none" stroke={color} strokeWidth="3" cx="12" cy="12" r="4" />
      </svg>
    )
  },
  { 
    valueKey: 'highHarmCount' as const, label: 'High Harm', color: 'var(--pink)', 
    Svg: ({ color }: { color: string }) => (
      <svg viewBox="0 0 24 24" className="w-8 h-8 lg:w-10 lg:h-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_12px_var(--svg-color)]" style={{ '--svg-color': color } as React.CSSProperties}>
        <path fill={color} opacity="0.15" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    )
  },
  { 
    valueKey: 'highAddictionCount' as const, label: 'High Addiction', color: 'var(--orange)', 
    Svg: ({ color }: { color: string }) => (
      <svg viewBox="0 0 24 24" className="w-8 h-8 lg:w-10 lg:h-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_12px_var(--svg-color)]" style={{ '--svg-color': color } as React.CSSProperties}>
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.53 1.53" />
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.53-1.53" />
      </svg>
    )
  },
  { 
    valueKey: 'highOdRiskCount' as const, label: 'High OD Risk', color: 'var(--accent3)', 
    Svg: ({ color }: { color: string }) => (
      <svg viewBox="0 0 24 24" className="w-8 h-8 lg:w-10 lg:h-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_12px_var(--svg-color)]" style={{ '--svg-color': color } as React.CSSProperties}>
        <path fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M2 12h5l3-6 4 12 3-6h5" />
        <path fill={color} opacity="0.15" d="M2 12h5l3-6 4 12 3-6h5" />
      </svg>
    )
  },
]

const StatsBar = React.memo(function StatsBar({ stats, categories, onStatClick }: StatsBarProps) {
  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>, color: string, label: string) => {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const circle = document.createElement('span')
    circle.classList.add('neon-ripple')
    circle.style.left = `${x}px`
    circle.style.top = `${y}px`
    circle.style.backgroundColor = color
    circle.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}`
    
    btn.appendChild(circle)
    setTimeout(() => circle.remove(), 600)
    
    onStatClick?.(label)
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-3">
      {items.map((item, i) => {
        const value = stats[item.valueKey]
        const isClickable = item.label !== 'Substances'
        const className = `metric-card group text-center p-3 sm:p-4 relative transition-all duration-500 w-full outline-none rounded-2xl overflow-hidden ${
          isClickable 
            ? 'hover:-translate-y-1 hover:shadow-lg hover:shadow-[color:var(--metric-c)]/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent)]' 
            : 'cursor-default'
        }`
        const style = { 
          '--metric-c': item.color, 
          contain: 'none', 
          animationDelay: `${i * 80}ms`,
          background: 'linear-gradient(145deg, rgba(20,20,20,0.4) 0%, rgba(5,5,5,0.7) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.05)',
        } as React.CSSProperties
        const innerContent = (
          <>
            {/* Subtle background glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="flex items-center justify-center mb-4 relative z-10 pt-2">
              <item.Svg color={item.color} />
            </div>
            <div className="text-3xl sm:text-4xl lg:text-4xl xl:text-3xl font-display font-bold tracking-tight font-mono leading-none mb-3" style={{ color: item.color, animation: `count-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 80 + 200}ms both` }}>
              {value}
            </div>
            <div className="w-8 h-px mx-auto mb-2 rounded-full opacity-30" style={{ background: `linear-gradient(90deg, transparent, ${item.color}, transparent)` }} />
            <span className="text-[11px] lg:text-xs text-[var(--text3)] font-semibold block leading-tight tracking-wider uppercase">{item.label}</span>
          </>
        )

        if (!isClickable) {
          return (
            <div key={item.label} className={className} style={style}>
              {innerContent}
            </div>
          )
        }

        return (
          <button
            key={item.label}
            onClick={(e) => handleRipple(e, item.color, item.label)}
            className={className}
            style={style}
          >
            {innerContent}
          </button>
        )
      })}
    </div>
  )
})

export default StatsBar
