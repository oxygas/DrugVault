'use client'

interface StatsBarProps {
  stats: {
    total: number
    avgHarm: number
    avgAddiction: number
    extremeCount: number
    categories: number
  }
  categories: { name: string; color: string; count: number }[]
}

export default function StatsBar({ stats, categories }: StatsBarProps) {
  const items = [
    { value: stats.total, label: 'Substances', color: 'var(--accent)', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.25 12.75h3.75m-3.75 0H5.625' },
    { value: stats.categories, label: 'Categories', color: 'var(--cyan)', icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.568m0 4.432v4.5A2.25 2.25 0 005.25 21h4.568M14.432 21h4.318A2.25 2.25 0 0021 18.75v-4.318M21 9.75V5.25A2.25 2.25 0 0018.75 3h-4.318' },
    { value: stats.avgHarm, label: 'Avg Harm', color: 'var(--orange)', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
    { value: stats.avgAddiction, label: 'Avg Addiction', color: 'var(--pink)', icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
    { value: stats.extremeCount, label: 'Extreme Risk', color: 'var(--red)', icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="metric-card group text-center"
          style={{ '--metric-c': item.color, animationDelay: `${i * 80}ms` } as React.CSSProperties}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <div
              className="w-9 h-9 lg:w-11 lg:h-11 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `color-mix(in srgb, ${item.color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${item.color} 15%, transparent)` }}
            >
              <svg className="w-4.5 h-4.5 lg:w-5.5 lg:h-5.5" style={{ color: item.color }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight font-mono" style={{ color: item.color, animation: `count-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 80 + 200}ms both` }}>
            {item.value}
          </div>
          <span className="text-xs lg:text-sm text-[var(--text3)] font-medium mt-1.5 block">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
