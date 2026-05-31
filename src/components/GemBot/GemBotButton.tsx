'use client'

import { useGemBotStore } from '@/stores/gembot'
import { GemBotOverlay } from './GemBotOverlay'

export function GemBotButton() {
  const { isOpen, toggle } = useGemBotStore()

  return (
    <>
      <button
        onClick={toggle}
        className="fixed bottom-6 left-4 z-[10001] flex size-12 items-center justify-center rounded-full border-2 border-[var(--accent)]/50 bg-[var(--bg3)] backdrop-blur-sm shadow-lg shadow-[var(--accent)]/20 transition-all hover:scale-110 hover:border-[var(--accent)] hover:shadow-[var(--accent)]/40 active:scale-95"
        style={{
          boxShadow: isOpen
            ? '0 0 20px var(--accent), 0 0 8px var(--accent)'
            : '0 0 10px rgba(168, 85, 247, 0.4)',
          animation: 'gembot-pulse 2s ease-in-out infinite',
        }}
        aria-label={isOpen ? 'Close GemBot' : 'Open GemBot'}
        aria-expanded={isOpen}
      >
        <img
          src="/og-image.gif"
          alt="TripGem"
          className="size-7 rounded-md"
          style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.5))' }}
        />
      </button>
      <GemBotOverlay />

      <style jsx global>{`
        @keyframes gembot-pulse {
          0%, 100% { box-shadow: 0 0 10px rgba(168, 85, 247, 0.4), 0 0 20px rgba(168, 85, 247, 0.1); }
          50% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.7), 0 0 40px rgba(168, 85, 247, 0.3), 0 0 60px rgba(168, 85, 247, 0.1); }
        }
      `}</style>
    </>
  )
}
