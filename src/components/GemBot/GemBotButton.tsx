'use client'

import { useGemBotStore } from '@/stores/gembot'
import { GemBotOverlay } from './GemBotOverlay'

export function GemBotButton() {
  const { isOpen, toggle } = useGemBotStore()

  return (
    <>
      <button
        onClick={toggle}
        className="fixed bottom-6 left-4 z-[10001] flex size-12 items-center justify-center rounded-full border-2 border-[var(--cyan)]/60 bg-[var(--bg3)] backdrop-blur-sm shadow-lg shadow-[var(--cyan)]/20 transition-all hover:scale-110 hover:border-[var(--cyan)] hover:shadow-[var(--cyan)]/40 active:scale-95"
        style={{
          boxShadow: isOpen
            ? '0 0 20px var(--cyan), 0 0 8px var(--cyan)'
            : '0 0 10px rgba(6, 182, 212, 0.4)',
          animation: 'gembot-pulse 2s ease-in-out infinite',
        }}
        aria-label={isOpen ? 'Close GemBot' : 'Open GemBot'}
        aria-expanded={isOpen}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--cyan)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        
      </button>
      <GemBotOverlay />

      <style jsx global>{`
        @keyframes gembot-pulse {
          0%, 100% { box-shadow: 0 0 10px rgba(6, 182, 212, 0.4), 0 0 20px rgba(6, 182, 212, 0.1); }
          50% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.7), 0 0 40px rgba(6, 182, 212, 0.3), 0 0 60px rgba(6, 182, 212, 0.1); }
        }
      `}</style>
    </>
  )
}
