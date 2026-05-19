'use client'

import { useEffect, useRef } from 'react'

interface ShortcutGroup {
  title: string
  shortcuts: { keys: string[]; label: string; description?: string }[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Alt', '1'], label: 'Substances', description: 'Switch to browse section' },
      { keys: ['Alt', '2'], label: 'Matrix', description: 'Switch to combination matrix' },
      { keys: ['Alt', '3'], label: 'Tools', description: 'Switch to interaction checker' },
    ],
  },
  {
    title: 'Search',
    shortcuts: [
      { keys: ['/'], label: 'Focus search', description: 'Jump to search bar' },
      { keys: ['Ctrl', 'K'], label: 'Quick search', description: 'Open search (Cmd+K on Mac)' },
    ],
  },
  {
    title: 'Popup / Modal',
    shortcuts: [
      { keys: ['Esc'], label: 'Close popup', description: 'Close substance detail or this panel' },
      { keys: ['?'], label: 'This panel', description: 'Toggle keyboard shortcuts help' },
    ],
  },
  {
    title: 'Interaction Checker',
    shortcuts: [
      { keys: ['Tab'], label: 'Next substance', description: 'Move to next selected substance' },
    ],
  },
]

interface KeyboardShortcutsModalProps {
  onClose: () => void
}

export default function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') onCloseRef.current()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <div
        className="glass-strong w-full max-w-md mx-4 sm:mx-auto rounded-2xl overflow-hidden"
        style={{ animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20">
              <svg className="w-4 h-4 text-[var(--accent2)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18m-7.5 6.75l-1.591 1.591M12 13.875l1.591-1.591M7.5 10.5H6.375m4.284-5.674l-1.59-1.59m-3.36 5.844l1.59 1.59" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white">Keyboard Shortcuts</h2>
              <p className="text-[11px] text-[var(--text4)]">Press ? or Esc to close</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[var(--text4)] hover:text-white"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map(group => (
            <div key={group.title}>
              <h3 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--text4)] mb-3">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map(shortcut => (
                  <div key={shortcut.label} className="flex items-center justify-between gap-4 py-1.5">
                    <span className="text-sm text-[var(--text3)]">{shortcut.label}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {shortcut.keys.map((key, i) => (
                        <span key={key} className="flex items-center gap-1">
                          <kbd className="px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.06)] border border-[var(--border2)] text-[11px] font-mono font-semibold text-[var(--text2)] shadow-sm">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-[var(--text4)] text-[11px]">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}