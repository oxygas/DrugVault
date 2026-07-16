'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useScrollLock } from '@/lib/use-scroll-lock'
import { useThemeStore } from '@/stores/theme'
import { THEMES, getTheme, type ThemeDefinition } from '@/themes/config'

const THEME_GROUPS = [
  { label: 'Neon', ids: ['plasma', 'synthwave', 'cyberpunk', 'hyperfuse', 'vaporwave'] },
  { label: 'Dark', ids: ['midnight', 'matrix', 'terminal', 'oled', 'void', 'obsidian'] },
  { label: 'Warm', ids: ['sunset', 'blood', 'ember', 'amber', 'royal'] },
  { label: 'Cool', ids: ['aurora', 'ocean', 'arctic', 'galaxy', 'mint'] },
  { label: 'Soft', ids: ['rose-gold', 'sakura', 'emerald'] },
]

function PreviewBanner({ theme }: { theme: ThemeDefinition }) {
  return (
    <div
      className="w-full h-24 sm:h-28 rounded-xl overflow-hidden relative border border-[var(--border)]"
      style={{
        background: `linear-gradient(135deg, ${theme.accent}25, ${theme.accent2}18, ${theme.plasma}12)`,
        transition: 'background 0.3s ease',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center gap-3">
        {theme.preview.map((c, i) => (
          <div
            key={i}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10"
            style={{ background: c, boxShadow: `0 0 20px ${c}40` }}
          />
        ))}
      </div>
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
        <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">{theme.name}</span>
        <span className="text-[10px] font-mono text-white/30">{THEMES.length} themes</span>
      </div>
    </div>
  )
}

export default function ThemeSelector() {
  const themeId = useThemeStore(s => s.themeId)
  const themeOpen = useThemeStore(s => s.themeOpen)
  const setTheme = useThemeStore(s => s.setTheme)
  const setThemeOpen = useThemeStore(s => s.setThemeOpen)

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const previewTheme = useMemo(
    () => hoveredId ? getTheme(hoveredId) : getTheme(themeId),
    [hoveredId, themeId]
  )

  const containerRef = useRef<HTMLDivElement | null>(null)
  useScrollLock(themeOpen)

  useEffect(() => {
    if (!themeOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setThemeOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [themeOpen, setThemeOpen])

  const handleThemeHover = useCallback((id: string | null) => {
    setHoveredId(id)
  }, [])

  if (!themeOpen) return null

  const groupedThemes = THEME_GROUPS.map(g => ({
    ...g,
    themes: g.ids.map(id => THEMES.find(t => t.id === id)).filter(Boolean) as ThemeDefinition[],
  })).filter(g => g.themes.length > 0)

  // Any themes not in a group
  const groupedIds = new Set(THEME_GROUPS.flatMap(g => g.ids))
  const ungrouped = THEMES.filter(t => !groupedIds.has(t.id))
  if (ungrouped.length > 0) {
    groupedThemes.push({ label: 'Other', ids: ungrouped.map(t => t.id), themes: ungrouped })
  }

  return (
    <div
      className="fixed inset-0 z-[111] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', animation: 'fadeIn 0.15s ease-out' }}
      onClick={(e) => { if (e.target === e.currentTarget) setThemeOpen(false) }}
      role="dialog"
      aria-modal="true"
      aria-label="Theme selector"
    >
      <div
        ref={containerRef}
        className="w-full sm:max-w-4xl rounded-t-2xl sm:rounded-2xl overflow-hidden border border-[var(--border)]"
        style={{
          background: 'rgba(8,8,24,0.98)',
          transform: 'translateY(0)',
          willChange: 'transform',
          animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-[var(--accent2)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
            <h2 className="text-lg font-display font-bold text-white">Themes</h2>
            <span className="text-[10px] font-mono text-[var(--text4)] bg-[rgba(255,255,255,0.06)] px-2 py-0.5 rounded-full">
              {THEMES.length}
            </span>
          </div>
          <button
            onClick={() => setThemeOpen(false)}
            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[var(--text4)] hover:text-white"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="p-4 sm:p-5 overflow-y-auto" style={{ maxHeight: '75vh', overscrollBehavior: 'contain' }}>
          {/* Live preview banner */}
          <div className="mb-4">
            <PreviewBanner theme={previewTheme} />
          </div>

          {/* Grouped theme sections */}
          <div className="space-y-5">
            {groupedThemes.map(group => (
              <div key={group.label}>
                <p className="text-[10px] text-[var(--text4)] font-mono uppercase tracking-[0.2em] mb-2.5 px-1">
                  {group.label}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {group.themes.map(t => {
                    const active = themeId === t.id
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        onMouseEnter={() => handleThemeHover(t.id)}
                        onMouseLeave={() => handleThemeHover(null)}
                        className={`flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-all duration-200 ${
                          active
                            ? 'bg-[rgba(var(--accent-rgb),0.1)] border-[var(--accent2)] ring-1 ring-[var(--accent2)] shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)]'
                            : 'bg-[rgba(255,255,255,0.02)] border-[var(--border)] hover:border-[var(--border2)] hover:bg-[rgba(255,255,255,0.04)] hover:shadow-[0_0_12px_rgba(255,255,255,0.03)]'
                        }`}
                      >
                        <div className="flex gap-0.5 w-full">
                          {t.preview.map((c, i) => (
                            <div
                              key={i}
                              className="h-5 flex-1 rounded-sm first:rounded-l-md last:rounded-r-md"
                              style={{ background: c }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5 w-full">
                          <span className="text-[13px] font-semibold text-white flex-1">{t.name}</span>
                          {active && (
                            <svg className="w-3.5 h-3.5 text-[var(--accent2)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--text4)] leading-tight line-clamp-1">{t.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
