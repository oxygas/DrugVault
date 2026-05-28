'use client'

import { useThemeStore } from '@/stores/theme'
import { THEMES } from '@/themes/config'
import { useSettingsStore } from '@/stores/settings'

export default function ThemeSelector() {
  const { themeId, themeOpen, setTheme, setThemeOpen } = useThemeStore()
  const settingsOpen = useSettingsStore(s => s.settingsOpen)

  if (!themeOpen) return null

  return (
    <div
      className="fixed inset-0 z-[111] flex items-end sm:items-center justify-center backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.6)', animation: 'fadeIn 0.2s ease-out' }}
      onClick={(e) => { if (e.target === e.currentTarget) setThemeOpen(false) }}
      role="dialog"
      aria-modal="true"
      aria-label="Theme selector"
    >
      <div
        className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden border border-[var(--border)]"
        style={{
          background: 'rgba(8,8,24,0.97)',
          backdropFilter: 'blur(20px)',
          animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
          maxHeight: '90dvh',
        }}
      >
        <div className="p-5 sm:p-6 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-[var(--accent2)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
            <h2 className="text-lg font-display font-bold text-white">Themes</h2>
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

        <div className="p-5 sm:p-6 overflow-y-auto max-h-[75dvh]">
          <p className="text-xs text-[var(--text4)] font-mono uppercase tracking-[0.15em] mb-4">
            Choose your vibe
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEMES.map(t => {
              const active = themeId === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`relative flex flex-col items-start gap-2.5 p-3.5 rounded-xl border transition-all duration-300 text-left ${
                    active
                      ? 'bg-[rgba(var(--accent-rgb),0.1)] border-[var(--accent2)] shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)]'
                      : 'bg-[rgba(255,255,255,0.02)] border-[var(--border)] hover:border-[var(--border2)] hover:bg-[rgba(255,255,255,0.04)]'
                  }`}
                >
                  {/* Color preview bar */}
                  <div className="flex gap-1 w-full">
                    {t.preview.map((c, i) => (
                      <div
                        key={i}
                        className="h-6 flex-1 rounded-md first:rounded-l-md last:rounded-r-md"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm font-semibold text-white flex-1">{t.name}</span>
                    {active && (
                      <svg className="w-4 h-4 text-[var(--accent2)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text4)] leading-tight">{t.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
